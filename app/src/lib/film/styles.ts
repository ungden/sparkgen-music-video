import type { FilmStyleSlug } from "@/types/film";

export interface FilmStyleConfig {
  label: string;
  icon: string;
  color: string;
  scriptwriterPersona: string;
  scriptRules: string;
  sceneDirectorPersona: string;
  defaultVisualStyle: string;
  defaultImageStyle: string;
  videoAnimationStyle: string;
  narrationVoiceStyle: string;
  voiceName: string;
  backgroundMusicSpec: {
    genre: string;
    mood: string;
    tempo: string;
    instruments: string;
  };
}

export const DEFAULT_FILM_STYLE: FilmStyleSlug = "adventure";

export const FILM_STYLES: Record<FilmStyleSlug, FilmStyleConfig> = {
  adventure: {
    label: "Adventure",
    icon: "explore",
    color: "bg-emerald-100 text-emerald-700",
    scriptwriterPersona: "You are a master storyteller crafting thrilling adventure tales with brave heroes, exciting quests, and triumphant endings.",
    scriptRules: `RULES FOR ADVENTURE SCRIPTS:
1. Start with a compelling hook — drop the audience into action or mystery immediately.
2. Include a clear hero with a goal, an obstacle, and a resolution.
3. Use vivid, dynamic descriptions of environments (jungles, mountains, oceans, ruins).
4. Build tension through escalating challenges before the climax.
5. End with a satisfying resolution and a sense of wonder.
6. Keep narration energetic and pacing brisk — no slow moments.`,
    sceneDirectorPersona: "You are a visual director for animated adventure films, creating sweeping landscapes, dynamic action sequences, and epic reveals.",
    defaultVisualStyle: "vibrant adventure animation, epic landscapes, dynamic lighting, rich saturated colors, cinematic wide shots, Pixar/DreamWorks quality",
    defaultImageStyle: "animated adventure film still, epic cinematic composition, vibrant colors, dramatic lighting, detailed environments, high quality 3D animation style",
    videoAnimationStyle: "Dynamic cinematic animation with sweeping camera moves, dramatic reveals, energetic character movement, adventure film pacing.",
    narrationVoiceStyle: "Energetic, warm, and dramatic storyteller voice with varied pacing — building excitement during action, softening for emotional moments.",
    voiceName: "Puck",
    backgroundMusicSpec: {
      genre: "Orchestral adventure, cinematic score",
      mood: "Epic, exciting, triumphant, wonder-filled",
      tempo: "110-140 BPM",
      instruments: "Full orchestra with brass fanfares, sweeping strings, adventurous percussion, French horn melodies, timpani rolls",
    },
  },

  "fairy-tale": {
    label: "Fairy Tale",
    icon: "auto_awesome",
    color: "bg-pink-100 text-pink-700",
    scriptwriterPersona: "You are an enchanting fairy tale author weaving magical stories with whimsical characters, moral lessons, and happy endings.",
    scriptRules: `RULES FOR FAIRY TALE SCRIPTS:
1. Begin with "Once upon a time..." or a similar classic opening.
2. Feature magical elements — enchanted forests, talking animals, spells, wishes.
3. Include a clear moral or lesson woven naturally into the story.
4. Use gentle, poetic language with vivid imagery of magical worlds.
5. Create lovable characters with distinct personalities.
6. End with "...and they lived happily ever after" or a warm resolution.`,
    sceneDirectorPersona: "You are a fairy tale illustrator and animator creating dreamlike, enchanted worlds with soft magical lighting and whimsical charm.",
    defaultVisualStyle: "enchanted fairy tale animation, soft pastel colors, magical sparkles, dreamy atmosphere, storybook illustration quality, warm golden lighting",
    defaultImageStyle: "fairy tale illustration, enchanted magical world, soft dreamy colors, sparkle effects, whimsical characters, warm storybook atmosphere, high quality animation",
    videoAnimationStyle: "Gentle magical animation with floating particles, soft camera glides, dreamy transitions, fairy tale pacing with wonder-filled reveals.",
    narrationVoiceStyle: "Warm, gentle, soothing storyteller voice like a loving grandparent reading a bedtime story. Soft and magical.",
    voiceName: "Kore",
    backgroundMusicSpec: {
      genre: "Whimsical orchestral, music box, magical folk",
      mood: "Enchanting, gentle, magical, warm",
      tempo: "80-100 BPM",
      instruments: "Celesta, harp, gentle flute, soft strings, music box, light chimes, warm woodwinds",
    },
  },

  "sci-fi": {
    label: "Sci-Fi",
    icon: "rocket_launch",
    color: "bg-violet-100 text-violet-700",
    scriptwriterPersona: "You are a visionary sci-fi writer creating mind-bending stories about technology, space, artificial intelligence, and the future of humanity.",
    scriptRules: `RULES FOR SCI-FI SCRIPTS:
1. Ground the story in a plausible or thought-provoking technological concept.
2. Create a unique futuristic setting with specific, immersive details.
3. Explore a philosophical or ethical question through the narrative.
4. Use precise, evocative language for technology and environments.
5. Build suspense through discovery and revelation.
6. End with a twist, revelation, or moment of profound realization.`,
    sceneDirectorPersona: "You are a sci-fi visual director creating futuristic environments, sleek technology, and atmospheric space/cyber settings.",
    defaultVisualStyle: "cinematic sci-fi animation, futuristic environments, neon and holographic lighting, sleek technology, atmospheric space vistas, Blade Runner meets Pixar",
    defaultImageStyle: "sci-fi animated film still, futuristic city or space environment, neon lighting, holographic displays, sleek technology, atmospheric and cinematic",
    videoAnimationStyle: "Sleek futuristic cinematography with smooth tracking shots, holographic UI animations, atmospheric lighting shifts, sci-fi film pacing.",
    narrationVoiceStyle: "Calm, measured, slightly ominous narrator voice with intellectual depth. Think documentary meets thriller.",
    voiceName: "Charon",
    backgroundMusicSpec: {
      genre: "Ambient electronic, cinematic synth, space orchestral",
      mood: "Atmospheric, mysterious, awe-inspiring, tense",
      tempo: "90-120 BPM",
      instruments: "Deep synth pads, pulsing bass, ethereal textures, distant strings, electronic percussion, reverb-heavy piano, ambient drones",
    },
  },

  comedy: {
    label: "Comedy",
    icon: "sentiment_very_satisfied",
    color: "bg-yellow-100 text-yellow-700",
    scriptwriterPersona: "You are a comedy writer with impeccable timing, creating hilarious stories with witty dialogue, physical humor, and unexpected twists.",
    scriptRules: `RULES FOR COMEDY SCRIPTS:
1. Front-load laughs — hook the audience with humor in the first scene.
2. Use the rule of three — setup, expectation, subversion.
3. Create distinct, exaggerated characters with comedic flaws.
4. Include both verbal wit and visual/physical humor for animation.
5. Build running gags that pay off in the final scene.
6. End with a big laugh or a heartwarming comedic resolution.`,
    sceneDirectorPersona: "You are a comedy animation director known for exaggerated expressions, slapstick timing, and visually inventive gags.",
    defaultVisualStyle: "bright comedy animation, exaggerated expressions, bold colors, bouncy physics, Looney Tunes meets modern Pixar energy",
    defaultImageStyle: "comedy animation still, bright bold colors, exaggerated character expressions, dynamic funny poses, energetic composition, high quality cartoon style",
    videoAnimationStyle: "Snappy comedic animation with exaggerated movements, quick cuts for timing, bouncy character physics, comedic reaction shots.",
    narrationVoiceStyle: "Upbeat, playful, comedic narrator with great timing. Varies between deadpan and enthusiastic for maximum comedy.",
    voiceName: "Zephyr",
    backgroundMusicSpec: {
      genre: "Playful orchestral comedy, jazzy cartoon score",
      mood: "Funny, bouncy, mischievous, lighthearted",
      tempo: "120-140 BPM",
      instruments: "Bouncy pizzicato strings, comedic tuba, playful clarinet, xylophone, slide whistle effects, snappy percussion, jazzy piano",
    },
  },

  mystery: {
    label: "Mystery",
    icon: "search",
    color: "bg-slate-100 text-slate-700",
    scriptwriterPersona: "You are a mystery writer crafting suspenseful, clue-driven stories with twists, red herrings, and satisfying reveals.",
    scriptRules: `RULES FOR MYSTERY SCRIPTS:
1. Plant clues early that only make sense in retrospect.
2. Create an intriguing central mystery — what happened? who did it? where is it?
3. Build suspense through unanswered questions and ticking clocks.
4. Include at least one misdirection or red herring.
5. Use atmospheric descriptions — shadows, fog, locked rooms, hidden passages.
6. End with a satisfying reveal that recontextualizes earlier scenes.`,
    sceneDirectorPersona: "You are a mystery film director creating moody, atmospheric visuals with dramatic shadows, noir lighting, and tension-building compositions.",
    defaultVisualStyle: "moody mystery animation, dramatic chiaroscuro lighting, dark atmospheric tones with selective color, noir-inspired, fog and shadows",
    defaultImageStyle: "mystery animated film still, moody noir lighting, dramatic shadows, atmospheric fog, selective color accents, tension-filled composition, cinematic quality",
    videoAnimationStyle: "Slow, tension-building cinematography with creeping camera moves, dramatic shadow play, suspenseful pacing, mystery film atmosphere.",
    narrationVoiceStyle: "Low, measured, noir-detective narrator voice. Builds tension through pacing. Dramatic pauses before reveals.",
    voiceName: "Fenrir",
    backgroundMusicSpec: {
      genre: "Suspense orchestral, noir jazz, atmospheric tension",
      mood: "Mysterious, tense, atmospheric, suspenseful",
      tempo: "70-100 BPM",
      instruments: "Muted trumpet, tense strings, subtle bass clarinet, brushed drums, dark piano chords, atmospheric pads, occasional sharp staccato hits",
    },
  },

  documentary: {
    label: "Documentary",
    icon: "movie",
    color: "bg-blue-100 text-blue-700",
    scriptwriterPersona: "You are a documentary filmmaker crafting informative, engaging narratives that educate and inspire through compelling storytelling.",
    scriptRules: `RULES FOR DOCUMENTARY SCRIPTS:
1. Open with a striking fact, question, or visual that hooks the viewer.
2. Present information through narrative storytelling, not dry exposition.
3. Use specific data, examples, and details to support claims.
4. Build a clear narrative arc even when presenting factual content.
5. Include human elements — stories of individuals, emotional moments.
6. End with a call to action, reflection, or forward-looking statement.`,
    sceneDirectorPersona: "You are a nature/science documentary director creating stunning visuals with cinematic compositions, macro details, and sweeping establishing shots.",
    defaultVisualStyle: "cinematic documentary animation, photorealistic rendering, National Geographic quality, stunning detail, natural lighting, educational and awe-inspiring",
    defaultImageStyle: "documentary animation still, photorealistic quality, stunning natural or scientific subject, cinematic composition, educational visual, dramatic lighting",
    videoAnimationStyle: "Elegant documentary cinematography with slow panning shots, macro zoom-ins on details, time-lapse sequences, nature documentary pacing.",
    narrationVoiceStyle: "Authoritative yet warm narrator voice, like David Attenborough. Clear, measured, with genuine wonder and respect for the subject.",
    voiceName: "Orus",
    backgroundMusicSpec: {
      genre: "Cinematic ambient, nature documentary score, atmospheric orchestral",
      mood: "Awe-inspiring, contemplative, educational, majestic",
      tempo: "80-110 BPM",
      instruments: "Gentle piano, sweeping strings, ambient pads, subtle percussion, acoustic guitar, nature-inspired textures, warm brass",
    },
  },
};

export function getFilmStyle(slug?: string): FilmStyleConfig {
  if (slug && slug in FILM_STYLES) return FILM_STYLES[slug as FilmStyleSlug];
  return FILM_STYLES[DEFAULT_FILM_STYLE];
}

export function getFilmStyleList(): Array<{ slug: FilmStyleSlug } & FilmStyleConfig> {
  return (Object.entries(FILM_STYLES) as [FilmStyleSlug, FilmStyleConfig][]).map(
    ([slug, config]) => ({ slug, ...config })
  );
}
