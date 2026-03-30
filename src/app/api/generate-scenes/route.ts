import { getGeminiClient } from "@/lib/gemini";
import { buildScenesPrompt } from "@/lib/prompts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.lyrics || !body.theme) {
      return NextResponse.json({ error: "lyrics and theme required" }, { status: 400 });
    }

    const ai = getGeminiClient();
    const lyricsText = Object.entries(body.lyrics)
      .map(([section, lines]) => `[${section}]\n${(lines as string[]).join("\n")}`)
      .join("\n\n");

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: buildScenesPrompt(lyricsText, body.theme, body.numScenes || 5),
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    });

    const text = result.text ?? "";
    let scenes;
    try {
      scenes = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON. Please try again." }, { status: 500 });
    }

    if (!Array.isArray(scenes)) {
      return NextResponse.json({ error: "AI returned incomplete data. Please try again." }, { status: 500 });
    }

    const formattedScenes = scenes.map((s: Record<string, string>, i: number) => ({
      id: i + 1,
      title: s.title,
      time: s.time,
      lyrics: s.lyrics,
      description: s.description,
      status: "pending" as const,
    }));

    return NextResponse.json({ scenes: formattedScenes });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("generate-scenes error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
