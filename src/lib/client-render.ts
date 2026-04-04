"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

async function getFFmpeg(onProgress?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg;

  ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => {
    if (onProgress && message) onProgress(message);
  });

  onProgress?.("Loading FFmpeg...");
  await ffmpeg.load({
    coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
    wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
  });

  return ffmpeg;
}

export interface RenderClip {
  id: number;
  videoUrl: string;
  lyrics?: string;
}

export interface RenderOptions {
  clips: RenderClip[];
  musicBase64?: string;
  musicMimeType?: string;
  onProgress?: (msg: string) => void;
}

export interface FilmRenderClip {
  id: number;
  videoUrl: string;
  narrationBase64?: string;
  narrationMimeType?: string;
}

export interface FilmRenderOptions {
  clips: FilmRenderClip[];
  bgmBase64?: string;
  bgmMimeType?: string;
  bgmVolume?: number;
  onProgress?: (msg: string) => void;
}

async function downloadClip(url: string, apiKey?: string): Promise<Uint8Array> {
  const headers: HeadersInit = {};
  if (apiKey && url.includes("googleapis.com")) {
    headers["x-goog-api-key"] = apiKey;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Render music video: concat clips + overlay music
 */
export async function renderMusicVideo(opts: RenderOptions): Promise<Blob> {
  const ff = await getFFmpeg(opts.onProgress);

  // Download and write clips
  opts.onProgress?.(`Downloading ${opts.clips.length} clips...`);
  for (let i = 0; i < opts.clips.length; i++) {
    opts.onProgress?.(`Downloading clip ${i + 1}/${opts.clips.length}...`);
    const data = await downloadClip(opts.clips[i].videoUrl);
    await ff.writeFile(`clip-${i}.mp4`, data);
  }

  // Create concat file
  const concatContent = opts.clips.map((_, i) => `file 'clip-${i}.mp4'`).join("\n");
  await ff.writeFile("concat.txt", concatContent);

  if (opts.musicBase64) {
    // Concat + music overlay
    const ext = opts.musicMimeType?.includes("wav") ? "wav" : "mp3";
    await ff.writeFile(`music.${ext}`, base64ToUint8Array(opts.musicBase64));

    opts.onProgress?.("Compositing video + music...");
    await ff.exec([
      "-y", "-f", "concat", "-safe", "0", "-i", "concat.txt",
      "-stream_loop", "-1", "-i", `music.${ext}`,
      "-map", "0:v:0", "-map", "1:a:0",
      "-c:v", "copy", "-c:a", "aac", "-shortest",
      "output.mp4",
    ]);
  } else {
    opts.onProgress?.("Concatenating clips...");
    await ff.exec([
      "-y", "-f", "concat", "-safe", "0", "-i", "concat.txt",
      "-c:v", "copy", "-c:a", "copy",
      "output.mp4",
    ]);
  }

  opts.onProgress?.("Reading output...");
  const output = await ff.readFile("output.mp4");

  // Cleanup
  for (let i = 0; i < opts.clips.length; i++) await ff.deleteFile(`clip-${i}.mp4`);
  await ff.deleteFile("concat.txt");
  await ff.deleteFile("output.mp4");

  return new Blob([output as BlobPart], { type: "video/mp4" });
}

/**
 * Render film: per-scene narration mux + concat + optional BGM
 */
export async function renderFilmClient(opts: FilmRenderOptions): Promise<Blob> {
  const ff = await getFFmpeg(opts.onProgress);

  // Download clips and write narration
  const muxedNames: string[] = [];
  for (let i = 0; i < opts.clips.length; i++) {
    const clip = opts.clips[i];
    opts.onProgress?.(`Downloading clip ${i + 1}/${opts.clips.length}...`);
    const videoData = await downloadClip(clip.videoUrl);
    await ff.writeFile(`clip-${i}.mp4`, videoData);

    if (clip.narrationBase64) {
      const ext = clip.narrationMimeType?.includes("wav") ? "wav" : "mp3";
      await ff.writeFile(`nar-${i}.${ext}`, base64ToUint8Array(clip.narrationBase64));

      opts.onProgress?.(`Muxing narration for scene ${i + 1}...`);
      await ff.exec([
        "-y", "-i", `clip-${i}.mp4`, "-i", `nar-${i}.${ext}`,
        "-c:v", "copy", "-c:a", "aac", "-shortest",
        `muxed-${i}.mp4`,
      ]);
      muxedNames.push(`muxed-${i}.mp4`);
    } else {
      muxedNames.push(`clip-${i}.mp4`);
    }
  }

  // Concat
  const concatContent = muxedNames.map((n) => `file '${n}'`).join("\n");
  await ff.writeFile("concat.txt", concatContent);

  opts.onProgress?.("Concatenating scenes...");
  await ff.exec([
    "-y", "-f", "concat", "-safe", "0", "-i", "concat.txt",
    "-c:v", "copy", "-c:a", "aac",
    "concat-out.mp4",
  ]);

  // BGM mix
  if (opts.bgmBase64) {
    const ext = opts.bgmMimeType?.includes("wav") ? "wav" : "mp3";
    await ff.writeFile(`bgm.${ext}`, base64ToUint8Array(opts.bgmBase64));

    const vol = opts.bgmVolume ?? 0.3;
    opts.onProgress?.("Mixing background music...");
    await ff.exec([
      "-y", "-i", "concat-out.mp4", "-stream_loop", "-1", "-i", `bgm.${ext}`,
      "-filter_complex", `[0:a][1:a]amix=inputs=2:duration=first:weights=1 ${vol}[a]`,
      "-map", "0:v", "-map", "[a]",
      "-c:v", "copy", "-c:a", "aac", "-shortest",
      "output.mp4",
    ]);
  } else {
    await ff.exec(["-y", "-i", "concat-out.mp4", "-c", "copy", "output.mp4"]);
  }

  opts.onProgress?.("Reading output...");
  const output = await ff.readFile("output.mp4");

  // Cleanup
  for (let i = 0; i < opts.clips.length; i++) {
    await ff.deleteFile(`clip-${i}.mp4`).catch(() => {});
    await ff.deleteFile(`muxed-${i}.mp4`).catch(() => {});
    await ff.deleteFile(`nar-${i}.mp3`).catch(() => {});
    await ff.deleteFile(`nar-${i}.wav`).catch(() => {});
  }
  await ff.deleteFile("concat.txt").catch(() => {});
  await ff.deleteFile("concat-out.mp4").catch(() => {});
  await ff.deleteFile("output.mp4").catch(() => {});

  return new Blob([output as BlobPart], { type: "video/mp4" });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
