import { renderFilmVideo } from "@/lib/film/render";
import { requireAuth } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { execSync } from "node:child_process";

export const runtime = "nodejs";
export const maxDuration = 300;

function hasFFmpeg(): boolean {
  try { execSync("ffmpeg -version", { stdio: "ignore" }); return true; } catch { return false; }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();

    if (!hasFFmpeg()) {
      const scenes = (body.scenes || []).filter((s: { videoUrl?: string }) => s.videoUrl);
      return NextResponse.json({
        fallback: true,
        message: "FFmpeg not available. Download individual clips instead.",
        clips: scenes.map((s: { id: number; videoUrl: string }) => ({ id: s.id, videoUrl: s.videoUrl })),
      });
    }

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
