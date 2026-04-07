import { getGeminiClient } from "./gemini";
import { Lyrics } from "@/types/project";

export interface SubtitleCue {
  id: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export async function generateAccurateSubtitlesFromAudio(
  audioBase64: string,
  audioMimeType: string,
  lyrics: Lyrics,
  audioDuration?: number
): Promise<{ subtitles: SubtitleCue[]; tokens: { input: number; output: number } }> {
  const ai = getGeminiClient();

  const prompt = `Listen to this song carefully and identify the start and end times for each of the main sections of the song.

Here is the structure of the song:
1. Verse 1: "${lyrics.verse1.join(' ')}"
2. Chorus: "${lyrics.chorus.join(' ')}"
3. Verse 2: "${lyrics.verse2.join(' ')}"
4. Outro: "${lyrics.outro.join(' ')}"

CRITICAL INSTRUCTIONS:
1. Listen for the exact start and end time of EACH of the 4 sections listed above.
2. Ignore long instrumental intros, solos, or background music after the singing ends.
3. If the singer repeats a section (like the Chorus) at the end, just include that extra time in the final section's end time.
4. Return a JSON array of exactly 4 objects, representing the 4 sections in order:
   - "id": 1, 2, 3, or 4
   - "section": "verse1", "chorus", "verse2", or "outro"
   - "startSeconds": a precise decimal number for when the singing of this section begins (e.g., 12.5)
   - "endSeconds": a precise decimal number for when the singing of this section ends (e.g., 45.2)
5. Ensure the timestamps match the audio exactly.
6. Output ONLY the JSON array.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      prompt,
      { inlineData: { mimeType: audioMimeType, data: audioBase64 } }
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.1,
    }
  });

  const parsed = JSON.parse(response.text ?? "[]") as Array<{id: number, section: string, startSeconds: number, endSeconds: number}>;
  if (!parsed || parsed.length === 0) {
    throw new Error("Failed to generate subtitles from audio");
  }

  // Calculate the proportional timing FOR EACH LINE within its respective section's timeframe.
  const finalCues: SubtitleCue[] = [];
  let cueId = 1;

  const sections = [
    { key: "verse1", lines: lyrics.verse1 },
    { key: "chorus", lines: lyrics.chorus },
    { key: "verse2", lines: lyrics.verse2 },
    { key: "outro", lines: lyrics.outro }
  ];

  for (const s of sections) {
    const timing = parsed.find(p => p.section === s.key);
    if (!timing) continue;

    const sectionDuration = timing.endSeconds - timing.startSeconds;
    const totalChars = s.lines.reduce((sum, line) => sum + line.length, 0);

    let currentTime = timing.startSeconds;
    for (const line of s.lines) {
      if (!line.trim()) continue;
      const lineDuration = (line.length / totalChars) * sectionDuration;
      const start = currentTime;
      const end = start + lineDuration;

      finalCues.push({
        id: cueId++,
        text: line,
        startSeconds: start,
        endSeconds: end
      });

      currentTime = end;
    }
  }

  // Clamp to audio duration if provided
  if (audioDuration && audioDuration > 0) {
    for (const cue of finalCues) {
      if (cue.endSeconds > audioDuration) cue.endSeconds = audioDuration;
      if (cue.startSeconds > audioDuration) cue.startSeconds = audioDuration;
    }
  }

  return {
    subtitles: finalCues,
    tokens: {
      input: response.usageMetadata?.promptTokenCount ?? 0,
      output: response.usageMetadata?.candidatesTokenCount ?? 0,
    }
  };
}
