import { getGeminiClient } from "@/lib/gemini";
import { buildStoryIdeasPrompt } from "@/lib/film/prompts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ai = getGeminiClient();

    const result = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: buildStoryIdeasPrompt(body.topic, body.filmStyleSlug),
      config: { responseMimeType: "application/json", temperature: 1.0 },
    });

    const text = result.text ?? "";
    let ideas;
    try { ideas = JSON.parse(text); } catch {
      return NextResponse.json({ error: "AI returned invalid JSON. Please try again." }, { status: 500 });
    }
    if (!Array.isArray(ideas) || ideas.length < 4) {
      return NextResponse.json({ error: "AI returned incomplete data." }, { status: 500 });
    }
    return NextResponse.json({ ideas: ideas.slice(0, 4) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
