import { getGeminiClient } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if ((!body.imageBase64 && !body.imageUrl) || !body.prompt) {
      return NextResponse.json({ error: "imageBase64/imageUrl and prompt required" }, { status: 400 });
    }

    const provider = body.provider || "veo";

    if (provider === "p-video") {
      const token = process.env.REPLICATE_API_TOKEN;
      if (!token) throw new Error("REPLICATE_API_TOKEN is not set");

      let imageInput: string | undefined;
      if (body.imageUrl) imageInput = body.imageUrl;
      else if (body.imageBase64) imageInput = `data:image/png;base64,${body.imageBase64}`;

      const input: Record<string, unknown> = {
        prompt: body.prompt, duration: body.duration || 5, resolution: "720p",
        fps: 24, aspect_ratio: "16:9", draft: body.draft || false,
        prompt_upsampling: true, save_audio: true,
      };
      if (imageInput) input.image = imageInput;

      const createRes = await fetch("https://api.replicate.com/v1/models/prunaai/p-video/predictions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait" },
        body: JSON.stringify({ input }),
      });
      if (!createRes.ok) throw new Error(`Replicate error: ${createRes.status}`);

      let prediction = await createRes.json();
      for (let i = 0; i < 120; i++) {
        if (prediction.status === "succeeded") break;
        if (prediction.status === "failed" || prediction.status === "canceled") throw new Error(prediction.error || "P-Video failed");
        await new Promise((r) => setTimeout(r, 2000));
        prediction = await (await fetch(prediction.urls.get, { headers: { Authorization: `Bearer ${token}` } })).json();
      }
      if (prediction.status !== "succeeded") throw new Error("P-Video timed out");

      return NextResponse.json({ done: true, videoFileName: "p-video-output", videoUrl: prediction.output, provider: "p-video" });
    }

    // Veo
    const ai = getGeminiClient();
    let imageBytes = body.imageBase64;
    if (!imageBytes && body.imageUrl) {
      const r = await fetch(body.imageUrl);
      if (!r.ok) throw new Error("Failed to fetch image");
      imageBytes = Buffer.from(await r.arrayBuffer()).toString("base64");
    }

    let operation = await ai.models.generateVideos({
      model: "veo-3.1-lite-generate-preview", prompt: body.prompt,
      image: { imageBytes: imageBytes!, mimeType: "image/png" },
      config: { aspectRatio: "16:9", resolution: "720p", durationSeconds: body.duration || 6, numberOfVideos: 1, personGeneration: "allow_adult" },
    });

    for (let i = 0; i < 60; i++) {
      if (operation.done) break;
      await new Promise((r) => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }
    if (!operation.done) throw new Error("Veo timed out");

    const video = operation.response?.generatedVideos?.[0]?.video;
    if (!video) throw new Error("No video generated");

    return NextResponse.json({ done: true, videoFileName: video.uri || "", videoUrl: video.uri || "", provider: "veo" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
