import { getGeminiClient } from "@/lib/gemini";
import { buildRockScenesPrompt } from "@/lib/prompts";
import { requireAuth } from "@/lib/api-auth";
import { AI_MODELS } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    if (!body.lyricsText) {
      return NextResponse.json({ error: "lyricsText required" }, { status: 400 });
    }

    const ai = getGeminiClient();
    const result = await ai.models.generateContent({
      model: AI_MODELS.TEXT,
      contents: buildRockScenesPrompt(body.lyricsText, body.theme || "", body.categorySlug),
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

    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
