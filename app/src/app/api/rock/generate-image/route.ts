import { getGeminiClient } from "@/lib/gemini";
import { buildRockImagePrompt } from "@/lib/prompts";
import { requireAuth } from "@/lib/api-auth";
import { AI_MODELS } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    if (!body.description) {
      return NextResponse.json({ error: "description required" }, { status: 400 });
    }

    const ai = getGeminiClient();
    const promptText = buildRockImagePrompt(body.description, body.categorySlug);

    const contents: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: promptText }];

    const result = await ai.models.generateContent({
      model: AI_MODELS.IMAGE,
      contents,
      config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9", imageSize: "2K" } },
    });

    const parts = result.candidates?.[0]?.content?.parts;
    if (!parts) return NextResponse.json({ error: "No response from AI" }, { status: 500 });

    for (const part of parts) {
      if (part.inlineData) {
        return NextResponse.json({ imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png" });
      }
    }
    return NextResponse.json({ error: "No image generated" }, { status: 500 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
