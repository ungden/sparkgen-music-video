import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { mkdtemp, writeFile, readFile, rm, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Bunny Stream ───────────────────────────────────────────────────

const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY || "";
const BUNNY_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || "";
const BUNNY_CDN_HOST = process.env.BUNNY_STREAM_CDN_HOST || ""; // e.g. vz-abc123-456.b-cdn.net

async function uploadToBunnyStream(videoBuffer: Buffer, title: string): Promise<{ videoId: string; videoUrl: string }> {
  // Step 1: Create video entry
  const createRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`, {
    method: "POST",
    headers: { AccessKey: BUNNY_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!createRes.ok) throw new Error(`Bunny create failed: ${createRes.status} ${await createRes.text()}`);
  const { guid } = await createRes.json() as { guid: string };

  // Step 2: Upload video binary
  const uploadRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${guid}`, {
    method: "PUT",
    headers: { AccessKey: BUNNY_API_KEY, "Content-Type": "application/octet-stream" },
    body: videoBuffer,
  });
  if (!uploadRes.ok) throw new Error(`Bunny upload failed: ${uploadRes.status} ${await uploadRes.text()}`);

  // Direct MP4 URL (720p fallback) + HLS playlist
  const videoUrl = BUNNY_CDN_HOST
    ? `https://${BUNNY_CDN_HOST}/${guid}/playlist.m3u8`
    : `https://iframe.mediadelivery.net/play/${BUNNY_LIBRARY_ID}/${guid}`;

  console.log(`[render] Bunny upload OK: ${guid} → ${videoUrl}`);
  return { videoId: guid, videoUrl };
}

// ── YouTube Upload (REST API, no googleapis dependency) ─────────────

async function getYouTubeAccessToken(): Promise<{ accessToken: string; channelId: string } | null> {
  const { data: config } = await supabase.from("integration_settings").select("*").eq("provider", "youtube").single();
  if (!config?.is_connected || !config?.refresh_token) return null;

  // Refresh the access token
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: config.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.access_token) return null;

  // Update token in DB
  await supabase.from("integration_settings").update({
    access_token: tokens.access_token,
    token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("provider", "youtube");

  return { accessToken: tokens.access_token, channelId: config.channel_id };
}

async function uploadToYouTube(videoBuffer: Buffer, metadata: {
  title: string;
  description: string;
  tags: string[];
  privacyStatus?: string;
}): Promise<string | null> {
  const auth = await getYouTubeAccessToken();
  if (!auth) { console.log("[youtube] Not connected, skipping"); return null; }

  const { data: ytConfig } = await supabase.from("integration_settings").select("auto_upload").eq("provider", "youtube").single();
  if (!ytConfig?.auto_upload) { console.log("[youtube] Auto-upload disabled, skipping"); return null; }

  console.log(`[youtube] Uploading "${metadata.title}" (${(videoBuffer.length/1024/1024).toFixed(1)}MB)...`);

  // YouTube resumable upload: Step 1 - initiate
  const initRes = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      "X-Upload-Content-Length": String(videoBuffer.length),
      "X-Upload-Content-Type": "video/mp4",
    },
    body: JSON.stringify({
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: "10", // Music
      },
      status: {
        privacyStatus: metadata.privacyStatus || "unlisted",
        selfDeclaredMadeForKids: false,
      },
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`YouTube init failed: ${initRes.status} ${err.slice(0, 200)}`);
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) throw new Error("No upload URL returned");

  // Step 2 - upload video data
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`YouTube upload failed: ${uploadRes.status} ${err.slice(0, 200)}`);
  }

  const result = await uploadRes.json();
  console.log(`[youtube] Upload success! Video ID: ${result.id}`);
  return result.id;
}

// ── Helpers ─────────────────────────────────────────────────────────

async function fetchBinary(url: string): Promise<Buffer> {
  const headers: Record<string, string> = {};
  if (process.env.GEMINI_API_KEY && url.includes("googleapis.com")) {
    headers["x-goog-api-key"] = process.env.GEMINI_API_KEY;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function runFfmpeg(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else {
        // Only keep last 500 chars of stderr (skip FFmpeg version banner)
        const tail = stderr.slice(-500).trim();
        reject(new Error(tail || `ffmpeg exited with code ${code}`));
      }
    });
  });
}

function formatSrtTimestamp(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const ms = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":") + `,${String(ms).padStart(3, "0")}`;
}

// ── Prep Job (lyrics, music, scenes, subtitles, character ref) ─────

export async function prepJob(jobId: string) {
  const { data: job } = await supabase.from("automation_jobs").select("*").eq("id", jobId).single();
  if (!job) throw new Error(`Job ${jobId} not found`);

  await supabase.from("automation_jobs").update({
    status: "running", started_at: new Date().toISOString(), current_step: "prep", error: null,
  }).eq("id", jobId);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const theme = { title: job.title, prompt: job.prompt, categorySlug: job.category_slug, genre: job.genre || "pop" };

  console.log(`[prep] ${job.title}: generating lyrics (genre: ${theme.genre})...`);
  const lyricsRes = await retryFn("lyrics", () => ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `You are a professional songwriter specializing in ${theme.genre} music. Write original song lyrics.\n\nTheme: ${theme.prompt}\n\nFormat: [Verse 1] 6 lines, [Chorus] 6 lines, [Verse 2] 6 lines, [Outro] 6 lines. Output lyrics only. Match the style, vocabulary, and rhythm of ${theme.genre} genre.`,
    config: { temperature: 1.0 },
  }));
  const lyrics = parseLyrics(lyricsRes.text ?? "");
  if (!lyrics) throw new Error("Failed to parse lyrics");

  console.log(`[prep] ${job.title}: generating music via Replicate Lyria 3 Pro...`);
  const lyricsText = [...lyrics.verse1, ...lyrics.chorus, ...lyrics.verse2, ...lyrics.outro].join("\n");
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) throw new Error("REPLICATE_API_TOKEN not set");

  const musicPrompt = `Create a full-length 3-minute children's music track with vocals.

Theme: ${theme.title}

SONG STRUCTURE:
[Intro] 8-bar instrumental intro
[Verse 1] First verse
[Chorus] Catchy, singalong chorus
[Verse 2] Second verse
[Chorus] Repeat chorus with more energy
[Bridge] Short bridge or breakdown
[Chorus] Final big chorus
[Outro] Fun ending with fade or final note

LYRICS:
${lyricsText}

Make the chorus explode with energy and catchy melodies. Ensure the rhythm makes kids want to jump and dance! This should be a full song spanning around 2.5 to 3 minutes.`;

  const musicCreateRes = await fetch("https://api.replicate.com/v1/models/google/lyria-3-pro/predictions", {
    method: "POST",
    headers: { Authorization: `Bearer ${replicateToken}`, "Content-Type": "application/json", "Prefer": "wait" },
    body: JSON.stringify({ input: { prompt: musicPrompt } }),
  });
  if (!musicCreateRes.ok) throw new Error(`Replicate Lyria create failed: ${musicCreateRes.status} ${(await musicCreateRes.text()).slice(0, 200)}`);
  let musicPrediction = await musicCreateRes.json();

  for (let attempt = 0; attempt < 60; attempt++) {
    if (musicPrediction.status === "succeeded" || musicPrediction.status === "failed" || musicPrediction.status === "canceled") break;
    await new Promise(r => setTimeout(r, 10000));
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${musicPrediction.id}`, {
      headers: { Authorization: `Bearer ${replicateToken}` },
    });
    musicPrediction = await pollRes.json();
  }
  if (musicPrediction.status !== "succeeded" || !musicPrediction.output) {
    throw new Error(`Replicate Lyria ${musicPrediction.status}: ${musicPrediction.error || "no output"}`);
  }

  const audioFileUrl = typeof musicPrediction.output === "string" ? musicPrediction.output : musicPrediction.output[0];
  const audioResponse = await fetch(audioFileUrl);
  if (!audioResponse.ok) throw new Error(`Failed to download audio: ${audioResponse.status}`);
  const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
  const audioBase64 = audioBuffer.toString("base64");
  const audioMimeType = "audio/mp3";

  const projectId = crypto.randomUUID();
  const soundtrackPath = `soundtracks/${projectId}.mp3`;
  let soundtrackUrl: string | null = null;
  try {
    const { error } = await supabase.storage.from("music").upload(soundtrackPath, audioBuffer, { cacheControl: "3600", upsert: true, contentType: "audio/mp3" });
    if (!error) soundtrackUrl = supabase.storage.from("music").getPublicUrl(soundtrackPath).data.publicUrl;
  } catch {}

  const audioDuration = Math.max(30, Math.min(210, Math.round(audioBuffer.length / 16000)));
  const numScenes = Math.ceil(audioDuration / 6);
  const aspectRatio = job.aspect_ratio || "16:9";

  console.log(`[prep] ${job.title}: ${audioDuration}s audio, ${numScenes} scenes, ${aspectRatio}`);

  const scenesRes = await retryFn("scenes", () => ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Break this song into ${numScenes} scenes. Theme: ${theme.title}\nLyrics:\n${lyricsText}\n\nReturn JSON: {"characterDescription":"...","visualStyle":"...","scenes":[{"title":"...","time":"MM:SS-MM:SS","lyrics":"...","description":"..."}]}`,
    config: { responseMimeType: "application/json", temperature: 0.8 },
  }));
  let parsed: any = {};
  try { parsed = JSON.parse(scenesRes.text ?? "{}"); } catch {}
  const characterDescription = parsed.characterDescription || "cute cartoon character";
  const visualStyle = parsed.visualStyle || "colorful 3D Pixar style";

  // Generate subtitles
  let exactSubtitles;
  try {
    const subRes = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [`This audio is ~${audioDuration}s. Transcribe ALL sung lines with timestamps. Return JSON [{id,startSeconds,endSeconds,text}].`, { inlineData: { mimeType: audioMimeType, data: audioBase64 } }],
      config: { responseMimeType: "application/json", temperature: 0.1 },
    });
    exactSubtitles = JSON.parse(subRes.text ?? "[]");
  } catch { console.warn(`[prep] ${job.title}: subtitles failed`); }

  // Generate character reference
  console.log(`[prep] ${job.title}: generating character...`);
  const charRes = await retryFn("char", () => ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: [{ text: `Create a 3D children's animation character. Character: ${characterDescription}. Style: ${visualStyle}. Front-facing pose on white background.` }],
    config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspectRatio as any, imageSize: "2K" } },
  }), 4);
  const charPart = charRes.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
  if (!charPart?.inlineData?.data) throw new Error("No character image");
  const charBase64 = charPart.inlineData.data;

  const charBytes = Uint8Array.from(atob(charBase64), c => c.charCodeAt(0));
  const { error: charUpErr } = await supabase.storage.from("thumbnails").upload(`generated/${projectId}/character-reference.png`, charBytes, { cacheControl: "3600", upsert: true, contentType: "image/png" });
  const characterReferenceUrl = supabase.storage.from("thumbnails").getPublicUrl(`generated/${projectId}/character-reference.png`).data.publicUrl;

  // Build scene rows
  const scenes = Array.from({ length: numScenes }).map((_, i) => {
    const raw = (parsed.scenes || [])[i] || {};
    const allLines = [...lyrics.verse1, ...lyrics.chorus, ...lyrics.verse2, ...lyrics.outro];
    const lps = Math.max(1, Math.ceil(allLines.length / numScenes));
    return { id: i + 1, title: raw.title || `Scene ${i+1}`, time: raw.time || "", lyrics: allLines.slice(i*lps, (i+1)*lps).join("\n"), description: raw.description || `Scene ${i+1}` };
  });

  await supabase.from("projects").insert({
    id: projectId, title: `${job.title} Song`, description: job.prompt, status: "rendering",
    selected_theme: { title: theme.title, desc: theme.prompt, categorySlug: theme.categorySlug },
    custom_prompt: job.prompt, lyrics,
    music: { audioBase64, audioUrl: soundtrackUrl, audioStoragePath: soundtrackPath, mimeType: audioMimeType, status: "done", audioDuration, exactSubtitles, characterDescription, visualStyle, characterImageBase64: charBase64, aspectRatio },
    character_reference_base64: charBase64, character_reference_url: characterReferenceUrl, render_status: "prep",
  });

  await supabase.from("scenes").insert(scenes.map(s => ({
    project_id: projectId, scene_number: s.id, title: s.title, time_range: s.time, lyrics: s.lyrics, description: s.description, status: "pending", video_status: "idle",
  })));

  await supabase.from("automation_jobs").update({ current_step: "prep", project_id: projectId }).eq("id", jobId);
  console.log(`[prep] ${job.title}: done. Project ${projectId}, ${scenes.length} scenes.`);
}

function parseLyrics(text: string) {
  const sections: Record<string, string[]> = {};
  let cur = "";
  for (const line of text.split("\n")) {
    const t = line.trim();
    const m = t.match(/^\[(.*?)\]$/);
    if (m) { cur = m[1].toLowerCase().replace(/\s+/g, ""); sections[cur] = []; }
    else if (cur && t && !/^\(.*\)$/.test(t)) sections[cur]?.push(t);
  }
  const v1 = sections["verse1"] || [], ch = sections["chorus"] || [], v2 = sections["verse2"] || [], ou = sections["outro"] || [];
  return v1.length || ch.length ? { verse1: v1, chorus: ch, verse2: v2, outro: ou } : null;
}

async function retryFn<T>(label: string, fn: () => Promise<T>, attempts = 6): Promise<T> {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const is429 = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
      const isRetryable = is429 || msg.includes("503") || msg.includes("502") || msg.includes("unavailable") || msg.includes("INTERNAL");
      if (i === attempts || !isRetryable) throw e;
      // Exponential backoff with jitter to avoid thundering herd
      const baseDelay = is429 ? 30000 : 5000;
      const jitter = Math.random() * 3000; // 0-3s random jitter
      const delay = baseDelay * i + jitter;
      console.warn(`[retry ${i}/${attempts}] ${label}: ${msg.slice(0, 100)} — waiting ${Math.round(delay/1000)}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

// ── Images Job (generate scene images) ─────────────────────────────

export async function imagesJob(jobId: string) {
  const { data: job } = await supabase.from("automation_jobs").select("project_id, title").eq("id", jobId).single();
  if (!job?.project_id) throw new Error("No project_id");

  await supabase.from("automation_jobs").update({ current_step: "images" }).eq("id", jobId);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const { data: project } = await supabase.from("projects").select("music, character_reference_base64").eq("id", job.project_id).single();
  if (!project) throw new Error("Project not found");
  const music = project.music as Record<string, unknown>;
  const visualStyle = (music.visualStyle as string) || "";
  const charBase64 = (music.characterImageBase64 as string) || project.character_reference_base64;
  const aspectRatio = (music.aspectRatio as string) || "16:9";

  const { data: scenes } = await supabase.from("scenes").select("id, scene_number, description").eq("project_id", job.project_id).is("image_url", null).order("scene_number", { ascending: true });
  if (!scenes?.length) { console.log(`[images] ${job.title}: all done`); return; }

  console.log(`[images] ${job.title}: generating ${scenes.length} images (${aspectRatio})...`);
  const BATCH = 5;
  for (let i = 0; i < scenes.length; i += BATCH) {
    await Promise.all(scenes.slice(i, i + BATCH).map(async (scene: any) => {
      let prompt = `Create illustration: ${scene.description}. Visual Style: ${visualStyle}. ${aspectRatio === "9:16" ? "Portrait orientation." : "16:9 widescreen."} Vibrant colors, children's music video.`;
      const contents: any[] = [{ text: prompt }];
      if (charBase64) {
        contents[0].text = `Use attached image as character reference. Place EXACT character into: ${prompt}`;
        contents.push({ inlineData: { mimeType: "image/png", data: charBase64 } });
      }
      const res = await retryFn("image", () => ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview", contents,
        config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspectRatio as any, imageSize: "2K" } },
      }), 4);
      const imgPart = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      if (!imgPart?.inlineData?.data) throw new Error(`No image scene ${scene.scene_number}`);
      const imgBytes = Uint8Array.from(atob(imgPart.inlineData.data), c => c.charCodeAt(0));
      const { error } = await supabase.storage.from("thumbnails").upload(`generated/${job.project_id}/scene-${scene.scene_number}.png`, imgBytes, { cacheControl: "3600", upsert: true, contentType: "image/png" });
      const imageUrl = supabase.storage.from("thumbnails").getPublicUrl(`generated/${job.project_id}/scene-${scene.scene_number}.png`).data.publicUrl;
      await supabase.from("scenes").update({ image_url: imageUrl, status: "image_done" }).eq("id", scene.id);
      console.log(`[images] ${job.title}: scene ${scene.scene_number} done`);
    }));
  }
  console.log(`[images] ${job.title}: all ${scenes.length} images done`);
}

// ── Videos Job (Veo generation, no timeout) ────────────────────────

export async function videosJob(jobId: string) {
  const { data: job } = await supabase.from("automation_jobs").select("project_id, title").eq("id", jobId).single();
  if (!job?.project_id) throw new Error("No project_id");

  await supabase.from("automation_jobs").update({ current_step: "videos" }).eq("id", jobId);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // Get aspect ratio from project music JSONB
  const { data: project } = await supabase.from("projects").select("music").eq("id", job.project_id).single();
  const aspectRatio = ((project?.music as any)?.aspectRatio as string) || "16:9";

  const { data: scenes } = await supabase
    .from("scenes").select("id, scene_number, description, image_url")
    .eq("project_id", job.project_id)
    .not("image_url", "is", null)
    .or("video_status.is.null,video_status.eq.idle")
    .order("scene_number", { ascending: true });

  if (!scenes || scenes.length === 0) {
    console.log(`[videos] ${job.title}: all videos already done`);
    return;
  }

  console.log(`[videos] ${job.title}: generating ${scenes.length} videos via P-Video (${aspectRatio})...`);

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) throw new Error("REPLICATE_API_TOKEN not set");

  // Process 3 at a time — P-Video is fast (~10s per clip)
  const BATCH = 3;
  for (let i = 0; i < scenes.length; i += BATCH) {
    const batch = scenes.slice(i, i + BATCH);
    await Promise.all(batch.map(async (scene: any) => {
      try {
        const prompt = `Gentle cinematic animation of this scene: ${scene.description}\n\nSmooth camera movement, subtle character animation. Children's music video style, bright and colorful.`;

        // Start P-Video prediction with retry
        let createRes: Response | null = null;
        for (let retry = 0; retry < 3; retry++) {
          createRes = await fetch("https://api.replicate.com/v1/models/prunaai/p-video/predictions", {
            method: "POST",
            headers: { Authorization: `Bearer ${replicateToken}`, "Content-Type": "application/json", "Prefer": "wait" },
            body: JSON.stringify({
              input: {
                prompt,
                image: scene.image_url,
                duration: 6,
                resolution: "720p",
                fps: 24,
                aspect_ratio: aspectRatio,
                draft: false,
                prompt_upsampling: true,
              },
            }),
          });
          if (createRes.ok) break;
          const errText = await createRes.text();
          if (retry < 2 && (errText.includes("502") || errText.includes("503") || errText.includes("Gateway") || errText.includes("unavailable"))) {
            console.warn(`[videos] ${job.title}: scene ${scene.scene_number} retry ${retry+1} (temp error)`);
            await new Promise(r => setTimeout(r, 10000));
            continue;
          }
          throw new Error(`P-Video create failed: ${createRes.status} ${errText.slice(0, 200)}`);
        }
        if (!createRes?.ok) throw new Error("P-Video create failed after retries");
        const prediction = await createRes.json();

        // Poll for completion (max 5 min — P-Video is fast)
        let result = prediction;
        for (let attempt = 0; attempt < 30; attempt++) {
          if (result.status === "succeeded" || result.status === "failed" || result.status === "canceled") break;
          await new Promise(r => setTimeout(r, 10000));
          const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
            headers: { Authorization: `Bearer ${replicateToken}` },
          });
          result = await pollRes.json();
        }

        if (result.status !== "succeeded" || !result.output) {
          throw new Error(`P-Video ${result.status}: ${result.error || "no output"}`);
        }

        // Download video from P-Video URL and persist to Supabase Storage
        const videoUrl = typeof result.output === "string" ? result.output : result.output[0];
        const clipBuffer = await fetchBinary(videoUrl);
        const clipPath = `generated/${job.project_id}/scene-${scene.scene_number}.mp4`;
        await supabase.storage.from("videos").upload(clipPath, clipBuffer, {
          cacheControl: "3600", upsert: true, contentType: "video/mp4",
        });
        const permanentUrl = supabase.storage.from("videos").getPublicUrl(clipPath).data.publicUrl;

        await supabase.from("scenes").update({
          video_file_name: permanentUrl,
          video_status: "done",
          status: "done",
        }).eq("id", scene.id);
        console.log(`[videos] ${job.title}: scene ${scene.scene_number} done (${(clipBuffer.length/1024).toFixed(0)}KB)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[videos] ${job.title}: scene ${scene.scene_number} FAILED: ${msg}`);
        await supabase.from("scenes").update({
          video_status: "error",
          video_error: msg.slice(0, 500),
        }).eq("id", scene.id);
        // Don't throw — continue with other scenes, retry failed ones after
      }
    }));
    console.log(`[videos] ${job.title}: batch ${Math.floor(i/BATCH)+1} done (${Math.min(i+BATCH, scenes.length)}/${scenes.length})`);
  }

  // Check for failed scenes and throw if any remain
  const { data: failedScenes } = await supabase
    .from("scenes").select("id, scene_number")
    .eq("project_id", job.project_id)
    .eq("video_status", "error");

  if (failedScenes && failedScenes.length > 0) {
    throw new Error(`${failedScenes.length} scenes failed video generation: ${failedScenes.map(s => s.scene_number).join(", ")}`);
  }

  console.log(`[videos] ${job.title}: all ${scenes.length} videos done`);
}

// ── Main ────────────────────────────────────────────────────────────

export async function renderJob(jobId: string) {
  const { data: job } = await supabase.from("automation_jobs").select("project_id, title, category_slug, prompt").eq("id", jobId).single();
  if (!job?.project_id) throw new Error("No project_id");

  await supabase.from("automation_jobs").update({ current_step: "render" }).eq("id", jobId);

  const { data: project } = await supabase.from("projects").select("*").eq("id", job.project_id).single();
  if (!project) throw new Error("Project not found");
  const music = project.music as Record<string, unknown>;

  const { data: scenes } = await supabase.from("scenes").select("*").eq("project_id", job.project_id).order("scene_number", { ascending: true });
  if (!scenes?.length) throw new Error("No scenes");

  const audioDuration = (music.audioDuration as number) || 180;
  const exactSubtitles = music.exactSubtitles as Array<{ id: number; startSeconds: number; endSeconds: number; text: string }> | undefined;

  let tempDir = "";
  try {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "sparkgen-render-"));

    // Download scene clips
    console.log(`[render] Downloading ${scenes.length} clips...`);
    const clipPaths: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const videoUrl = scenes[i].video_file_name;
      if (!videoUrl) continue;
      const clipPath = path.join(tempDir, `clip-${i}.mp4`);
      await writeFile(clipPath, await fetchBinary(videoUrl));
      clipPaths.push(clipPath);
    }

    // Build concat file (loop clips to fill audio duration)
    const concatPath = path.join(tempDir, "concat.txt");
    const looped: string[] = [];
    const totalClips = Math.ceil(audioDuration / 6);
    for (let i = 0; i < totalClips; i++) looped.push(clipPaths[i % clipPaths.length]);
    await writeFile(concatPath, looped.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));

    // Build subtitles
    const subtitlePath = path.join(tempDir, "subtitles.srt");
    let srtContent: string;
    if (exactSubtitles?.length) {
      srtContent = exactSubtitles.map((cue, i) =>
        `${i + 1}\n${formatSrtTimestamp(cue.startSeconds)} --> ${formatSrtTimestamp(cue.endSeconds)}\n${cue.text.replace(/\s+/g, " ").trim()}\n`
      ).join("\n");
    } else {
      srtContent = scenes.map((s, i) => {
        const start = (i / scenes.length) * audioDuration;
        const end = ((i + 1) / scenes.length) * audioDuration;
        return `${i + 1}\n${formatSrtTimestamp(start)} --> ${formatSrtTimestamp(end)}\n${(s.lyrics || "").replace(/\s+/g, " ").trim()}\n`;
      }).join("\n");
    }
    await writeFile(subtitlePath, srtContent);

    // Write audio
    const audioPath = path.join(tempDir, "soundtrack.mp3");
    await writeFile(audioPath, Buffer.from(music.audioBase64 as string, "base64"));

    const outputPath = path.join(tempDir, "final.mp4");
    const aspectRatio = ((music.aspectRatio as string) || "16:9");
    const isVertical = aspectRatio === "9:16";
    const scaleFilter = isVertical ? "scale=720:1280" : "scale=1280:720";
    // Subtitle styling: larger font for vertical, bottom margin adjusted
    const subStyle = isVertical
      ? `subtitles=${subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:")}:force_style='FontSize=28,MarginV=40,Alignment=2'`
      : `subtitles=${subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:")}`;

    console.log(`[render] Running FFmpeg (${scenes.length} scenes, ~${audioDuration}s, ${aspectRatio})...`);
    await runFfmpeg([
      "-y", "-f", "concat", "-safe", "0", "-i", concatPath,
      "-stream_loop", "-1", "-i", audioPath,
      "-vf", `${scaleFilter},${subStyle}`,
      "-map", "0:v:0", "-map", "1:a:0",
      "-c:v", "libx264", "-preset", "fast", "-crf", "26",
      "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-shortest", outputPath,
    ]);

    const finalBuffer = await readFile(outputPath);
    const fileSizeMB = finalBuffer.length / (1024 * 1024);
    console.log(`[render] Video rendered: ${fileSizeMB.toFixed(1)}MB`);

    // Upload to Bunny Stream (primary) or Supabase Storage (fallback)
    let finalVideoUrl: string;
    let videoStoragePath: string;

    if (BUNNY_API_KEY && BUNNY_LIBRARY_ID) {
      const bunny = await uploadToBunnyStream(finalBuffer, `${job.title} Song`);
      finalVideoUrl = bunny.videoUrl;
      videoStoragePath = `bunny:${bunny.videoId}`;
    } else {
      // Fallback: Supabase Storage
      videoStoragePath = `renders/${job.project_id}.mp4`;
      const { error: uploadErr } = await supabase.storage.from("videos").upload(videoStoragePath, finalBuffer, {
        cacheControl: "3600", upsert: true, contentType: "video/mp4",
      });
      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);
      finalVideoUrl = supabase.storage.from("videos").getPublicUrl(videoStoragePath).data.publicUrl;
    }

    // ── Generate YouTube Thumbnail ──────────────────────────────────
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    let finalThumbnailUrl = scenes[0].image_url;
    try {
      console.log(`[render] Generating thumbnail...`);
      const thumbRes = await retryFn("thumbnail", () => ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: [{ text: `Create a YouTube video thumbnail for a ${categoryName} music video called "${job.title}".
Style: cinematic, visually striking, matching the ${categoryName} genre aesthetic.
Must include: a central visual element related to "${job.prompt}".
Large bold text "${job.title}" with contrast and drop shadow for readability.
Background: genre-appropriate atmosphere with visual appeal.
Aspect ratio: 16:9 widescreen. Make it bold and attention-grabbing for YouTube.` }],
        config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" as any, imageSize: "2K" } },
      }), 4);
      const thumbPart = thumbRes.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      if (thumbPart?.inlineData?.data) {
        const thumbBytes = Uint8Array.from(atob(thumbPart.inlineData.data), c => c.charCodeAt(0));
        await supabase.storage.from("thumbnails").upload(`generated/${job.project_id}/youtube-thumbnail.png`, thumbBytes, { cacheControl: "3600", upsert: true, contentType: "image/png" });
        finalThumbnailUrl = supabase.storage.from("thumbnails").getPublicUrl(`generated/${job.project_id}/youtube-thumbnail.png`).data.publicUrl;
        console.log(`[render] Thumbnail uploaded`);
      }
    } catch (e) {
      console.warn(`[render] Thumbnail generation failed, using scene image:`, e instanceof Error ? e.message : e);
    }

    // ── Render 30s YouTube Short (9:16 vertical) ──────────────────
    // Use the already-rendered full video as source (not clips — Veo URIs expire)
    let shortVideoUrl: string | null = null;
    let shortStoragePath: string | null = null;
    try {
      console.log(`[render] Rendering 30s Short from full video...`);
      const shortOutputPath = path.join(tempDir, "short.mp4");

      // Crop center of 16:9 to 9:16 + take first 30s
      await runFfmpeg([
        "-y", "-i", outputPath,
        "-t", "30",
        "-vf", "crop=ih*9/16:ih,scale=720:1280",
        "-c:v", "libx264", "-preset", "fast", "-crf", "26",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
        shortOutputPath,
      ]);

      const shortBuffer = await readFile(shortOutputPath);
      console.log(`[render] Short rendered: ${(shortBuffer.length / (1024 * 1024)).toFixed(1)}MB`);

      if (BUNNY_API_KEY && BUNNY_LIBRARY_ID) {
        const bunnyShort = await uploadToBunnyStream(shortBuffer, `${job.title} - Short`);
        shortVideoUrl = bunnyShort.videoUrl;
        shortStoragePath = `bunny:${bunnyShort.videoId}`;
      } else {
        shortStoragePath = `renders/${job.project_id}-short.mp4`;
        await supabase.storage.from("videos").upload(shortStoragePath, shortBuffer, { cacheControl: "3600", upsert: true, contentType: "video/mp4" });
        shortVideoUrl = supabase.storage.from("videos").getPublicUrl(shortStoragePath).data.publicUrl;
      }
      console.log(`[render] Short uploaded: ${shortVideoUrl}`);
    } catch (e) {
      console.warn(`[render] Short render failed:`, e instanceof Error ? e.message : e);
    }

    // Generate SEO-optimized YouTube description + song metadata via Gemini
    const lyrics = project.lyrics as Record<string, string[]>;
    const lyricsText = Object.values(lyrics).flat().join("\n");
    const categoryName = job.category_slug.replace(/-/g, " ");

    let seoTitle = `${job.title} Song`;
    let seoDescription = job.prompt;
    let seoTags: string[] = ["kids songs", "children music", "learn english", job.category_slug];

    try {
      const brandName = process.env.BRAND_NAME || "SparkGen";
      console.log(`[render] Generating SEO metadata...`);
      const seoRes = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are a YouTube SEO expert for music content. Write optimized metadata for this music video.

Song: "${job.title}"
Genre: ${categoryName}
Theme: ${job.prompt}
Lyrics:
${lyricsText}

Brand: ${brandName} - AI Music Video Generator

Generate a JSON object with:

1. "title": YouTube title (max 70 chars). Format: "${job.title} | ${brandName} - ${categoryName}"
   - Include key SEO terms naturally

2. "description": YouTube description (300-500 words). Structure:
   - Line 1: Hook sentence with emoji
   - Line 2-3: Brief engaging summary of the song
   - Empty line
   - "🎵 FULL LYRICS 🎵" section with complete lyrics
   - Empty line
   - "🌟 About This Song" section: describe the mood, style, and genre
   - Empty line
   - "🎶 About ${brandName}" section: "${brandName} creates AI-generated music videos with stunning visuals and original compositions across all genres."
   - Empty line
   - Hashtags line: 15-20 relevant hashtags (#${brandName} #MusicVideo #${categoryName} #AIMusic etc.)

3. "tags": Array of 15-20 YouTube tags for maximum discoverability. Include:
   - Brand: "${brandName.toLowerCase()}", "${brandName.toLowerCase()} music"
   - Genre: "${categoryName}", "${categoryName} music", "${categoryName} songs"
   - General: "music video", "ai music", "ai generated music", "original song"
   - Theme-specific tags based on the song content

Return ONLY valid JSON.`,
        config: { responseMimeType: "application/json", temperature: 0.7 },
      });

      const seoData = JSON.parse(seoRes.text || "{}");
      if (seoData.title) seoTitle = seoData.title;
      if (seoData.description) seoDescription = seoData.description;
      if (seoData.tags?.length) seoTags = seoData.tags;
      console.log(`[render] SEO metadata generated: "${seoTitle}"`);
    } catch (e) {
      console.warn(`[render] SEO generation failed, using defaults:`, e instanceof Error ? e.message : e);
    }

    // Upload to YouTube (from same file buffer, no re-download needed)
    let ytVideoId: string | null = null;
    try {
      ytVideoId = await uploadToYouTube(finalBuffer, {
        title: seoTitle,
        description: seoDescription,
        tags: seoTags,
      });
      if (ytVideoId) console.log(`[render] YouTube: https://youtu.be/${ytVideoId}`);
    } catch (e) {
      console.warn(`[render] YouTube upload failed:`, e instanceof Error ? e.message : e);
    }

    // Create song
    const { data: catData } = await supabase.from("categories").select("id").eq("slug", job.category_slug).single();
    const estimatedCost = scenes.length * 0.04 + scenes.length * 0.05 * 6 + 0.08 + 0.01;

    const songId = crypto.randomUUID();
    const { error: songErr } = await supabase.from("songs").insert({
      id: songId, title: seoTitle, artist: "SparkGen AI",
      description: seoDescription, difficulty_level: 1, category_id: catData?.id || null,
      video_storage_path: videoStoragePath, video_url: finalVideoUrl,
      thumbnail_url: finalThumbnailUrl, video_size_bytes: finalBuffer.length,
      is_published: true, tags: seoTags,
      short_video_url: shortVideoUrl, short_video_storage_path: shortStoragePath,
    });
    if (songErr) {
      console.error(`[render] Song insert failed:`, songErr);
      throw new Error(`Song insert failed: ${songErr.message}`);
    }

    // Update project
    const { error: projErr } = await supabase.from("projects").update({
      status: "finished", final_video_url: finalVideoUrl,
      final_video_storage_path: videoStoragePath, final_thumbnail_url: finalThumbnailUrl,
      final_song_id: songId, render_status: "done",
      rendered_at: new Date().toISOString(), estimated_cost: estimatedCost,
    }).eq("id", job.project_id);
    if (projErr) console.error(`[render] Project update failed:`, projErr);

    // Mark job done
    await supabase.from("automation_jobs").update({
      status: "done", song_id: songId, estimated_cost: estimatedCost,
      completed_at: new Date().toISOString(), current_step: "done",
    }).eq("id", jobId);

    console.log(`[render] DONE! Song ${songId}, video ${finalVideoUrl}, ${fileSizeMB.toFixed(1)}MB, $${estimatedCost.toFixed(2)}`);

    // Auto-chain: pick next queued job and start it
    await triggerNextJob();
  } catch (error) {
    await supabase.from("automation_jobs").update({
      status: "error", error: error instanceof Error ? error.message : "Render failed",
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);
    // Still trigger next job even on error
    await triggerNextJob();
    throw error;
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  }
}

// ── Backfill Job (thumbnail + short for existing videos) ────────

export async function backfillJob(jobId: string) {
  const { data: job } = await supabase.from("automation_jobs").select("project_id, title, category_slug, prompt, song_id").eq("id", jobId).single();
  if (!job?.project_id || !job?.song_id) throw new Error("Job missing project_id or song_id");

  const { data: project } = await supabase.from("projects").select("music, lyrics").eq("id", job.project_id).single();
  if (!project) throw new Error("Project not found");
  const music = project.music as Record<string, unknown>;

  const { data: scenes } = await supabase.from("scenes").select("*").eq("project_id", job.project_id).order("scene_number", { ascending: true });
  if (!scenes?.length) throw new Error("No scenes");

  const audioDuration = (music.audioDuration as number) || 180;
  const exactSubtitles = music.exactSubtitles as Array<{ id: number; startSeconds: number; endSeconds: number; text: string }> | undefined;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // 1. Generate thumbnail
  let thumbnailUrl = scenes[0].image_url;
  try {
    console.log(`[backfill] ${job.title}: generating thumbnail...`);
    const thumbRes = await retryFn("thumbnail", () => ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [{ text: `Create a YouTube thumbnail for music video "${job.title}". Cinematic style matching the genre, visual element related to "${job.prompt}" center, large bold text "${job.title}" with contrast. 16:9 widescreen, attention-grabbing.` }],
      config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" as any, imageSize: "2K" } },
    }), 4);
    const thumbPart = thumbRes.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
    if (thumbPart?.inlineData?.data) {
      const thumbBytes = Uint8Array.from(atob(thumbPart.inlineData.data), c => c.charCodeAt(0));
      await supabase.storage.from("thumbnails").upload(`generated/${job.project_id}/youtube-thumbnail.png`, thumbBytes, { cacheControl: "3600", upsert: true, contentType: "image/png" });
      thumbnailUrl = supabase.storage.from("thumbnails").getPublicUrl(`generated/${job.project_id}/youtube-thumbnail.png`).data.publicUrl;
    }
  } catch (e) { console.warn(`[backfill] ${job.title}: thumbnail failed`, e instanceof Error ? e.message : e); }

  // 2. Render 30s short from full video (not clips — Veo URIs expire)
  let shortVideoUrl: string | null = null;
  let shortStoragePath: string | null = null;
  let tempDir = "";
  try {
    // Get the song's full video URL
    const { data: songData } = await supabase.from("songs").select("video_url, video_storage_path").eq("id", job.song_id).single();
    if (!songData?.video_url) throw new Error("No full video URL");

    const videoUrl = songData.video_url;
    tempDir = await mkdtemp(path.join(os.tmpdir(), "sparkgen-backfill-"));
    const outPath = path.join(tempDir, "short.mp4");
    const fullVideoPath = path.join(tempDir, "full.mp4");

    if (videoUrl.includes("supabase")) {
      // Direct MP4 download from Supabase Storage
      console.log(`[backfill] ${job.title}: downloading MP4 from Supabase...`);
      await writeFile(fullVideoPath, await fetchBinary(videoUrl));
    } else {
      // HLS stream from Bunny — download via FFmpeg
      console.log(`[backfill] ${job.title}: downloading HLS stream...`);
      await runFfmpeg([
        "-y", "-protocol_whitelist", "file,http,https,tcp,tls,crypto",
        "-i", videoUrl,
        "-c", "copy", fullVideoPath,
      ]);
    }

    // Crop center of 16:9 → 9:16 + take first 30s
    await runFfmpeg([
      "-y", "-i", fullVideoPath,
      "-t", "30",
      "-vf", "crop=ih*9/16:ih,scale=720:1280",
      "-c:v", "libx264", "-preset", "fast", "-crf", "26",
      "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
      outPath,
    ]);

    const shortBuffer = await readFile(outPath);
    if (shortBuffer.length > 10000 && BUNNY_API_KEY && BUNNY_LIBRARY_ID) {
      const bunny = await uploadToBunnyStream(shortBuffer, `${job.title} - Short`);
      shortVideoUrl = bunny.videoUrl;
      shortStoragePath = `bunny:${bunny.videoId}`;
      console.log(`[backfill] ${job.title}: short uploaded (${(shortBuffer.length/1024/1024).toFixed(1)}MB)`);
    } else {
      console.warn(`[backfill] ${job.title}: short too small (${shortBuffer.length} bytes), skipping`);
    }
  } catch (e) { console.warn(`[backfill] ${job.title}: short failed`, e instanceof Error ? e.message : e); }
  finally { if (tempDir) await rm(tempDir, { recursive: true, force: true }); }

  // 3. Generate SEO description if missing
  const { data: currentSong } = await supabase.from("songs").select("description, tags").eq("id", job.song_id).single();
  let seoDescription = currentSong?.description;
  let seoTags = currentSong?.tags;

  if (!seoDescription || seoDescription.length < 200) {
    try {
      console.log(`[backfill] ${job.title}: generating SEO metadata...`);
      const lyrics = project.lyrics as Record<string, string[]>;
      const lyricsText = lyrics ? Object.values(lyrics).flat().join("\n") : "";
      const categoryName = (job.category_slug || "kids").replace(/-/g, " ");

      const seoRes = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Write YouTube metadata for ${categoryName} music video "${job.title}".
Theme: ${job.prompt || job.title}
${lyricsText ? `Lyrics:\n${lyricsText}` : ""}

Return JSON: {"title":"${job.title} | SparkGen - ${categoryName}","description":"[hook emoji]\\n[summary]\\n\\n🎵 FULL LYRICS 🎵\\n[lyrics]\\n\\n🌟 About This Song\\n[mood and style]\\n\\n🎶 About SparkGen\\nSparkGen creates AI-generated music videos with stunning visuals and original compositions.\\n\\n#SparkGen #MusicVideo #${categoryName} #AIMusic","tags":["sparkgen","${categoryName}","music video","ai music","original song"]}`,
        config: { responseMimeType: "application/json", temperature: 0.7 },
      });
      const rawText = seoRes.text || "";
      console.log(`[backfill] ${job.title}: SEO raw length=${rawText.length}`);
      try {
        const seoData = JSON.parse(rawText);
        if (seoData.description) seoDescription = seoData.description;
        if (seoData.tags?.length) seoTags = seoData.tags;
      } catch {
        // Gemini returned plain text instead of JSON — use as description directly
        if (rawText.length > 100) seoDescription = rawText;
      }
      console.log(`[backfill] ${job.title}: SEO generated (${seoDescription?.length || 0} chars)`);
    } catch (e) { console.warn(`[backfill] ${job.title}: SEO failed`, e instanceof Error ? e.message : e); }
  }

  // 4. Update song
  const updatePayload = {
    thumbnail_url: thumbnailUrl,
    ...(shortVideoUrl ? { short_video_url: shortVideoUrl, short_video_storage_path: shortStoragePath } : {}),
    ...(seoDescription ? { description: seoDescription } : {}),
    ...(seoTags?.length ? { tags: seoTags } : {}),
    artist: "SparkGen AI",
  };
  console.log(`[backfill] ${job.title}: updating song ${job.song_id} with ${Object.keys(updatePayload).length} fields (desc=${seoDescription?.length || 0}chars)`);
  const { error: updateErr } = await supabase.from("songs").update(updatePayload).eq("id", job.song_id);
  if (updateErr) console.error(`[backfill] ${job.title}: UPDATE FAILED:`, updateErr);

  console.log(`[backfill] ${job.title}: DONE`);
}

async function triggerNextJob() {
  try {
    // Find next queued job
    const { data: nextJobs } = await supabase
      .from("automation_jobs")
      .select("id, title")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1);

    if (!nextJobs || nextJobs.length === 0) {
      console.log("[auto-chain] No more queued jobs. All done!");
      return;
    }

    const next = nextJobs[0];

    const railwayUrl = `http://localhost:${process.env.PORT || 3000}`;
    const secret = process.env.AUTOMATION_SECRET;

    console.log(`[auto-chain] Triggering next job: ${next.title} (${next.id})`);
    const triggerRes = await fetch(`${railwayUrl}/full-pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-automation-secret": secret || "" },
      body: JSON.stringify({ jobId: next.id }),
    });
    if (!triggerRes.ok) {
      console.error(`[auto-chain] Failed to trigger ${next.id}: HTTP ${triggerRes.status}`);
    }
  } catch (e) {
    console.error("[auto-chain] Failed to trigger next job:", e instanceof Error ? e.message : e);
  }
}
