import { Lyrics } from "@/types/project";

export function parseLyricsText(text: string): Lyrics | null {
  const sections: Record<string, string[]> = {};
  let currentSection = "";

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const match = trimmed.match(/^\[(.*?)\]$/);
    if (match) {
      currentSection = match[1].toLowerCase().replace(/\s+/g, "");
      sections[currentSection] = [];
    } else if (currentSection && trimmed && !/^\(.*\)$/.test(trimmed)) {
      sections[currentSection].push(trimmed);
    }
  }

  const verse1 = sections["verse1"] || [];
  const chorus = sections["chorus"] || [];
  const verse2 = sections["verse2"] || [];
  const outro = sections["outro"] || [];

  if (verse1.length === 0 && chorus.length === 0) return null;

  return { verse1, chorus, verse2, outro };
}
