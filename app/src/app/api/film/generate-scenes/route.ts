import { getGeminiClient } from "@/lib/gemini";
import { buildFilmScenesPrompt } from "@/lib/film/prompts";
import { requireAuth } from "@/lib/api-auth";
import { AI_MODELS } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    if (!body.scriptScenes) {
      return NextResponse.json({ error: "scriptScenes required" }, { status: 400 });
    }

    const ai = getGeminiClient();
    const result = await ai.models.generateContent({
      model: AI_MODELS.TEXT,
      contents: buildFilmScenesPrompt(body.scriptScenes, body.filmStyleSlug),
      config: { responseMimeType: "application/json", temperature: 0.8 },
    });

    const text = result.text ?? "";
    let data;
    try { data = JSON.parse(text); } catch {
      return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 500 });
    }
    if (!data.scenes || !Array.isArray(data.scenes)) {
      return NextResponse.json({ error: "AI returned incomplete data." }, { status: 500 });
    }

    // Map enhanced descriptions back to scenes with timing
    const scriptScenes = body.scriptScenes as Array<{ title: string; narration: string; durationEstimate: number }>;
    let currentTime = 0;
    const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = Math.round(s % 60);
      return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    const scenes = scriptScenes.map((ss, i) => {
      const enhanced = data.scenes[i] || {};
      const start = currentTime;
      const end = start + (ss.durationEstimate || 6);
      currentTime = end;
      return {
        id: i + 1,
        title: enhanced.title || ss.title,
        time: `${formatTime(start)} - ${formatTime(end)}`,
        narrationText: ss.narration,
        visualDescription: enhanced.description || ss.narration,
        durationEstimate: ss.durationEstimate || 6,
        status: "pending" as const,
      };
    });

    return NextResponse.json({
      scenes,
      characterPrompt: data.characterDescription,
      artStyle: data.visualStyle,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
