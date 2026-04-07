import { getGeminiClient } from "@/lib/gemini";
import { requireAuth } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    if (!body.text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const ai = getGeminiClient();
    const voiceName = body.voiceName || "Kore";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: body.text,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json({ error: "No audio response" }, { status: 500 });
    }

    for (const part of parts) {
      if (part.inlineData) {
        return NextResponse.json({
          audioBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "audio/wav",
        });
      }
    }

    return NextResponse.json({ error: "No audio generated" }, { status: 500 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("generate-narration error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
