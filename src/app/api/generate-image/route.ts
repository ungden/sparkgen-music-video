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
    let promptText = buildImagePrompt(body.description, body.style, body.genreSlug);

    if (body.characterReferenceBase64 || body.characterReferenceUrl) {
      promptText = `Use the attached image as the main character reference. Place this EXACT character into the following new scene and pose:

${promptText}

CRITICAL: The background, pose, and environment MUST match the new scene description. Do NOT just recreate the reference image's blank background. Maintain the character's facial features and clothing perfectly.`;
    }

    const contents: Array<{
      text?: string;
      inlineData?: { mimeType: string; data: string };
    }> = [{ text: promptText }];

    if (body.characterReferenceBase64) {
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: body.characterReferenceBase64,
        },
      });
    } else if (body.characterReferenceUrl) {
      const referenceResponse = await fetch(body.characterReferenceUrl);
      if (!referenceResponse.ok) {
        return NextResponse.json({ error: "Failed to fetch character reference image" }, { status: 400 });
      }
      const mimeType = referenceResponse.headers.get("content-type") || "image/png";
      const referenceBuffer = Buffer.from(await referenceResponse.arrayBuffer());
      contents.push({
        inlineData: {
          mimeType,
          data: referenceBuffer.toString("base64"),
        },
      });
    }

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K",
        },
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
