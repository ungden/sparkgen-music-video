import { renderFinalVideo } from "@/lib/render";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const outputBuffer = await renderFinalVideo({
      scenes: body.scenes || [],
      musicAudioBase64: body.musicAudioBase64,
      musicAudioUrl: body.musicAudioUrl,
      musicMimeType: body.musicMimeType,
    });

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="final-video.mp4"',
      },
    });
  } catch (error: unknown) {
    console.error("render-final error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to render final video" },
      { status: 500 }
    );
  }
}
