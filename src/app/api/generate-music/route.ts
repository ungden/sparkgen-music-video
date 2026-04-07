import { getGeminiClient } from "@/lib/gemini";
import { AI_MODELS } from "@/lib/models";
import { requireAuth } from "@/lib/api-auth";
import { buildMusicPrompt } from "@/lib/prompts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    if (!body.lyrics) {
      return NextResponse.json({ error: "lyrics required" }, { status: 400 });
    }

    const ai = getGeminiClient();
    const prompt = buildMusicPrompt(
      body.lyrics,
      body.theme,
      body.genre,
      body.mood,
      body.tempo,
      body.instruments,
      body.genreSlug
    );

    const response = await ai.models.generateContent({
      model: AI_MODELS.MUSIC,
      contents: prompt,
      config: {
        responseModalities: ["AUDIO", "TEXT"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    let audioBase64: string | null = null;
    let mimeType = "audio/mp3";

    for (const part of parts) {
      if (part.inlineData) {
        audioBase64 = part.inlineData.data ?? null;
        mimeType = part.inlineData.mimeType || "audio/mp3";
      }
    }

    if (!audioBase64) {
      return NextResponse.json(
        { error: "No audio generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ audioBase64, mimeType });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("generate-music error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
