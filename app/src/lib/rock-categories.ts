import type { RockCategorySlug } from "@/types/rock";

export interface RockCategoryConfig {
  slug: RockCategorySlug;
  label: string;
  description: string;
  icon: string;
  color: string;
  songwriterPersona: string;
  lyricsRules: string;
  defaultImageStyle: string;
  sceneDirectorPersona: string;
  musicSpec: {
    genre: string;
    mood: string;
    tempo: string;
    instruments: string;
    vocalStyle: string;
  };
  videoAnimationStyle: string;
}

const ROCK_CATEGORIES: Record<RockCategorySlug, RockCategoryConfig> = {
  "conquerors-kings": {
    slug: "conquerors-kings",
    label: "Conquerors & Kings",
    description: "Epic tales of rulers, generals, and empire builders who shaped the world",
    icon: "shield",
    color: "#8B0000",
    songwriterPersona: `You are a legendary power rock songwriter who writes epic anthems about conquerors and rulers. Your lyrics are monumental, visceral, and historically rich — like a battle hymn carved in stone.`,
    lyricsRules: `RULES:
1. Write in FIRST PERSON as the historical figure.
2. Use historically accurate details — battles, places, dates, enemies.
3. Imagery: blood, fire, steel, crowns, banners, armies, thunder.
4. Chorus MUST be anthemic — powerful enough to shout at a stadium.
5. No modern slang. Match vocabulary to the character's era.
6. Every line hits hard. No filler.`,
    defaultImageStyle: "Dark epic digital painting, semi-realistic animated style, ancient battlefield atmosphere, dramatic chiaroscuro lighting, cinematic composition, smoke and fire, weathered armor and banners, muted earth tones with blood-red and gold accents, Castlevania-level detail, 16:9 widescreen",
    sceneDirectorPersona: "Semi-realistic animated historical warrior/ruler, detailed period-accurate armor and clothing, intense battle-hardened expression, dramatic pose, graphic novel aesthetic with cinematic lighting",
    musicSpec: {
      genre: "Power rock, symphonic metal, epic rock",
      mood: "Triumphant, aggressive, monumental, warlike",
      tempo: "130-155 BPM",
      instruments: "Heavy distorted guitars, double bass drums, orchestral strings, war drums, brass stabs, choir harmonies",
      vocalStyle: "Powerful commanding rock vocals with operatic intensity. Gritty verses building to soaring anthemic choruses. Battle hymn energy.",
    },
    videoAnimationStyle: "Cinematic semi-realistic animation. Epic battlefield atmosphere, dramatic camera movements, smoke and sparks. Dark cinematic color grading with gold and crimson accents.",
  },

  "rebels-outlaws": {
    slug: "rebels-outlaws",
    label: "Rebels & Outlaws",
    description: "Anti-heroes, revolutionaries, pirates, and rule-breakers who defied the system",
    icon: "local_fire_department",
    color: "#FF4500",
    songwriterPersona: `You are a punk rock songwriter who writes raw, defiant anthems about rebels, outlaws, and revolutionaries. Your lyrics are urgent, angry, and unpolished — like graffiti on a prison wall.`,
    lyricsRules: `RULES:
1. Write in FIRST PERSON as the rebel/outlaw.
2. Raw, direct language. Short punchy lines.
3. Imagery: chains, fire, wanted posters, blood, freedom, escape.
4. Chorus is a battle cry — simple, repeatable, aggressive.
5. Capture the WHY of their rebellion — injustice, oppression, freedom.
6. End with defiance, not defeat.`,
    defaultImageStyle: "Gritty semi-realistic animated style, high contrast shadows, urban/wilderness outlaw aesthetic, moonlit scenes, wanted posters and broken chains, punk energy, desaturated palette with neon accents, graphic novel crosshatch textures, 16:9 widescreen",
    sceneDirectorPersona: "Semi-realistic animated rebel figure, rugged and defiant, leather and scars, intense eyes, dramatic backlighting, anti-hero energy, dark graphic novel aesthetic",
    musicSpec: {
      genre: "Punk rock, hard rock, garage rock, grunge",
      mood: "Defiant, raw, rebellious, anarchic, urgent",
      tempo: "140-170 BPM",
      instruments: "Raw distorted guitars, driving punk bass, aggressive snare, power chords, minimal production, shouted backing vocals",
      vocalStyle: "Raw snarling punk-rock delivery with urgency. Shouted choruses, spoken-word verses. Authentically aggressive.",
    },
    videoAnimationStyle: "Gritty semi-realistic animation. High contrast lighting, chaotic energy, fire and smoke. Punk rock visual rhythm with fast cuts.",
  },

  "visionaries-inventors": {
    slug: "visionaries-inventors",
    label: "Visionaries & Inventors",
    description: "Brilliant minds who changed the world through science, art, and genius",
    icon: "lightbulb",
    color: "#FFD700",
    songwriterPersona: `You are a progressive rock songwriter who writes intellectual, building anthems about visionaries and inventors. Your lyrics capture the obsession of genius — the eureka moments and the price of brilliance.`,
    lyricsRules: `RULES:
1. Write in FIRST PERSON as the inventor/visionary.
2. Include specific inventions, discoveries, or breakthroughs.
3. Imagery: lightning, blueprints, stars, machines, light vs darkness.
4. Build from quiet obsession to explosive breakthrough in structure.
5. Chorus captures the EUREKA moment — the world-changing insight.
6. Show both the brilliance and the isolation of genius.`,
    defaultImageStyle: "Semi-realistic animated style, dramatic laboratory/workshop lighting, Tesla coil electricity, blueprint overlays, steampunk-adjacent aesthetic, rich amber and electric blue palette, cinematic depth of field, 16:9 widescreen",
    sceneDirectorPersona: "Semi-realistic animated genius/inventor figure, intense focused expression, surrounded by inventions, dramatic lighting from experiments, period-appropriate clothing with creative flair",
    musicSpec: {
      genre: "Progressive rock, art rock, alternative rock",
      mood: "Visionary, intellectual, building intensity, eureka moments",
      tempo: "110-135 BPM with time signature changes",
      instruments: "Layered electric guitars, complex drum patterns, analog synthesizers, piano, cello, theremin-like synths",
      vocalStyle: "Articulate passionate rock vocals with dynamic range. Thoughtful verses with building intensity, soaring choruses capturing breakthrough moments.",
    },
    videoAnimationStyle: "Semi-realistic animation with steampunk touches. Dramatic lighting from experiments and machinery. Electric blue and amber color grading.",
  },

  "dark-legends": {
    slug: "dark-legends",
    label: "Dark Legends",
    description: "Mythology, dark folklore, cursed figures, and supernatural tales",
    icon: "skull",
    color: "#4B0082",
    songwriterPersona: `You are a gothic rock songwriter who writes haunting, theatrical songs about mythological beings and supernatural legends. Your lyrics drip with dark beauty — like a curse whispered in candlelight.`,
    lyricsRules: `RULES:
1. Write in FIRST PERSON as the mythological/supernatural figure.
2. Draw from actual mythology — Greek, Norse, Egyptian, Slavic, etc.
3. Imagery: darkness, fire, serpents, bones, ancient temples, blood, moonlight.
4. Chorus is theatrical and haunting — meant to echo in a cathedral.
5. Build atmosphere of dread and dark beauty.
6. End with ambiguity — is the monster the villain or the victim?`,
    defaultImageStyle: "Dark fantasy semi-realistic animation, gothic atmosphere, deep shadows and candlelight, ancient mythology aesthetic, mist and supernatural glow, dark jewel tones (deep purple, emerald, blood red), ornate architectural details, occult symbols, 16:9 widescreen",
    sceneDirectorPersona: "Semi-realistic animated mythological or supernatural figure, otherworldly presence, dramatic flowing garments, glowing eyes or aura, dark fantasy aesthetic, ancient and powerful, gothic graphic novel quality",
    musicSpec: {
      genre: "Gothic rock, doom metal, dark rock, symphonic metal",
      mood: "Haunting, ominous, mystical, dramatic, tragic",
      tempo: "90-120 BPM, slow and heavy",
      instruments: "Down-tuned guitars, pipe organ, deep cello, thunderous bass drums, Latin choir chanting, atmospheric synths, church bells",
      vocalStyle: "Deep haunting vocals with reverb. Whispered verses, powerful baritone choruses. Occasional clean-to-harsh transitions. Gothic and theatrical.",
    },
    videoAnimationStyle: "Dark fantasy animation. Gothic atmosphere with candlelight and mist. Supernatural glow effects. Deep purple and crimson color grading.",
  },

  "fallen-heroes": {
    slug: "fallen-heroes",
    label: "Fallen Heroes",
    description: "Original superhero-inspired characters — origin stories, battles, and sacrifices",
    icon: "bolt",
    color: "#0066FF",
    songwriterPersona: `You are an alternative rock songwriter who writes emotional, cinematic anthems about original superhero characters. Your lyrics capture the weight of power — the loneliness of being extraordinary in an ordinary world.`,
    lyricsRules: `RULES:
1. Write in FIRST PERSON as the original hero character.
2. Create ORIGINAL characters — do NOT use any existing copyrighted names.
3. Imagery: storms, shadows, city skylines, masks, scars, sacrifice.
4. Chorus is a declaration — who they are, what they stand for.
5. Show vulnerability beneath the power.
6. The hero must face a moral dilemma, not just punch villains.`,
    defaultImageStyle: "Semi-realistic animated superhero aesthetic, dramatic urban skyline at night, rooftop silhouettes, lightning and neon, comic book dynamic angles adapted to cinematic framing, deep blacks with vivid accent colors, rain-slicked streets, 16:9 widescreen",
    sceneDirectorPersona: "Semi-realistic animated original superhero figure, unique costume design (NOT copying any existing IP), dramatic pose, mask or distinctive features, cinematic comic book lighting, dark and mature tone",
    musicSpec: {
      genre: "Alternative rock, post-grunge, cinematic rock",
      mood: "Heroic but bittersweet, intense, determined, sacrificial",
      tempo: "120-140 BPM",
      instruments: "Heavy electric guitars with clean arpeggiated intros, powerful drums, orchestral swells, bass-heavy breakdowns, piano for emotional moments",
      vocalStyle: "Emotional soaring rock vocals. Quiet introspective verses erupting into massive choruses. Stadium rock meets film soundtrack. Vulnerable yet powerful.",
    },
    videoAnimationStyle: "Cinematic superhero animation. Urban nightscape, neon and lightning effects. Dynamic camera angles. Dark with vivid accent colors.",
  },

  "queens-seducers": {
    slug: "queens-seducers",
    label: "Queens & Seducers",
    description: "Powerful women, femme fatales, and legendary lovers who wielded influence",
    icon: "diamond",
    color: "#DC143C",
    songwriterPersona: `You are a melodic rock songwriter who writes powerful, dramatic songs about legendary women who wielded influence through beauty, wit, and iron will. Your lyrics are elegant yet dangerous — silk over steel.`,
    lyricsRules: `RULES:
1. Write in FIRST PERSON as the historical woman.
2. Use historically accurate details of their power and influence.
3. Imagery: crowns, poison, silk, daggers, thrones, mirrors, fire.
4. Chorus is seductive and powerful — a declaration of dominance.
5. Show intelligence and strategy, NOT just beauty.
6. These are rulers and strategists, not objects. Dignified and fierce.`,
    defaultImageStyle: "Semi-realistic animated style, opulent palace interiors, rich fabrics and gold, dramatic theatrical lighting, jewel-tone palette (ruby, sapphire, emerald, amethyst), candlelit chambers, powerful feminine energy, Renaissance painting meets graphic novel, 16:9 widescreen",
    sceneDirectorPersona: "Semi-realistic animated powerful woman, regal bearing, elaborate period-appropriate attire, commanding presence, intelligent gaze, ornate jewelry, dramatic lighting, powerful and dignified",
    musicSpec: {
      genre: "Melodic rock, blues rock, dark cabaret rock",
      mood: "Seductive, powerful, dangerous, intoxicating, tragic",
      tempo: "95-120 BPM",
      instruments: "Bluesy electric guitar, sultry bass lines, brushed drums, string quartet, harpsichord accents, dramatic piano, tambourine",
      vocalStyle: "Rich sultry rock vocals with power. Smooth and seductive in verses, commanding and explosive in choruses. Dramatic storytelling with feminine power.",
    },
    videoAnimationStyle: "Elegant semi-realistic animation. Candlelit palace atmosphere. Rich jewel-tone color grading. Dramatic theatrical composition.",
  },

  "doomsday-prophecy": {
    slug: "doomsday-prophecy",
    label: "Doomsday & Prophecy",
    description: "Apocalyptic visions, dystopian futures, and end-of-world scenarios",
    icon: "whatshot",
    color: "#FF6600",
    songwriterPersona: `You are an industrial rock songwriter who writes apocalyptic, prophetic anthems about the end of worlds. Your lyrics are warnings carved in ash — desperate broadcasts from the edge of oblivion.`,
    lyricsRules: `RULES:
1. Write in FIRST PERSON as a witness, prophet, or survivor.
2. Draw from real events (Pompeii, Black Death) or original dystopian scenarios.
3. Imagery: ash, fire, cracked earth, empty cities, sirens, last breaths.
4. Chorus is a warning or a desperate plea — prophetic and massive.
5. Build from ominous calm to total devastation.
6. End with either defiant hope or haunting silence.`,
    defaultImageStyle: "Semi-realistic animated post-apocalyptic aesthetic, burning cities, cracked earth, nuclear skies in orange and ash grey, ruins of civilization, dramatic storm clouds, survivors silhouetted against flames, Mad Max meets Blade Runner, 16:9 widescreen",
    sceneDirectorPersona: "Semi-realistic animated post-apocalyptic survivor or prophet figure, weathered and battle-scarred, improvised armor or flowing robes, standing in ruins, dramatic apocalyptic sky, intense determined expression",
    musicSpec: {
      genre: "Industrial rock, nu-metal, post-apocalyptic rock, stoner metal",
      mood: "Apocalyptic, ominous, massive, despairing yet defiant",
      tempo: "100-130 BPM, heavy and crushing",
      instruments: "Heavily distorted down-tuned guitars, industrial synths, massive drum patterns, bass drops, air raid sirens, feedback, explosion samples",
      vocalStyle: "Intense prophetic vocals alternating between desperate screams and spoken-word passages. Whispered prophecy contrasting with screamed warnings.",
    },
    videoAnimationStyle: "Post-apocalyptic animation. Burning landscapes, ash and storm. Orange and grey devastation palette. Cinematic wide shots of ruins.",
  },
};

export function getRockCategory(slug?: string): RockCategoryConfig {
  if (slug && slug in ROCK_CATEGORIES) {
    return ROCK_CATEGORIES[slug as RockCategorySlug];
  }
  return ROCK_CATEGORIES["conquerors-kings"];
}

export function getAllRockCategories(): RockCategoryConfig[] {
  return Object.values(ROCK_CATEGORIES);
}

export const ROCK_CATEGORY_SLUGS = Object.keys(ROCK_CATEGORIES) as RockCategorySlug[];
