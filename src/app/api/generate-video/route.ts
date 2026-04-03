import { getGeminiClient } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // Allow up to 5 minutes for video generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if ((!body.imageBase64 && !body.imageUrl) || !body.prompt) {
      return NextResponse.json(
        { error: "imageBase64 or imageUrl and prompt required" },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    let imageBytes = body.imageBase64 as string | undefined;

    if (!imageBytes && body.imageUrl) {
      const imageResponse = await fetch(body.imageUrl);
      if (!imageResponse.ok) {
        return NextResponse.json({ error: "Failed to fetch scene image" }, { status: 400 });
      }
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      imageBytes = imageBuffer.toString("base64");
    }

    // Start async video generation with Veo (image-to-video)
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-lite-generate-preview",
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
        personGeneration: "allow_adult", // Required for Veo image-to-video
      },
    });

    // Poll for completion (video gen is async)
    const maxAttempts = 60;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (operation.done) break;
      await new Promise((r) => setTimeout(r, 10000)); // 10s intervals
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }

    if (!operation.done) {
      return NextResponse.json(
        { error: "Video generation timed out after 10 minutes" },
        { status: 504 }
      );
    }

    const video = operation.response?.generatedVideos?.[0]?.video;
    if (!video) {
      return NextResponse.json(
        { error: "No video generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      done: true,
      videoFileName: video.uri || "generated-video",
      videoUri: video.uri || "",
      videoUrl: video.uri || "",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("generate-video error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
