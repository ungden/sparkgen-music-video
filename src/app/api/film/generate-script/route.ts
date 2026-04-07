import { getGeminiClient } from "@/lib/gemini";
import { buildScriptPrompt } from "@/lib/film/prompts";
import { requireAuth } from "@/lib/api-auth";
import { AI_MODELS } from "@/lib/models";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    if (!body.storyIdea && !body.customPrompt) {
      return new Response(JSON.stringify({ error: "storyIdea or customPrompt required" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContentStream({
      model: AI_MODELS.TEXT,
      contents: buildScriptPrompt(body.storyIdea || "", body.customPrompt, body.filmStyleSlug),
      config: { temperature: 1.0 },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) { controller.error(err); }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
