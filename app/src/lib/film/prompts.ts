import { getFilmStyle } from "./styles";

export function buildStoryIdeasPrompt(topicHint?: string, filmStyleSlug?: string): string {
  const s = getFilmStyle(filmStyleSlug);
  return `${s.scriptwriterPersona}

Generate exactly 4 unique and creative short film story ideas.
${topicHint ? `Focus on the topic: ${topicHint}` : "Be diverse and creative with story concepts."}

Return a JSON array with exactly 4 objects. Each object must have:
- "icon": a Google Material Symbols icon name (e.g., "explore", "castle", "rocket_launch", "pets", "search", "auto_awesome")
- "title": a short catchy title (2-4 words max)
- "desc": a one-line logline/pitch (under 15 words)
- "color": pick one from ["bg-surface-container-low", "bg-secondary-container", "bg-tertiary-container", "bg-surface-container-highest"]
- "iconColor": pick matching from ["text-primary", "text-secondary", "text-tertiary", "text-on-surface-variant"]

Make each story unique, compelling, and suitable for a ${s.label} animated short film (1-2 minutes). Use different colors for each.
Return ONLY the JSON array, no markdown.`;
}

export function buildScriptPrompt(storyIdea: string, customPrompt?: string, filmStyleSlug?: string): string {
  const s = getFilmStyle(filmStyleSlug);
  const topic = customPrompt || storyIdea;

  return `${s.scriptwriterPersona}

Story concept: ${topic}

${s.scriptRules}

Write a complete short film script broken into 6-8 scenes. Each scene should have:
- A title (2-4 words)
- Narration text (what the narrator says — 2-3 sentences, clear and vivid)
- Visual description (what the viewer sees — 2-3 sentences, specific and animatable)
- Estimated duration in seconds (5-10 seconds per scene)

Return a JSON object:
{
  "synopsis": "A 1-2 sentence summary of the entire story",
  "scenes": [
    {
      "id": 1,
      "title": "Scene title",
      "narration": "The narrator says this...",
      "visualDescription": "We see a wide shot of...",
      "durationEstimate": 8
    }
  ]
}

Total duration should be 40-80 seconds. Make the narration natural and engaging for voice-over.
Return ONLY the JSON object, no markdown.`;
}

export function buildFilmScenesPrompt(scriptScenes: Array<{ title: string; narration: string; visualDescription: string }>, filmStyleSlug?: string): string {
  const s = getFilmStyle(filmStyleSlug);
  const scenesText = scriptScenes.map((sc, i) =>
    `Scene ${i + 1} - "${sc.title}": ${sc.visualDescription}`
  ).join("\n");

  return `${s.sceneDirectorPersona}

You are creating detailed visual descriptions for an animated short film. The visual style is: ${s.defaultVisualStyle}

Here are the scenes from the script:
${scenesText}

First, invent a UNIQUE main character or visual subject for this film. Make it memorable and fitting for the ${s.label} genre.
Second, define the UNIQUE visual art style: ${s.defaultVisualStyle}

For each scene, provide an enhanced visual description optimized for AI image generation. Include specific details about:
- Character pose, expression, and action
- Background environment and lighting
- Camera angle (wide, close-up, aerial, etc.)
- Color palette and atmosphere

Return a JSON object:
{
  "characterDescription": "1-2 sentences describing the main character",
  "visualStyle": "1-2 sentences about the art style",
  "scenes": [
    { "title": "...", "description": "Detailed visual description for image generation..." }
  ]
}
Return ONLY the JSON, no markdown.`;
}

export function buildFilmImagePrompt(description: string, style?: string, filmStyleSlug?: string): string {
  const s = getFilmStyle(filmStyleSlug);
  const artStyle = style || s.defaultImageStyle;
  return `Create an illustration in this style: ${artStyle}

Scene: ${description}

The image should be in 16:9 widescreen aspect ratio, high quality, suitable for an animated short film.`;
}

export function buildFilmVideoPrompt(sceneDescription: string, filmStyleSlug?: string): string {
  const s = getFilmStyle(filmStyleSlug);
  return `${s.videoAnimationStyle}

Scene: ${sceneDescription}`;
}

export function buildBackgroundMusicPrompt(synopsis: string, filmStyleSlug?: string): string {
  const s = getFilmStyle(filmStyleSlug);
  const spec = s.backgroundMusicSpec;

  return `Create an instrumental background score for an animated short film. NO VOCALS, NO SINGING, NO LYRICS — purely instrumental.

Film synopsis: ${synopsis}

Genre: ${spec.genre}
Mood: ${spec.mood}
Tempo: ${spec.tempo}
Instruments: ${spec.instruments}

CRITICAL: This is background music for a narrated film. It must:
- Be purely instrumental — absolutely no vocals or singing
- Stay soft enough to not overpower voice narration
- Support the emotional arc of the story
- Be approximately 1-2 minutes long
- Transition smoothly between moods as the story progresses`;
}
