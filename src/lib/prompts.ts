export function buildIdeasPrompt(genre?: string): string {
  return `You are a creative children's song writer. Generate exactly 4 unique and fun song theme ideas for children aged 3-8.
${genre ? `Focus on the genre/topic: ${genre}` : "Be diverse and creative with themes."}

Return a JSON array with exactly 4 objects. Each object must have:
- "icon": a Google Material Symbols icon name (e.g., "rocket_launch", "pets", "castle", "music_note", "park", "water", "stars", "forest")
- "title": a short catchy title (2-3 words max)
- "desc": a one-line fun description (under 10 words)
- "color": pick one from ["bg-surface-container-low", "bg-secondary-container", "bg-tertiary-container", "bg-surface-container-highest"]
- "iconColor": pick matching from ["text-primary", "text-secondary", "text-tertiary", "text-on-surface-variant"]

Make each theme unique, imaginative, and appealing to young children. Use different colors for each.
Return ONLY the JSON array, no markdown.`;
}

export function buildLyricsPrompt(
  theme: string,
  customPrompt?: string
): string {
  const topic = customPrompt || theme;
  return `You are a talented children's song lyricist. Write fun, catchy, and age-appropriate song lyrics for children aged 3-8.

Theme/Topic: ${topic}

Requirements:
- Write exactly 4 sections: [Verse 1], [Chorus], [Verse 2], [Outro]
- Each section should have exactly 4 lines
- Use simple words that children can understand
- Make it rhyme and be fun to sing along
- Include actions, sounds, or movements kids can do
- Keep it positive, educational, or silly

Format your output exactly like this:
[Verse 1]
line 1
line 2
line 3
line 4

[Chorus]
line 1
line 2
line 3
line 4

[Verse 2]
line 1
line 2
line 3
line 4

[Outro]
line 1
line 2
line 3
line 4`;
}

export function buildScenesPrompt(
  lyricsText: string,
  theme: string,
  numScenes: number = 5
): string {
  return `You are a storyboard artist for children's music videos. Break this song into ${numScenes} visual scenes.

Theme: ${theme}
Lyrics:
${lyricsText}

For each scene, provide:
- "title": a creative scene name (2-3 words)
- "time": time range in format "MM:SS - MM:SS" (divide evenly across ~60 seconds total)
- "lyrics": the relevant lyrics excerpt for this scene (1-2 lines)
- "description": a detailed visual description (2-3 sentences) describing the scene composition, characters, colors, lighting, camera angle, and mood. This will be used as a prompt for image generation, so be very specific and visual.

Style guidelines for descriptions:
- Colorful, bright, child-friendly aesthetic
- 3D cartoon/Pixar-inspired style
- Magical and whimsical atmosphere
- 16:9 widescreen composition

Return a JSON array of exactly ${numScenes} scene objects. Return ONLY the JSON array, no markdown.`;
}

export function buildImagePrompt(
  description: string,
  style?: string
): string {
  const artStyle =
    style ||
    "colorful children's illustration, bright and cheerful, Pixar-inspired 3D cartoon style, high quality, detailed, magical atmosphere, child-friendly";
  return `Create an illustration in this style: ${artStyle}

Scene: ${description}

The image should be in 16:9 widescreen aspect ratio, vibrant colors, suitable for a children's music video.`;
}

export function buildVideoPrompt(sceneDescription: string): string {
  return `Gentle cinematic animation of this scene: ${sceneDescription}

Smooth camera movement, subtle character animation, magical particle effects. Children's music video style, bright and colorful.`;
}

export function buildMusicPrompt(
  lyricsText: string,
  theme?: string,
  genre?: string,
  mood?: string,
  tempo?: string
): string {
  return `Genre: ${genre || "Fun children's pop"}
Mood: ${mood || "Happy, playful, energetic, child-friendly"}
Tempo: ${tempo || "120 BPM"}
Key: C major
Instruments: Ukulele, xylophone, claps, soft drums, cheerful synths
Theme: ${theme || "Children's song"}

${lyricsText}

Make it catchy, fun, and singable for children aged 3-8. Bright and bouncy feel with clear vocals.`;
}
