"use client";

import { Lyrics } from "@/types/project";

export function parseLyrics(text: string): Lyrics | null {
  const sections: Record<string, string[]> = {};
  let currentSection = "";

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const match = trimmed.match(/^\[(.*?)\]$/);
    if (match) {
      currentSection = match[1].toLowerCase().replace(/\s+/g, "");
      sections[currentSection] = [];
    } else if (currentSection && trimmed) {
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

export default function StreamingText({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  const lines = text.split("\n");
  let currentSection = "";

  return (
    <div className="space-y-6 font-medium text-lg leading-relaxed text-on-surface">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        const sectionMatch = trimmed.match(/^\[(.*?)\]$/);
        if (sectionMatch) {
          currentSection = sectionMatch[1].toLowerCase();
          const isChorus = currentSection.includes("chorus");
          return (
            <p
              key={i}
              className={`text-xs font-black uppercase tracking-widest mt-6 mb-3 ${
                isChorus ? "text-primary" : "text-on-surface-variant opacity-50"
              }`}
            >
              [{sectionMatch[1]}]
            </p>
          );
        }

        const isChorus = currentSection.includes("chorus");
        if (isChorus) {
          return (
            <p key={i} className="text-xl font-bold text-primary-dim">
              {trimmed}
            </p>
          );
        }

        const isOutro = currentSection.includes("outro");
        if (isOutro) {
          return (
            <p key={i} className="italic text-on-surface-variant">
              {trimmed}
            </p>
          );
        }

        return <p key={i}>{trimmed}</p>;
      })}
      {isStreaming && (
        <span className="inline-block w-2 h-5 bg-primary animate-pulse rounded-sm" />
      )}
    </div>
  );
}
