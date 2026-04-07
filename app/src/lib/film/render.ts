import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

export interface FilmRenderSceneInput {
  id: number;
  videoUrl: string;
  narrationText?: string;
  narrationAudioBase64?: string;
  narrationMimeType?: string;
  durationEstimate?: number;
}

async function fetchBinary(url: string): Promise<Buffer> {
  const headers: HeadersInit = {};
  if (process.env.GEMINI_API_KEY && url.includes("googleapis.com")) {
    headers["x-goog-api-key"] = process.env.GEMINI_API_KEY;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Failed to fetch: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function runFfmpeg(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

function formatSrtTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, "0")).join(":") + `,${String(ms).padStart(3, "0")}`;
}

function buildNarrationSrt(scenes: FilmRenderSceneInput[]): string {
  let currentTime = 0;
  return scenes
    .filter((s) => s.narrationText)
    .map((scene, index) => {
      const duration = scene.durationEstimate || 6;
      const start = currentTime;
      const end = start + duration;
      currentTime = end;
      const text = scene.narrationText!.replace(/\s+/g, " ").trim();
      return `${index + 1}\n${formatSrtTimestamp(start)} --> ${formatSrtTimestamp(end)}\n${text}\n`;
    })
    .join("\n");
}

export async function renderFilmVideo(params: {
  scenes: FilmRenderSceneInput[];
  bgmAudioBase64?: string;
  bgmMimeType?: string;
  bgmVolume?: number;
}) {
  let tempDir = "";
  try {
    const scenes = params.scenes.filter((s) => s.videoUrl);
    if (scenes.length === 0) throw new Error("At least one rendered scene video is required");

    tempDir = await mkdtemp(path.join(os.tmpdir(), "film-render-"));

    // Step 1: Download video clips and narration audio
    const muxedClipPaths: string[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const clipPath = path.join(tempDir, `clip-${i}.mp4`);
      await writeFile(clipPath, await fetchBinary(scenes[i].videoUrl));

      if (scenes[i].narrationAudioBase64) {
        // Mux video clip + narration audio
        const narExt = scenes[i].narrationMimeType?.includes("wav") ? "wav" : "mp3";
        const narPath = path.join(tempDir, `narration-${i}.${narExt}`);
        await writeFile(narPath, Buffer.from(scenes[i].narrationAudioBase64!, "base64"));

        const muxedPath = path.join(tempDir, `muxed-${i}.mp4`);
        await runFfmpeg([
          "-y", "-i", clipPath, "-i", narPath,
          "-c:v", "copy", "-c:a", "aac", "-shortest",
          muxedPath,
        ]);
        muxedClipPaths.push(muxedPath);
      } else {
        muxedClipPaths.push(clipPath);
      }
    }

    // Step 2: Concat all clips
    const concatFilePath = path.join(tempDir, "concat.txt");
    await writeFile(concatFilePath, muxedClipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));

    const concatOutputPath = path.join(tempDir, "concat-output.mp4");

    // Build subtitles
    const subtitlePath = path.join(tempDir, "subtitles.srt");
    await writeFile(subtitlePath, buildNarrationSrt(scenes));
    const subtitleFilter = `subtitles=${subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:")}`;

    await runFfmpeg([
      "-y", "-f", "concat", "-safe", "0", "-i", concatFilePath,
      "-vf", subtitleFilter,
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
      concatOutputPath,
    ]);

    // Step 3: Mix background music if provided
    if (params.bgmAudioBase64) {
      const bgmExt = params.bgmMimeType?.includes("wav") ? "wav" : "mp3";
      const bgmPath = path.join(tempDir, `bgm.${bgmExt}`);
      await writeFile(bgmPath, Buffer.from(params.bgmAudioBase64, "base64"));

      const finalPath = path.join(tempDir, "final-film.mp4");
      const vol = params.bgmVolume ?? 0.3;

      await runFfmpeg([
        "-y", "-i", concatOutputPath, "-stream_loop", "-1", "-i", bgmPath,
        "-filter_complex", `[0:a][1:a]amix=inputs=2:duration=first:weights=1 ${vol}[a]`,
        "-map", "0:v", "-map", "[a]",
        "-c:v", "copy", "-c:a", "aac", "-shortest",
        finalPath,
      ]);

      return await readFile(finalPath);
    }

    return await readFile(concatOutputPath);
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  }
}
