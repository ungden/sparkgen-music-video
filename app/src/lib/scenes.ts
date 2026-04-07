import { Lyrics, Scene } from "@/types/project";

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

export function flattenLyrics(lyrics: Lyrics): string[] {
  return [lyrics.verse1, lyrics.chorus, lyrics.verse2, lyrics.outro]
    .flat()
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildProportionalSubtitles(lyrics: Lyrics, audioDuration: number) {
  const lines = flattenLyrics(lyrics);
  const totalChars = lines.reduce((sum, line) => sum + line.length, 0);

  // Reserve 10% for intro, 10% for outro
  const introDuration = audioDuration * 0.1;
  const vocalDuration = audioDuration * 0.8;

  let currentTime = introDuration;
  return lines.map((line, index) => {
    const lineDuration = (line.length / totalChars) * vocalDuration;
    const start = currentTime;
    const end = start + lineDuration;
    currentTime = end;
    return { id: index + 1, text: line, start, end };
  });
}

export function normalizeGeneratedScenes(
  rawScenes: Array<Record<string, string>>,
  lyrics: Lyrics,
  numScenes: number,
  audioDuration?: number,
  sceneDurationSeconds = 6,
): Scene[] {
  const lyricLines = flattenLyrics(lyrics);
  const totalDuration = audioDuration && audioDuration > 0 ? audioDuration : numScenes * sceneDurationSeconds;

  // Distribute time slices across scenes
  return Array.from({ length: numScenes }).map((_, index) => {
    const rawScene = rawScenes[index] || {};
    const start = (index / numScenes) * totalDuration;
    const end = ((index + 1) / numScenes) * totalDuration;

    // Distribute lyrics across scenes proportionally
    const linesPerScene = Math.max(1, Math.ceil(lyricLines.length / numScenes));
    const sceneLyrics = lyricLines.slice(index * linesPerScene, (index + 1) * linesPerScene).join("\n");

    return {
      id: index + 1,
      title: rawScene.title || `Scene ${index + 1}`,
      time: `${formatTime(start)} - ${formatTime(end)}`,
      lyrics: sceneLyrics || rawScene.lyrics || `Scene ${index + 1}`,
      description: rawScene.description || `A music video scene for scene ${index + 1}.`,
      status: "pending" as const,
    };
  });
}
