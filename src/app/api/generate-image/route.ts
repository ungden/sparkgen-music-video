import { getGeminiClient } from "@/lib/gemini";
import { buildImagePrompt } from "@/lib/prompts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.description) {
      return NextResponse.json({ error: "description required" }, { status: 400 });
    }

    const ai = getGeminiClient();
    const prompt = buildImagePrompt(body.description, body.style);

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    const parts = result.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    for (const part of parts) {
      if (part.inlineData) {
        return NextResponse.json({
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
        });
      }
    }

    return NextResponse.json({ error: "No image generated" }, { status: 500 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("generate-image error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
