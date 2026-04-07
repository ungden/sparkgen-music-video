import { getGeminiClient } from "@/lib/gemini";
import { AI_MODELS } from "@/lib/models";
import { requireAuth } from "@/lib/api-auth";
import { buildScenesPrompt } from "@/lib/prompts";
import { normalizeGeneratedScenes } from "@/lib/scenes";
import { Lyrics } from "@/types/project";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    if (!body.lyrics || !body.theme) {
      return NextResponse.json({ error: "lyrics and theme required" }, { status: 400 });
    }

    const ai = getGeminiClient();
    const lyricsText = Object.entries(body.lyrics)
      .map(([section, lines]) => `[${section}]\n${(lines as string[]).join("\n")}`)
      .join("\n\n");

    const numScenes = Number(body.numScenes || 8);

    const result = await ai.models.generateContent({
      model: AI_MODELS.TEXT,
      contents: buildScenesPrompt(lyricsText, body.theme, numScenes, body.genreSlug),
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    });

    const text = result.text ?? "";
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON. Please try again." }, { status: 500 });
    }

    if (!data.scenes || !Array.isArray(data.scenes)) {
      return NextResponse.json({ error: "AI returned incomplete data. Please try again." }, { status: 500 });
    }

    const formattedScenes = normalizeGeneratedScenes(data.scenes, body.lyrics as Lyrics, numScenes);

    return NextResponse.json({
      scenes: formattedScenes,
      characterPrompt: data.characterDescription,
      artStyle: data.visualStyle
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("generate-scenes error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
