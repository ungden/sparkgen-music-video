import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { SubtitleCue } from "@/lib/subtitles";

export interface RenderSceneInput {
  id: number;
  videoUrl: string;
  time?: string;
  lyrics?: string;
}

function getAudioExtension(mimeType?: string): string {
  if (!mimeType) return "mp3";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("aac")) return "aac";
  if (mimeType.includes("mp4")) return "m4a";
  return "mp3";
}

async function fetchBinary(url: string): Promise<Buffer> {
  const headers: HeadersInit = {};
  if (process.env.GEMINI_API_KEY && url.includes("googleapis.com")) {
    headers["x-goog-api-key"] = process.env.GEMINI_API_KEY;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Failed to fetch asset: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function runFfmpeg(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

export async function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      audioPath,
    ]);
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk.toString()));
    child.on("close", (code) => {
      if (code === 0) resolve(parseFloat(output.trim()));
      else resolve(60); // fallback 60s
    });
    child.on("error", () => resolve(60));
  });
}

function formatSrtTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":") + `,${String(milliseconds).padStart(3, "0")}`;
}

function parseSceneTime(time?: string, fallbackIndex = 0): { start: number; end: number } {
  if (!time) return { start: fallbackIndex * 6, end: fallbackIndex * 6 + 6 };
  const parts = time.split("-").map((part) => part.trim());
  const parsePart = (value: string): number => {
    const tokens = value.split(":").map((token) => Number(token));
    if (tokens.some((token) => Number.isNaN(token))) return 0;
    if (tokens.length === 2) return tokens[0] * 60 + tokens[1];
    if (tokens.length === 3) return tokens[0] * 3600 + tokens[1] * 60 + tokens[2];
    return 0;
  };
  const start = parsePart(parts[0] || "0:00");
  const end = parts[1] ? parsePart(parts[1]) : start + 6;
  return { start, end: end > start ? end : start + 6 };
}

function buildSrt(scenes: RenderSceneInput[], exactSubtitles?: SubtitleCue[]): string {
  if (exactSubtitles && exactSubtitles.length > 0) {
    return exactSubtitles
      .map((cue, index) => {
        const text = cue.text.replace(/\s+/g, " ").trim();
        return `${index + 1}\n${formatSrtTimestamp(cue.startSeconds)} --> ${formatSrtTimestamp(cue.endSeconds)}\n${text}\n`;
      })
      .join("\n");
  }

  // Fallback to scene-based timing if no precise cues available
  return scenes
    .map((scene, index) => {
      const { start, end } = parseSceneTime(scene.time, index);
      const text = (scene.lyrics || "").replace(/\s+/g, " ").trim() || `Scene ${scene.id}`;
      return `${index + 1}\n${formatSrtTimestamp(start)} --> ${formatSrtTimestamp(end)}\n${text}\n`;
    })
    .join("\n");
}

export async function renderFinalVideo(params: {
  scenes: RenderSceneInput[];
  musicAudioBase64?: string;
  musicAudioUrl?: string;
  musicMimeType?: string;
  audioDuration?: number;
  exactSubtitles?: SubtitleCue[];
}) {
  let tempDir = "";
  try {
    const scenes = params.scenes.filter((scene) => scene.videoUrl);
    if (scenes.length === 0) throw new Error("At least one rendered scene video is required");

    tempDir = await mkdtemp(path.join(os.tmpdir(), "sparkgen-render-"));
    const clipPaths: string[] = [];

    for (let index = 0; index < scenes.length; index += 1) {
      const clipPath = path.join(tempDir, `clip-${index}.mp4`);
      await writeFile(clipPath, await fetchBinary(scenes[index].videoUrl));
      clipPaths.push(clipPath);
    }

    const concatFilePath = path.join(tempDir, "concat.txt");
    const loopedClipPaths: string[] = [];
    if (params.audioDuration && params.audioDuration > 0) {
      const durationPerClip = 6;
      const totalClips = Math.ceil(params.audioDuration / durationPerClip);
      for (let i = 0; i < totalClips; i++) {
        loopedClipPaths.push(clipPaths[i % clipPaths.length]);
      }
    } else {
      loopedClipPaths.push(...clipPaths);
    }
    await writeFile(concatFilePath, loopedClipPaths.map((clipPath) => `file '${clipPath.replace(/'/g, "'\\''")}'`).join("\n"));

    const outputPath = path.join(tempDir, "final-video.mp4");
    const subtitlePath = path.join(tempDir, "subtitles.srt");
    await writeFile(subtitlePath, buildSrt(scenes, params.exactSubtitles));
    const subtitleFilter = `subtitles=${subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:")}`;

    if (params.musicAudioBase64 || params.musicAudioUrl) {
      const audioExtension = getAudioExtension(params.musicMimeType);
      const audioPath = path.join(tempDir, `soundtrack.${audioExtension}`);
      if (params.musicAudioBase64) await writeFile(audioPath, Buffer.from(params.musicAudioBase64, "base64"));
      else await writeFile(audioPath, await fetchBinary(params.musicAudioUrl!));

      await runFfmpeg([
        "-y", "-f", "concat", "-safe", "0", "-i", concatFilePath,
        "-stream_loop", "-1", "-i", audioPath,
        "-vf", subtitleFilter,
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", outputPath,
      ]);
    } else {
      await runFfmpeg([
        "-y", "-f", "concat", "-safe", "0", "-i", concatFilePath,
        "-vf", subtitleFilter,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", outputPath,
      ]);
    }

    return await readFile(outputPath);
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  }
}

export async function renderStillImageClip(params: {
  imageBase64: string;
  mimeType?: string;
  durationSeconds?: number;
}) {
  let tempDir = "";
  try {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "sparkgen-still-clip-"));
    const extension = params.mimeType?.includes("jpeg") || params.mimeType?.includes("jpg") ? "jpg" : "png";
    const imagePath = path.join(tempDir, `frame.${extension}`);
    const outputPath = path.join(tempDir, "still-clip.mp4");

    await writeFile(imagePath, Buffer.from(params.imageBase64, "base64"));

    await runFfmpeg([
      "-y",
      "-loop", "1",
      "-i", imagePath,
      "-t", String(params.durationSeconds ?? 6),
      "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  }
}
