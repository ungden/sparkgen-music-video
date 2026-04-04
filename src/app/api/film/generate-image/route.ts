import { getGeminiClient } from "@/lib/gemini";
import { buildFilmImagePrompt } from "@/lib/film/prompts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.description) {
      return NextResponse.json({ error: "description required" }, { status: 400 });
    }

    const ai = getGeminiClient();
    let promptText = buildFilmImagePrompt(body.description, body.style, body.filmStyleSlug);

    const contents: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: promptText }];

    if (body.characterReferenceBase64) {
      promptText = `Use the attached image as the main character reference. Place this EXACT character into the new scene:\n\n${promptText}`;
      contents[0] = { text: promptText };
      contents.push({ inlineData: { mimeType: "image/jpeg", data: body.characterReferenceBase64 } });
    }

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
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
