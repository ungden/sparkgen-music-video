import { getGenre } from "./genres";

export function buildIdeasPrompt(topicHint?: string, genreSlug?: string): string {
  const g = getGenre(genreSlug);
  return `${g.songwriterPersona}

Generate exactly 4 unique and creative song theme ideas.
${topicHint ? `Focus on the topic: ${topicHint}` : "Be diverse and creative with themes."}

Return a JSON array with exactly 4 objects. Each object must have:
- "icon": a Google Material Symbols icon name (e.g., "rocket_launch", "pets", "castle", "music_note", "park", "water", "stars", "forest", "mic", "electric_bolt", "nightlife", "favorite")
- "title": a short catchy title (2-3 words max)
- "desc": a one-line fun description (under 10 words)
- "color": pick one from ["bg-surface-container-low", "bg-secondary-container", "bg-tertiary-container", "bg-surface-container-highest"]
- "iconColor": pick matching from ["text-primary", "text-secondary", "text-tertiary", "text-on-surface-variant"]

Make each theme unique, imaginative, and appropriate for the ${g.label} genre. Use different colors for each.
Return ONLY the JSON array, no markdown.`;
}

export function buildLyricsPrompt(
  theme: string,
  customPrompt?: string,
  genreSlug?: string
): string {
  const g = getGenre(genreSlug);
  const topic = customPrompt || theme;
  const lines = g.linesPerSection;

  return `${g.songwriterPersona}

Theme/Topic: ${topic}

${g.lyricsRules}

Format your output exactly like this, using exactly ${lines} lines per section:
[Verse 1]
${Array.from({ length: lines }, (_, i) => `line ${i + 1}`).join("\n")}

[Chorus]
${Array.from({ length: lines }, (_, i) => `line ${i + 1}`).join("\n")}

[Verse 2]
${Array.from({ length: lines }, (_, i) => `line ${i + 1}`).join("\n")}

[Outro]
${Array.from({ length: lines }, (_, i) => `line ${i + 1}`).join("\n")}

Do not include any notes, commentary, stage directions, or parenthetical instruction lines. Output lyrics only.`;
}

export function buildScenesPrompt(
  lyricsText: string,
  theme: string,
  numScenes: number = 8,
  genreSlug?: string
): string {
  const g = getGenre(genreSlug);
  return `${g.sceneDirectorPersona}

Break this song into ${numScenes} visual scenes.

Theme: ${theme}
Lyrics:
${lyricsText}

First, invent a UNIQUE, imaginative main character or visual subject specifically for this song. Make it memorable and fitting for the ${g.label} genre.
Second, define a UNIQUE visual art style that matches this genre: ${g.defaultVisualStyle}

For each scene, provide:
- "title": a creative scene name
- "time": time range in format "MM:SS - MM:SS" (divide evenly across ~${numScenes * 6} seconds total, about 6 seconds per scene)
- "lyrics": the relevant lyrics excerpt for this scene (2-3 lines)
- "description": a detailed visual description of what happens in the scene.

CRITICAL: EACH scene MUST have a distinctly different background, camera angle (wide, close-up, over-the-shoulder), and subject action. DO NOT repeat the same composition.

Return a JSON object EXACTLY matching this structure:
{
  "characterDescription": "string (1-2 sentences detailing the main character/subject)",
  "visualStyle": "string (1-2 sentences detailing the art style and colors)",
  "scenes": [
    { "title": "...", "time": "...", "lyrics": "...", "description": "..." }
  ]
}
Return ONLY the JSON object, no markdown, no other text.`;
}

export function buildImagePrompt(
  description: string,
  style?: string,
  genreSlug?: string
): string {
  const g = getGenre(genreSlug);
  const artStyle = style || g.defaultImageStyle;
  return `Create an illustration in this style: ${artStyle}

Scene: ${description}

The image should be in 16:9 widescreen aspect ratio, vibrant and high quality, suitable for a music video.`;
}

export function buildVideoPrompt(sceneDescription: string, genreSlug?: string): string {
  const g = getGenre(genreSlug);
  return `${g.videoAnimationStyle}

Scene: ${sceneDescription}`;
}

export function buildMusicPrompt(
  lyricsText: string,
  theme?: string,
  genre?: string,
  mood?: string,
  tempo?: string,
  instruments?: string,
  genreSlug?: string
): string {
  const g = getGenre(genreSlug);
  const spec = g.musicSpec;

  return `Create a full-length song track with vocals.

Genre: ${genre || spec.genre}
Mood: ${mood || spec.mood}
Tempo: ${tempo || spec.tempo}
Key: Choose an appropriate key for this genre
Instruments: ${instruments || spec.instruments}
Theme: ${theme || `${g.label} song`}

VOCAL INSTRUCTIONS:
${spec.vocalStyle}

LYRICS:
${lyricsText}

Make the chorus the emotional and melodic peak. This should be a full song spanning around 1.5 to 2 minutes.`;
}

// --- Catalogue helpers (used by automation pipeline) ---

export function getCatalogueVisualStyle(genreSlug?: string): string {
  const g = getGenre(genreSlug);
  return g.defaultImageStyle;
}

export function getCatalogueCharacterPreset(genreSlug?: string): string {
  return getGenre(genreSlug).sceneDirectorPersona;
}

export function getCatalogueMusicSpec(genreSlug?: string): {
  genre: string;
  mood: string;
  tempo: string;
  instruments: string;
} {
  const spec = getGenre(genreSlug).musicSpec;
  return {
    genre: spec.genre,
    mood: spec.mood,
    tempo: spec.tempo,
    instruments: spec.instruments,
  };
}
