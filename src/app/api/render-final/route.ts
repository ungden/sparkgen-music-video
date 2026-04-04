import { renderFinalVideo } from "@/lib/render";
import { NextRequest, NextResponse } from "next/server";
import { execSync } from "node:child_process";

export const runtime = "nodejs";
export const maxDuration = 300;

function hasFFmpeg(): boolean {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If FFmpeg not available (e.g. Vercel), return video URLs for client-side download
    if (!hasFFmpeg()) {
      const scenes = (body.scenes || []).filter((s: { videoUrl?: string }) => s.videoUrl);
      return NextResponse.json({
        fallback: true,
        message: "FFmpeg not available on this server. Download individual clips instead.",
        clips: scenes.map((s: { id: number; videoUrl: string }) => ({ id: s.id, videoUrl: s.videoUrl })),
        musicAvailable: !!(body.musicAudioBase64 || body.musicAudioUrl),
      });
    }

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
