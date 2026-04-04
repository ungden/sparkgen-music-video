import { renderFilmVideo } from "@/lib/film/render";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const outputBuffer = await renderFilmVideo({
      scenes: body.scenes || [],
      bgmAudioBase64: body.bgmAudioBase64,
      bgmMimeType: body.bgmMimeType,
      bgmVolume: body.bgmVolume ?? 0.3,
    });

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="short-film.mp4"',
      },
    });
  } catch (error: unknown) {
    console.error("film render-final error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to render film" },
      { status: 500 }
    );
  }
}
