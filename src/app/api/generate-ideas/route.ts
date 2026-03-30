import { getGeminiClient } from "@/lib/gemini";
import { buildIdeasPrompt } from "@/lib/prompts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ai = getGeminiClient();

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: buildIdeasPrompt(body.genre),
      config: {
        responseMimeType: "application/json",
        temperature: 1.2,
      },
    });

    const text = result.text ?? "";
    let ideas;
    try {
      ideas = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON. Please try again." }, { status: 500 });
    }

    if (!Array.isArray(ideas) || ideas.length < 4) {
      return NextResponse.json({ error: "AI returned incomplete data. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ideas: ideas.slice(0, 4) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("generate-ideas error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
