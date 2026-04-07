import { getGeminiClient } from "@/lib/gemini";
import { AI_MODELS } from "@/lib/models";
import { requireAuth } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

// --- P-Video (Replicate) ---

async function generateWithPVideo(body: {
  imageBase64?: string;
  imageUrl?: string;
  prompt: string;
  duration?: number;
  draft?: boolean;
  resolution?: string;
}) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set");

  // P-Video needs image as URL. If we have base64, create a data URI.
  let imageInput: string | undefined;
  if (body.imageUrl) {
    imageInput = body.imageUrl;
  } else if (body.imageBase64) {
    imageInput = `data:image/png;base64,${body.imageBase64}`;
  }

  const input: Record<string, unknown> = {
    prompt: body.prompt,
    duration: body.duration ? Number(body.duration) : 5,
    resolution: body.resolution || "720p",
    fps: 24,
    aspect_ratio: "16:9",
    draft: body.draft || false,
    prompt_upsampling: true,
    save_audio: true,
    disable_safety_filter: false,
  };
  if (imageInput) input.image = imageInput;

  // Create prediction
  const createRes = await fetch(
    "https://api.replicate.com/v1/models/prunaai/p-video/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({ input }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({ detail: `HTTP ${createRes.status}` }));
    throw new Error(err.detail || `Replicate API error: ${createRes.status}`);
  }

  let prediction = await createRes.json();

  // Poll if not yet completed (Prefer: wait may return immediately)
  const maxAttempts = 120;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (prediction.status === "succeeded") break;
    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(prediction.error || "P-Video generation failed");
    }
    await new Promise((r) => setTimeout(r, 2000)); // 2s intervals (P-Video is fast)
    const pollRes = await fetch(prediction.urls.get, {
      headers: { Authorization: `Bearer ${token}` },
    });
    prediction = await pollRes.json();
  }

  if (prediction.status !== "succeeded") {
    throw new Error("P-Video generation timed out");
  }

  return {
    done: true,
    videoFileName: "p-video-output",
    videoUri: prediction.output,
    videoUrl: prediction.output,
    provider: "p-video",
  };
}

// --- Veo (Google) ---

async function generateWithVeo(body: {
  imageBase64?: string;
  imageUrl?: string;
  prompt: string;
  duration?: number;
}) {
  const ai = getGeminiClient();
  let imageBytes = body.imageBase64;

  if (!imageBytes && body.imageUrl) {
    const imageResponse = await fetch(body.imageUrl);
    if (!imageResponse.ok) throw new Error("Failed to fetch scene image");
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    imageBytes = imageBuffer.toString("base64");
  }

  let operation = await ai.models.generateVideos({
    model: AI_MODELS.VIDEO,
    prompt: body.prompt,
    image: {
      imageBytes: imageBytes!,
      mimeType: "image/png",
    },
    config: {
      aspectRatio: "16:9",
      resolution: "720p",
      durationSeconds: body.duration ? Number(body.duration) : 6,
      numberOfVideos: 1,
      personGeneration: "allow_adult",
    },
  });

  const maxAttempts = 60;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (operation.done) break;
    await new Promise((r) => setTimeout(r, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  if (!operation.done) throw new Error("Video generation timed out after 10 minutes");

  const video = operation.response?.generatedVideos?.[0]?.video;
  if (!video) throw new Error("No video generated");

  return {
    done: true,
    videoFileName: video.uri || "generated-video",
    videoUri: video.uri || "",
    videoUrl: video.uri || "",
    provider: "veo",
  };
}

// --- Route Handler ---

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    if ((!body.imageBase64 && !body.imageUrl) || !body.prompt) {
      return NextResponse.json(
        { error: "imageBase64 or imageUrl and prompt required" },
        { status: 400 }
      );
    }

    const provider = body.provider || "veo";

    const result =
      provider === "p-video"
        ? await generateWithPVideo(body)
        : await generateWithVeo(body);

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("generate-video error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
