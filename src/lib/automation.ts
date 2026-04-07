import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiClient } from "@/lib/gemini";
import { parseLyricsText } from "@/lib/lyrics";
import { normalizeGeneratedScenes } from "@/lib/scenes";
import {
  buildImagePrompt,
  buildLyricsPrompt,
  buildMusicPrompt,
  buildScenesPrompt,
  buildVideoPrompt,
  getCatalogueCharacterPreset,
  getCatalogueMusicSpec,
  getCatalogueVisualStyle,
} from "@/lib/prompts";
import { getAudioDuration, renderFinalVideo } from "@/lib/render";
import { generateAccurateSubtitlesFromAudio } from "@/lib/subtitles";
import { uploadVideoToYouTube } from "@/lib/youtube";
import { Lyrics, Project, Scene, ThemeIdea } from "@/types/project";
import { calculateProjectCost, DEFAULT_OPTIONS } from "@/lib/pricing";
import pLimit from "p-limit";
import path from "node:path";
import os from "node:os";
import { writeFile, rm } from "node:fs/promises";

type AutomationStatus = "queued" | "running" | "done" | "error";

type AutomationJobRow = {
  id: string;
  run_date: string;
  slot_index: number;
  category_slug: string;
  title: string;
  prompt: string;
  status: AutomationStatus;
  project_id: string | null;
  song_id: string | null;
};

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[Retry ${attempt}/${attempts}] ${label} failed: ${message}`);

      if (attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }

  throw lastError;
}

async function uploadBuffer(bucket: "videos" | "thumbnails" | "music", path: string, data: Buffer, contentType: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(bucket).upload(path, data, {
    cacheControl: "3600",
    upsert: true,
    contentType,
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export interface TokenUsage {
  input: number;
  output: number;
}

async function generateLyrics(theme: ThemeIdea & { prompt: string }): Promise<{ lyrics: Lyrics; tokens: TokenUsage }> {
  const ai = getGeminiClient();
  const response = await withRetry("generateLyrics", () =>
    ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: buildLyricsPrompt(theme.title, theme.prompt),
      config: { temperature: 1.0 },
    })
  );
  const lyrics = parseLyricsText(response.text ?? "");
  if (!lyrics) throw new Error("Failed to parse generated lyrics");
  
  return { 
    lyrics, 
    tokens: {
      input: response.usageMetadata?.promptTokenCount ?? 0,
      output: response.usageMetadata?.candidatesTokenCount ?? 0,
    }
  };
}

async function generateScenes(lyrics: Lyrics, theme: ThemeIdea, numScenes = 8, audioDuration?: number): Promise<{ characterDescription: string; visualStyle: string; scenes: Scene[]; tokens: TokenUsage }> {
  const ai = getGeminiClient();
  const lyricsText = Object.entries(lyrics)
    .map(([section, lines]) => `[${section}]\n${(lines as string[]).join("\n")}`)
    .join("\n\n");
  const result = await withRetry("generateScenes", () =>
    ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: buildScenesPrompt(lyricsText, theme.title, numScenes),
      config: { responseMimeType: "application/json", temperature: 0.8 },
    })
  );
  
  let parsed = { characterDescription: "", visualStyle: "", scenes: [] as Array<Record<string, string>> };
  try {
    parsed = JSON.parse(result.text ?? "{}");
  } catch (e) {
    console.error("Failed to parse scenes JSON", e);
  }
  
  return {
    characterDescription: parsed.characterDescription || getCatalogueCharacterPreset(theme.categorySlug),
    visualStyle: parsed.visualStyle || getCatalogueVisualStyle(theme.categorySlug),
    scenes: normalizeGeneratedScenes(parsed.scenes || [], lyrics, numScenes, audioDuration),
    tokens: {
      input: result.usageMetadata?.promptTokenCount ?? 0,
      output: result.usageMetadata?.candidatesTokenCount ?? 0,
    }
  };
}

async function generateImageBase64(description: string, characterReferenceBase64?: string, aspectRatio: string = "16:9") {
  const ai = getGeminiClient();
  
  let promptText = buildImagePrompt(description);
  if (characterReferenceBase64) {
    promptText = `Use the attached image as the main character reference. Place this EXACT character into the following new scene and pose:

${promptText}

CRITICAL: The background, pose, and environment MUST match the new scene description. Do NOT just recreate the reference image's blank background. Maintain the character's facial features and clothing perfectly.`;
  }
  
  const contents: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: promptText },
  ];
  if (characterReferenceBase64) {
    contents.push({ inlineData: { mimeType: "image/png", data: characterReferenceBase64 } });
  }
  const result = await withRetry("generateImageBase64", () =>
    ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: aspectRatio as any, imageSize: "2K" },
      },
    }),
  4);
  const imagePart = result.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
  if (!imagePart?.inlineData?.data) throw new Error("No image generated");
  return { data: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType || "image/png" };
}

async function generateVideoFromImage(imageBase64: string, prompt: string, aspectRatio: string = "16:9") {
  const ai = getGeminiClient();
  let operation = await withRetry("generateVideoFromImage.start", () =>
    ai.models.generateVideos({
      model: "veo-3.1-lite-generate-preview",
      prompt,
      image: { imageBytes: imageBase64, mimeType: "image/png" },
      config: {
        aspectRatio: aspectRatio as any,
        resolution: "720p",
        durationSeconds: 6,
        numberOfVideos: 1,
        personGeneration: "allow_adult",
      },
    })
  );
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (operation.done) break;
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await withRetry("generateVideoFromImage.poll", () => ai.operations.getVideosOperation({ operation }));
  }
  const video = operation.response?.generatedVideos?.[0]?.video;
  if (!video?.uri) throw new Error("No video generated");
  return video.uri;
}

async function generateMusic(lyrics: Lyrics, theme: ThemeIdea) {
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) throw new Error("REPLICATE_API_TOKEN not set");

  const lyricsText = [...lyrics.verse1, ...lyrics.chorus, ...lyrics.verse2, ...lyrics.outro].join("\n");
  const spec = getCatalogueMusicSpec(theme.categorySlug);
  const prompt = buildMusicPrompt(lyricsText, theme.title, spec.genre, spec.mood, spec.tempo, spec.instruments);

  // Start Replicate prediction (Lyria 3 Pro — up to 3 minutes)
  const createRes = await fetch("https://api.replicate.com/v1/models/google/lyria-3-pro/predictions", {
    method: "POST",
    headers: { Authorization: `Bearer ${replicateToken}`, "Content-Type": "application/json", "Prefer": "wait" },
    body: JSON.stringify({ input: { prompt } }),
  });
  if (!createRes.ok) throw new Error(`Replicate Lyria create failed: ${createRes.status} ${(await createRes.text()).slice(0, 200)}`);
  let prediction = await createRes.json();

  // Poll for completion (max 10 min)
  for (let attempt = 0; attempt < 60; attempt++) {
    if (prediction.status === "succeeded" || prediction.status === "failed" || prediction.status === "canceled") break;
    await new Promise(r => setTimeout(r, 10000));
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${replicateToken}` },
    });
    prediction = await pollRes.json();
  }

  if (prediction.status !== "succeeded" || !prediction.output) {
    throw new Error(`Replicate Lyria ${prediction.status}: ${prediction.error || "no output"}`);
  }

  // Download MP3 from Replicate URL and convert to base64 (downstream code expects base64)
  const audioUrl = typeof prediction.output === "string" ? prediction.output : prediction.output[0];
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) throw new Error(`Failed to download audio: ${audioRes.status}`);
  const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
  const audioBase64 = audioBuffer.toString("base64");

  return { audioBase64, mimeType: "audio/mp3", spec };
}

export async function enqueueDailyAutomationJobs(count = 10) {
  const ai = getGeminiClient();
  const supabase = createAdminClient();
  
  // Prompt Gemini to generate totally random and unique ideas across categories
  const categories = [
    "lullabies-sleep", "learning-discovery", "animals-nature", 
    "daily-routines", "active-playtime", "emotions-feelings", "story-imagination"
  ];
  
  // Fetch existing titles to avoid duplicates
  const { data: existingSongs } = await supabase.from("songs").select("title").limit(500);
  const { data: existingQueued } = await supabase.from("automation_jobs").select("title").in("status", ["queued", "running"]);
  const existingTitles = [
    ...(existingSongs || []).map((s: { title: string }) => s.title.replace(/ Song$/, "")),
    ...(existingQueued || []).map((j: { title: string }) => j.title),
  ];
  const existingList = existingTitles.length > 0
    ? `\n\nALREADY EXISTING (DO NOT use these titles or similar concepts):\n${existingTitles.map(t => `- ${t}`).join("\n")}`
    : "";

  console.log(`Generating ${count} unique ideas (excluding ${existingTitles.length} existing)...`);

  const prompt = `You are a creative children's content director. Generate EXACTLY ${count} highly unique, engaging, and diverse song theme ideas for children aged 2-6.

RULES:
1. Spread the ideas evenly across these specific categories: ${categories.join(", ")}.
2. Do NOT repeat common tropes (like "twinkle star" or "wheels on the bus"). Invent totally new concepts (e.g., "A purple alien learning to brush his teeth", "A submarine made of jellybeans").
3. Every title MUST be completely different from existing songs listed below. Do NOT create similar themes or variations of existing titles.
4. Return a JSON array of exactly ${count} objects.
5. Each object must have:
   - "title": A catchy, punchy song title (2-4 words max)
   - "prompt": A highly descriptive, single-sentence prompt of what the song is about and the visual theme.
   - "category_slug": The exact category slug from the list above that fits best.
${existingList}

Output ONLY valid JSON, no markdown formatting blocks.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.9, // high temp for maximum creativity
    },
  });

  let parsed = JSON.parse(response.text ?? "[]") as Array<{ title: string, prompt: string, category_slug: string }>;
  if (!parsed || parsed.length === 0) {
    throw new Error("Gemini failed to generate song ideas.");
  }

  // Filter out any duplicates that Gemini still generated
  const existingSet = new Set(existingTitles.map(t => t.toLowerCase().trim()));
  parsed = parsed.filter(idea => !existingSet.has(idea.title.toLowerCase().trim()));
  console.log(`${parsed.length} unique ideas after dedup filter`);

  const today = new Date().toISOString().slice(0, 10);
  
  // To avoid slot_index collisions if this is called multiple times a day, 
  // find the current max slot index for today
  const { data: existingJobs } = await supabase
    .from("automation_jobs")
    .select("slot_index")
    .eq("run_date", today)
    .order("slot_index", { ascending: false })
    .limit(1);
    
  const startSlot = existingJobs && existingJobs.length > 0 ? existingJobs[0].slot_index + 1 : 0;

  const rows = parsed.map((idea, i) => {
    return {
      run_date: today,
      slot_index: startSlot + i,
      category_slug: idea.category_slug,
      title: idea.title,
      prompt: idea.prompt,
      status: "queued",
    };
  });

  const { error } = await supabase.from("automation_jobs").upsert(rows, { onConflict: "run_date,slot_index" });
  if (error) throw error;
  
  return rows.length;
}

export async function processJobById(jobId: string) {
  const supabase = createAdminClient();
  const { data: jobs, error: loadError } = await supabase
    .from("automation_jobs")
    .update({ status: "running", started_at: new Date().toISOString(), error: null })
    .eq("id", jobId)
    .eq("status", "queued")
    .select("*");

  if (loadError) throw loadError;
  const job = (jobs?.[0] || null) as AutomationJobRow | null;
  if (!job) throw new Error(`Job ${jobId} not found or not in queued status`);

  return _processJob(job);
}

export async function processNextAutomationJob() {
  const supabase = createAdminClient();
  const { data: jobs, error: loadError } = await supabase
    .from("automation_jobs")
    .update({ status: "running", started_at: new Date().toISOString(), error: null })
    .eq("status", "queued")
    .in("id", (
      await supabase
        .from("automation_jobs")
        .select("id")
        .eq("status", "queued")
        .order("run_date", { ascending: true })
        .order("slot_index", { ascending: true })
        .limit(1)
    ).data?.map(d => d.id) || [])
    .select("*");

  if (loadError) throw loadError;
  const job = (jobs?.[0] || null) as AutomationJobRow | null;
  if (!job) return null;

  return _processJob(job);
}

// ── Multi-step pipeline (each step < 800s for Vercel) ──────────────

function buildThemeFromJob(job: AutomationJobRow) {
  return {
    title: job.title,
    prompt: job.prompt,
    desc: job.prompt,
    icon: "music_note" as const,
    categorySlug: job.category_slug,
    color: "bg-secondary-container" as const,
    iconColor: "text-on-secondary-container" as const,
  };
}

async function loadJob(jobId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("automation_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (!data) throw new Error(`Job ${jobId} not found`);
  return data as AutomationJobRow & { current_step?: string };
}

async function updateJobStep(jobId: string, step: string, extra?: Record<string, unknown>) {
  const supabase = createAdminClient();
  await supabase.from("automation_jobs").update({ current_step: step, ...extra }).eq("id", jobId);
}

async function failJob(jobId: string, error: unknown) {
  const supabase = createAdminClient();
  await supabase.from("automation_jobs").update({
    status: "error",
    error: error instanceof Error ? error.message : "Step failed",
    completed_at: new Date().toISOString(),
  }).eq("id", jobId);
}

/**
 * Step 1: Prep — lyrics, music, scenes text, subtitles, character reference.
 * Creates project + scene rows in DB.
 */
export async function stepPrep(jobId: string) {
  const supabase = createAdminClient();
  const job = await loadJob(jobId);
  const theme = buildThemeFromJob(job);

  await supabase.from("automation_jobs").update({
    status: "running",
    started_at: new Date().toISOString(),
    current_step: "prep",
    error: null,
  }).eq("id", jobId);

  try {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    console.log(`[Job ${jobId}] [prep] Generating lyrics...`);
    const { lyrics, tokens: lyricsTokens } = await generateLyrics(theme);
    totalInputTokens += lyricsTokens.input;
    totalOutputTokens += lyricsTokens.output;

    const projectId = crypto.randomUUID();

    console.log(`[Job ${jobId}] [prep] Generating music...`);
    const soundtrack = await generateMusic(lyrics, theme);
    const soundtrackPath = `soundtracks/${projectId}.mp3`;

    let soundtrackUrl: string | null = null;
    try {
      soundtrackUrl = await uploadBuffer("music", soundtrackPath, Buffer.from(soundtrack.audioBase64, "base64"), "audio/mp3");
    } catch (err) {
      console.warn(`[Job ${jobId}] [prep] Music upload skipped:`, err instanceof Error ? err.message : err);
    }

    // Estimate duration from base64 size (ffprobe not available on Vercel serverless)
    // Lyria Pro outputs ~192kbps MP3. decoded_bytes / 24000 ≈ duration in seconds
    const decodedBytes = soundtrack.audioBase64.length * 3 / 4;
    const audioDuration = Math.max(30, Math.min(210, Math.round(decodedBytes / 24000)));

    const numDynamicScenes = Math.ceil(audioDuration / 6);
    console.log(`[Job ${jobId}] [prep] Audio ~${audioDuration}s (${Math.round(decodedBytes/1024)}KB) → ${numDynamicScenes} scenes`);

    const scenesData = await generateScenes(lyrics, theme, numDynamicScenes, audioDuration);
    totalInputTokens += scenesData.tokens.input;
    totalOutputTokens += scenesData.tokens.output;

    let exactSubtitles;
    try {
      const subtitleData = await generateAccurateSubtitlesFromAudio(soundtrack.audioBase64, soundtrack.mimeType, lyrics, audioDuration);
      exactSubtitles = subtitleData.subtitles;
      totalInputTokens += subtitleData.tokens.input;
      totalOutputTokens += subtitleData.tokens.output;
    } catch {
      console.warn(`[Job ${jobId}] [prep] Subtitles failed, will use proportional timing`);
    }

    console.log(`[Job ${jobId}] [prep] Generating character reference...`);
    const charDesc = `Create a 3D children's animation character design sheet for a music video. Character: ${scenesData.characterDescription}. Visual style: ${scenesData.visualStyle}. Show one cute main character in a front-facing neutral standing pose on a clean white background.`;
    const characterImage = await generateImageBase64(charDesc);
    const characterReferenceUrl = await uploadBuffer(
      "thumbnails",
      `generated/${projectId}/character-reference.png`,
      Buffer.from(characterImage.data, "base64"),
      characterImage.mimeType,
    );

    // Save project to DB
    const selectedTheme: ThemeIdea = { title: theme.title, desc: theme.prompt, icon: theme.icon, categorySlug: theme.categorySlug, color: theme.color, iconColor: theme.iconColor };
    const { error: projErr } = await supabase.from("projects").insert({
      id: projectId,
      title: `${theme.title} Song`,
      description: theme.prompt,
      status: "rendering",
      selected_theme: selectedTheme,
      custom_prompt: theme.prompt,
      lyrics,
      music: {
        audioBase64: soundtrack.audioBase64,
        audioUrl: soundtrackUrl,
        audioStoragePath: soundtrackPath,
        mimeType: soundtrack.mimeType,
        genre: soundtrack.spec.genre,
        mood: soundtrack.spec.mood,
        tempo: soundtrack.spec.tempo,
        status: "done",
        audioDuration,
        exactSubtitles,
        totalInputTokens,
        totalOutputTokens,
        characterDescription: scenesData.characterDescription,
        visualStyle: scenesData.visualStyle,
        characterImageBase64: characterImage.data,
        aspectRatio: (job as any).aspect_ratio || "16:9",
      },
      character_reference_base64: characterImage.data,
      character_reference_url: characterReferenceUrl,
      render_status: "prep",
    });
    if (projErr) throw projErr;

    // Save scene rows
    const sceneRows = scenesData.scenes.map((scene) => ({
      project_id: projectId,
      scene_number: scene.id,
      title: scene.title,
      time_range: scene.time,
      lyrics: scene.lyrics,
      description: scene.description,
      status: "pending",
      video_status: "idle",
    }));
    const { error: scErr } = await supabase.from("scenes").insert(sceneRows);
    if (scErr) throw scErr;

    await updateJobStep(jobId, "prep", { project_id: projectId });
    console.log(`[Job ${jobId}] [prep] Done. Project ${projectId}, ${scenesData.scenes.length} scenes.`);
    return { projectId };
  } catch (error) {
    await failJob(jobId, error);
    throw error;
  }
}

/**
 * Step 2: Images — generate all scene images in parallel.
 */
export async function stepImages(jobId: string) {
  const supabase = createAdminClient();
  const job = await loadJob(jobId);
  if (!job.project_id) throw new Error("No project_id on job");
  await updateJobStep(jobId, "images");

  try {
    const { data: project } = await supabase.from("projects").select("music, character_reference_base64").eq("id", job.project_id).single();
    if (!project) throw new Error("Project not found");
    const music = project.music as Record<string, unknown>;
    const visualStyle = (music.visualStyle as string) || "";
    const characterImageBase64 = (music.characterImageBase64 as string) || project.character_reference_base64;
    const aspectRatio = (music.aspectRatio as string) || "16:9";

    const { data: scenes } = await supabase
      .from("scenes")
      .select("id, scene_number, description")
      .eq("project_id", job.project_id)
      .is("image_url", null)
      .order("scene_number", { ascending: true });

    if (!scenes || scenes.length === 0) {
      console.log(`[Job ${jobId}] [images] All images already done.`);
      return;
    }

    console.log(`[Job ${jobId}] [images] Generating ${scenes.length} images (${aspectRatio})...`);
    const limit = pLimit(10);
    const tasks = scenes.map((scene) => limit(async () => {
      const fullDesc = `${scene.description}. Visual Style: ${visualStyle}`;
      const img = await generateImageBase64(fullDesc, characterImageBase64, aspectRatio);
      const imageUrl = await uploadBuffer(
        "thumbnails",
        `generated/${job.project_id}/scene-${scene.scene_number}.png`,
        Buffer.from(img.data, "base64"),
        img.mimeType,
      );
      await supabase.from("scenes").update({ image_url: imageUrl, status: "image_done" }).eq("id", scene.id);
      console.log(`[Job ${jobId}] [images] Scene ${scene.scene_number} done`);
      return { sceneId: scene.id, imageBase64: img.data };
    }));

    await Promise.all(tasks);
    console.log(`[Job ${jobId}] [images] All ${scenes.length} images done.`);
  } catch (error) {
    await failJob(jobId, error);
    throw error;
  }
}

/**
 * Step 3a: Generate a single scene's video (one Veo call per Vercel function).
 */
export async function stepVideoOne(jobId: string, sceneId: string) {
  const supabase = createAdminClient();
  const job = await loadJob(jobId);
  if (!job.project_id) throw new Error("No project_id on job");

  const { data: scene } = await supabase
    .from("scenes")
    .select("id, scene_number, description, image_url")
    .eq("id", sceneId)
    .single();
  if (!scene || !scene.image_url) throw new Error(`Scene ${sceneId} not found or no image`);

  try {
    console.log(`[Job ${jobId}] [video-one] Scene ${scene.scene_number}: starting...`);
    const imgResponse = await fetch(scene.image_url);
    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const imgBase64 = imgBuffer.toString("base64");

    const videoUrl = await generateVideoFromImage(imgBase64, buildVideoPrompt(scene.description));

    await supabase.from("scenes").update({
      video_file_name: videoUrl,
      video_status: "done",
      status: "done",
    }).eq("id", sceneId);

    console.log(`[Job ${jobId}] [video-one] Scene ${scene.scene_number}: done`);
  } catch (error) {
    console.error(`[Job ${jobId}] [video-one] Scene ${scene.scene_number} failed:`, error instanceof Error ? error.message : error);
    // Mark scene as failed so video-check doesn't wait forever
    await supabase.from("scenes").update({ video_status: "error" }).eq("id", sceneId);
    throw error;
  }
}

/**
 * Step 3: Videos — generate Veo videos from scene images in parallel.
 * (Legacy: used by _processJob. For multi-step pipeline, use stepVideoOne + video-check)
 */
export async function stepVideos(jobId: string) {
  const supabase = createAdminClient();
  const job = await loadJob(jobId);
  if (!job.project_id) throw new Error("No project_id on job");
  await updateJobStep(jobId, "videos");

  try {
    const { data: scenes } = await supabase
      .from("scenes")
      .select("id, scene_number, description, image_url")
      .eq("project_id", job.project_id)
      .not("image_url", "is", null)
      .or("video_status.is.null,video_status.eq.idle")
      .order("scene_number", { ascending: true });

    if (!scenes || scenes.length === 0) {
      console.log(`[Job ${jobId}] [videos] All videos already done.`);
      return;
    }

    console.log(`[Job ${jobId}] [videos] Generating ${scenes.length} videos...`);
    const limit = pLimit(10);
    const tasks = scenes.map((scene) => limit(async () => {
      // Download image from URL to get base64
      const imgResponse = await fetch(scene.image_url!);
      const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
      const imgBase64 = imgBuffer.toString("base64");

      const videoUrl = await generateVideoFromImage(imgBase64, buildVideoPrompt(scene.description));

      await supabase.from("scenes").update({
        video_file_name: videoUrl,
        video_status: "done",
        status: "done",
      }).eq("id", scene.id);
      console.log(`[Job ${jobId}] [videos] Scene ${scene.scene_number} done`);
    }));

    await Promise.all(tasks);
    console.log(`[Job ${jobId}] [videos] All ${scenes.length} videos done.`);
  } catch (error) {
    await failJob(jobId, error);
    throw error;
  }
}

/**
 * Step 4: Render — FFmpeg combine, upload final video, create song, YouTube.
 */
export async function stepRender(jobId: string) {
  const supabase = createAdminClient();
  const job = await loadJob(jobId);
  if (!job.project_id) throw new Error("No project_id on job");
  await updateJobStep(jobId, "render");

  try {
    const { data: project } = await supabase.from("projects").select("*").eq("id", job.project_id).single();
    if (!project) throw new Error("Project not found");
    const music = project.music as Record<string, unknown>;

    const { data: scenes } = await supabase
      .from("scenes")
      .select("*")
      .eq("project_id", job.project_id)
      .order("scene_number", { ascending: true });
    if (!scenes || scenes.length === 0) throw new Error("No scenes found");

    const audioDuration = (music.audioDuration as number) || 120;
    const exactSubtitles = music.exactSubtitles as Array<{ id: number; startSeconds: number; endSeconds: number; text: string }> | undefined;

    console.log(`[Job ${jobId}] [render] Rendering final video (${scenes.length} scenes)...`);
    const finalVideoBuffer = await renderFinalVideo({
      scenes: scenes.map((s) => ({ id: s.scene_number, videoUrl: s.video_file_name, time: s.time_range, lyrics: s.lyrics })),
      musicAudioBase64: music.audioBase64 as string,
      musicMimeType: (music.mimeType as string) || "audio/mp3",
      audioDuration,
      exactSubtitles,
    });

    const finalVideoPath = `renders/${job.project_id}.mp4`;
    const finalVideoUrl = await uploadBuffer("videos", finalVideoPath, finalVideoBuffer, "video/mp4");
    const finalThumbnailUrl = scenes[0].image_url;

    // YouTube
    let ytVideoId: string | null = null;
    try {
      const { data: ytConfig } = await supabase.from("integration_settings").select("auto_upload").eq("provider", "youtube").single();
      if (ytConfig?.auto_upload) {
        console.log(`[Job ${jobId}] [render] Publishing to YouTube...`);
        const lyrics = project.lyrics as Record<string, string[]>;
        const ytRes = await getGeminiClient().models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: `Write a YouTube title and description for this children's song:
          Theme: ${job.title}
          Lyrics: ${Object.values(lyrics).flat().join(" ")}
          Return a JSON object with "title" (max 60 chars), "description", "tags" (array of 5-8 strings).`,
          config: { responseMimeType: "application/json" },
        });
        const ytMeta = JSON.parse(ytRes.text || "{}");
        const uploadRes = await uploadVideoToYouTube({
          title: ytMeta.title || `${job.title} - Kids Song`,
          description: ytMeta.description || job.prompt,
          tags: ytMeta.tags || ["kids song", "nursery rhyme"],
          videoUrl: finalVideoUrl,
          privacyStatus: "unlisted",
        });
        if (uploadRes?.id) ytVideoId = uploadRes.id;
      }
    } catch (e) {
      console.error(`[Job ${jobId}] [render] YouTube failed:`, e instanceof Error ? e.message : e);
    }

    // Create song
    const { data: catData } = await supabase.from("categories").select("id").eq("slug", job.category_slug || "learning-discovery").single();
    const totalInputTokens = (music.totalInputTokens as number) || 0;
    const totalOutputTokens = (music.totalOutputTokens as number) || 0;
    const costInfo = calculateProjectCost({
      ...DEFAULT_OPTIONS,
      numScenes: scenes.length,
      videoDuration: 6,
      lyriaTier: "pro",
      imageModel: "gemini-3.1-flash-image-preview",
      actualTokens: { input: totalInputTokens, output: totalOutputTokens },
    });

    const songId = crypto.randomUUID();
    const { error: songErr } = await supabase.from("songs").insert({
      id: songId,
      title: `${job.title} Song`,
      artist: "SparkGen AI",
      description: job.prompt,
      difficulty_level: 1,
      category_id: catData?.id || null,
      video_storage_path: finalVideoPath,
      video_url: finalVideoUrl,
      thumbnail_url: finalThumbnailUrl,
      video_size_bytes: finalVideoBuffer.length,
      is_published: true,
      tags: ["automation", job.category_slug],
      youtube_video_id: ytVideoId,
    });
    if (songErr) throw songErr;

    // Update project
    await supabase.from("projects").update({
      status: "finished",
      final_video_url: finalVideoUrl,
      final_video_storage_path: finalVideoPath,
      final_thumbnail_url: finalThumbnailUrl,
      final_song_id: songId,
      render_status: "done",
      rendered_at: new Date().toISOString(),
      estimated_cost: costInfo.totalCost,
      youtube_video_id: ytVideoId,
    }).eq("id", job.project_id);

    // Mark job done
    await supabase.from("automation_jobs").update({
      status: "done",
      song_id: songId,
      estimated_cost: costInfo.totalCost,
      completed_at: new Date().toISOString(),
      current_step: "done",
    }).eq("id", jobId);

    console.log(`[Job ${jobId}] [render] DONE! Song ${songId}, cost $${costInfo.totalCost.toFixed(2)}`);
    return { jobId, projectId: job.project_id, songId, title: job.title };
  } catch (error) {
    await failJob(jobId, error);
    throw error;
  }
}

// ── Legacy single-pass pipeline (kept for backward compat) ─────────

async function _processJob(job: AutomationJobRow) {
  const supabase = createAdminClient();
  try {
    const theme: ThemeIdea & { prompt: string } = {
      title: job.title,
      prompt: job.prompt,
      desc: job.prompt,
      icon: "music_note", // Generic fallback
      categorySlug: job.category_slug,
      color: "bg-secondary-container",
      iconColor: "text-on-secondary-container"
    };

    const selectedTheme: ThemeIdea = {
      title: theme.title,
      desc: theme.prompt,
      icon: theme.icon,
      categorySlug: theme.categorySlug,
      color: "bg-secondary-container",
      iconColor: "text-on-secondary-container",
    };

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    console.log(`[Job ${job.id}] Generating lyrics...`);
    const { lyrics, tokens: lyricsTokens } = await generateLyrics(theme);
    totalInputTokens += lyricsTokens.input;
    totalOutputTokens += lyricsTokens.output;
    
    const projectId = crypto.randomUUID();
    
    console.log(`[Job ${job.id}] Generating music...`);
    const soundtrack = await generateMusic(lyrics, selectedTheme);
    const soundtrackPath = `soundtracks/${projectId}.mp3`;
    
    console.log(`[Job ${job.id}] Uploading music (${soundtrack.mimeType})...`);
    let soundtrackUrl: string | null = null;
    try {
      soundtrackUrl = await uploadBuffer("music", soundtrackPath, Buffer.from(soundtrack.audioBase64, "base64"), "audio/mp3");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[Job ${job.id}] Music upload skipped: ${message}`);
    }

    // Estimate duration from base64 size (ffprobe not available on Vercel serverless)
    const decodedBytes = soundtrack.audioBase64.length * 3 / 4;
    const audioDuration = Math.max(30, Math.min(210, Math.round(decodedBytes / 24000)));
    console.log(`[Job ${job.id}] Audio ~${audioDuration}s (${Math.round(decodedBytes/1024)}KB). Syncing scenes...`);
    const numDynamicScenes = Math.ceil(audioDuration / 6);
    // Update scenes to match real audio duration (each scene ~6 seconds)
    const scenesData = await generateScenes(lyrics, selectedTheme, numDynamicScenes, audioDuration);
    totalInputTokens += scenesData.tokens.input;
    totalOutputTokens += scenesData.tokens.output;
    const scenes = scenesData.scenes;

    console.log(`[Job ${job.id}] Generating accurate subtitles...`);
    let exactSubtitles;
    try {
      const subtitleData = await generateAccurateSubtitlesFromAudio(
        soundtrack.audioBase64,
        soundtrack.mimeType,
        lyrics
      );
      exactSubtitles = subtitleData.subtitles;
      totalInputTokens += subtitleData.tokens.input;
      totalOutputTokens += subtitleData.tokens.output;
    } catch (error) {
      console.warn(`[Job ${job.id}] Accurate subtitles failed, falling back to proportional timing:`, error);
    }

    console.log(`[Job ${job.id}] Generating character reference...`);
    const characterDescription = `Create a 3D children's animation character design sheet for a music video. Character: ${scenesData.characterDescription}. Visual style: ${scenesData.visualStyle}. Show one cute main character in a front-facing neutral standing pose on a clean white background.`;
    const characterImage = await generateImageBase64(characterDescription);
    
    console.log(`[Job ${job.id}] Uploading character reference...`);
    const characterReferenceUrl = await uploadBuffer(
      "thumbnails",
      `generated/${projectId}/character-reference.png`,
      Buffer.from(characterImage.data, "base64"),
      characterImage.mimeType
    );

    const completedScenes: Scene[] = [];
    const limit = pLimit(10); // Allow max 10 concurrent requests to Veo API

    const sceneTasks = scenes.map((scene, index) => limit(async () => {
      const sceneIndex = index + 1;
      console.log(`[Job ${job.id}] Generating scene ${sceneIndex}/${scenes.length}: image...`);
      const fullDesc = `${scene.description}. Visual Style: ${scenesData.visualStyle}`;
      const generatedImage = await generateImageBase64(fullDesc, characterImage.data);
      
      console.log(`[Job ${job.id}] Generating scene ${sceneIndex}/${scenes.length}: uploading image...`);
      const imageUrl = await uploadBuffer(
        "thumbnails",
        `generated/${projectId}/scene-${scene.id}.png`,
        Buffer.from(generatedImage.data, "base64"),
        generatedImage.mimeType
      );
      
      console.log(`[Job ${job.id}] Generating scene ${sceneIndex}/${scenes.length}: video from image...`);
      const videoUrl = await generateVideoFromImage(generatedImage.data, buildVideoPrompt(scene.description));
      return {
        ...scene,
        imageBase64: generatedImage.data,
        imageUrl,
        videoUrl,
        videoFileName: videoUrl,
        videoStatus: "done" as const,
        status: "done" as const,
      };
    }));

    completedScenes.push(...(await Promise.all(sceneTasks)));
    completedScenes.sort((a, b) => a.id - b.id); // Ensure correct order after parallel execution

    console.log(`[Job ${job.id}] Rendering final video...`);
    const finalVideoBuffer = await renderFinalVideo({
      scenes: completedScenes.map((scene) => ({ id: scene.id, videoUrl: scene.videoUrl!, time: scene.time, lyrics: scene.lyrics })),
      musicAudioBase64: soundtrack.audioBase64,
      musicMimeType: soundtrack.mimeType,
      audioDuration,
      exactSubtitles,
    });

    const finalVideoPath = `renders/${projectId}.mp4`;
    console.log(`[Job ${job.id}] Uploading final video...`);
    const finalVideoUrl = await uploadBuffer("videos", finalVideoPath, finalVideoBuffer, "video/mp4");
    const finalThumbnailUrl = completedScenes[0].imageUrl!;

    let ytVideoId: string | null = null;
    try {
      const { data: ytConfig } = await supabase.from("integration_settings").select("auto_upload").eq("provider", "youtube").single();
      if (ytConfig?.auto_upload) {
        console.log(`[Job ${job.id}] Auto-publishing to YouTube...`);
        const titleDescRes = await getGeminiClient().models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: `Write a YouTube title and description for this children's song:
          Theme: ${theme.title}
          Lyrics: ${Object.values(lyrics).flat().join(" ")}
          
          Return a JSON object with:
          - "title": A catchy, SEO-friendly YouTube title (max 60 chars)
          - "description": A fun, engaging description including lyrics and tags.
          - "tags": Array of 5-8 relevant tags (strings).`,
          config: { responseMimeType: "application/json" }
        });
        
        const ytMeta = JSON.parse(titleDescRes.text || "{}");
        const uploadRes = await uploadVideoToYouTube({
          title: ytMeta.title || `${theme.title} - Kids Song`,
          description: ytMeta.description || theme.prompt,
          tags: ytMeta.tags || ["kids song", "nursery rhyme", "children music"],
          videoUrl: finalVideoUrl,
          privacyStatus: "unlisted"
        });
        
        if (uploadRes?.id) {
          ytVideoId = uploadRes.id;
          console.log(`[Job ${job.id}] YouTube Upload Success! ID: ${ytVideoId}`);
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[Job ${job.id}] YouTube upload failed:`, msg);
    }

    console.log(`[Job ${job.id}] Saving metadata...`);
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", theme.categorySlug || "learning-discovery")
      .single();

    // Calculate actual estimated cost
    const costInfo = calculateProjectCost({
      ...DEFAULT_OPTIONS,
      numScenes: numDynamicScenes, // dynamic scenes to cover the whole song
      videoDuration: 6, // 6s clips
      lyriaTier: "pro", // we used lyria-3-pro-preview
      imageModel: "gemini-3.1-flash-image-preview",
      actualTokens: { input: totalInputTokens, output: totalOutputTokens }
    });
    const estimatedCost = costInfo.totalCost;

    const songId = crypto.randomUUID();
    const { error: songError } = await supabase.from("songs").insert({
      id: songId,
      title: `${theme.title} Song`,
      artist: "SparkGen AI",
      description: theme.prompt,
      difficulty_level: 1,
      category_id: categoryData?.id || null,
      video_storage_path: finalVideoPath,
      video_url: finalVideoUrl,
      thumbnail_storage_path: null,
      thumbnail_url: finalThumbnailUrl,
      video_size_bytes: finalVideoBuffer.length,
      is_published: true,
      tags: ["automation", job.category_slug],
      youtube_video_id: ytVideoId,
    });
    if (songError) throw songError;

    const projectPayload: Partial<Project> = {
      title: `${theme.title} Song`,
      description: theme.prompt,
      status: "finished",
      selectedTheme,
      customPrompt: theme.prompt,
      lyrics,
      scenes: completedScenes,
      music: {
        audioBase64: soundtrack.audioBase64,
        audioUrl: soundtrackUrl ?? undefined,
        audioStoragePath: soundtrackPath,
        mimeType: soundtrack.mimeType,
        genre: soundtrack.spec.genre,
        mood: soundtrack.spec.mood,
        tempo: soundtrack.spec.tempo,
        status: "done",
      },
      characterReferenceBase64: characterImage.data,
      characterReferenceUrl,
      finalVideoUrl,
      finalVideoStoragePath: finalVideoPath,
      finalThumbnailUrl,
      finalSongId: songId,
      renderStatus: "done",
      renderedAt: new Date().toISOString(),
      youtubeVideoId: ytVideoId,
    };

    const { error: projectError } = await supabase.from("projects").insert({
      id: projectId,
      title: projectPayload.title,
      description: projectPayload.description,
      status: projectPayload.status,
      selected_theme: projectPayload.selectedTheme,
      custom_prompt: projectPayload.customPrompt,
      lyrics: projectPayload.lyrics,
      music: projectPayload.music,
      character_reference_base64: projectPayload.characterReferenceBase64,
      character_reference_url: projectPayload.characterReferenceUrl,
      final_video_url: projectPayload.finalVideoUrl,
      final_video_storage_path: projectPayload.finalVideoStoragePath,
      final_thumbnail_url: projectPayload.finalThumbnailUrl,
      final_song_id: projectPayload.finalSongId,
      render_status: projectPayload.renderStatus,
      rendered_at: projectPayload.renderedAt,
      estimated_cost: estimatedCost,
      youtube_video_id: projectPayload.youtubeVideoId,
    });
    if (projectError) throw projectError;

    const sceneRows = completedScenes.map((scene) => ({
      project_id: projectId,
      scene_number: scene.id,
      title: scene.title,
      time_range: scene.time,
      lyrics: scene.lyrics,
      description: scene.description,
      image_url: scene.imageUrl,
      status: scene.status,
      video_status: scene.videoStatus,
      video_file_name: scene.videoFileName,
    }));
    const { error: sceneError } = await supabase.from("scenes").insert(sceneRows);
    if (sceneError) throw sceneError;

    await supabase.from("automation_jobs").update({
      status: "done",
      project_id: projectId,
      song_id: songId,
      estimated_cost: estimatedCost,
      completed_at: new Date().toISOString(),
    }).eq("id", job.id);

    return { jobId: job.id, projectId, songId, title: theme.title };
  } catch (error: unknown) {
    await supabase.from("automation_jobs").update({
      status: "error",
      error: error instanceof Error ? error.message : "Automation failed",
      completed_at: new Date().toISOString(),
    }).eq("id", job.id);
    throw error;
  }
}
