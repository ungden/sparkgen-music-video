export type GenreSlug =
  | "kids"
  | "pop"
  | "rock"
  | "hip-hop"
  | "electronic"
  | "rnb"
  | "country"
  | "jazz"
  | "classical"
  | "latin"
  | "indie";

export const DEFAULT_GENRE: GenreSlug = "kids";

export interface GenreConfig {
  label: string;
  icon: string;
  color: string;
  songwriterPersona: string;
  lyricsRules: string;
  linesPerSection: number;
  sceneDirectorPersona: string;
  defaultVisualStyle: string;
  characterPreset: string;
  defaultImageStyle: string;
  videoAnimationStyle: string;
  musicSpec: {
    genre: string;
    mood: string;
    tempo: string;
    instruments: string;
    vocalStyle: string;
  };
}

export const GENRES: Record<GenreSlug, GenreConfig> = {
  kids: {
    label: "Kids",
    icon: "child_care",
    color: "bg-amber-100 text-amber-700",
    songwriterPersona:
      "You are a world-class children's songwriter and lyricist, creating fun, catchy, and highly memorable songs for children aged 3-8.",
    lyricsRules: `CRITICAL RULES FOR CHILDREN'S MUSIC:
1. Make it incredibly catchy with a strong, predictable rhythmic meter (e.g., AABB or ABAB rhyme scheme).
2. Use onomatopoeia (animal sounds, "zoom", "whoosh", "pop", "splat") to make it fun to sing out loud.
3. Include specific physical actions in the lyrics (e.g., "stomp your feet", "reach for the sky", "wiggle your toes") to encourage interactive playtime.
4. Avoid generic, overused nursery rhyme clichés (like "twinkle twinkle"). Be original and creative!
5. Use highly descriptive, sensory language (colors, shapes, feelings) that young children can easily visualize.
6. Keep words simple, phonetically pleasing, and easy to pronounce for toddlers.`,
    linesPerSection: 6,
    sceneDirectorPersona:
      "You are a creative director and storyboard artist for children's music videos, specializing in magical, colorful worlds that captivate young audiences.",
    defaultVisualStyle:
      "colorful children's illustration, bright cheerful atmosphere, Pixar-inspired 3D cartoon world, magical and child-friendly",
    characterPreset:
      "cute iconic children's animation hero with expressive eyes and a memorable silhouette",
    defaultImageStyle:
      "colorful children's illustration, bright and cheerful, Pixar-inspired 3D cartoon style, high quality, detailed, magical atmosphere, child-friendly",
    videoAnimationStyle:
      "Gentle cinematic animation. Smooth camera movement, subtle character animation, magical particle effects. Children's music video style, bright and colorful.",
    musicSpec: {
      genre: "Modern upbeat children's pop, Pixar-style cinematic pop, or catchy folk-pop",
      mood: "Joyful, bouncy, energetic, highly engaging, and silly",
      tempo: "110-130 BPM (upbeat and danceable)",
      instruments:
        "Bright acoustic guitar, playful glockenspiel/xylophone, warm bouncy bass, crisp handclaps, light upbeat drums, and whimsical synth sprinkles",
      vocalStyle:
        "Warm, clear, expressive, and enthusiastically friendly voice (like a beloved cartoon character or preschool teacher). Perfect diction so toddlers can learn the words. Add occasional fun vocal ad-libs (giggles, 'yay!', 'woohoo!') if appropriate.",
    },
  },

  pop: {
    label: "Pop",
    icon: "music_note",
    color: "bg-pink-100 text-pink-700",
    songwriterPersona:
      "You are a top-tier pop songwriter, known for crafting radio-ready hits with infectious hooks, memorable melodies, and universal appeal.",
    lyricsRules: `RULES FOR POP SONGWRITING:
1. Write an irresistible, sing-along hook in the chorus — this is the centerpiece.
2. Use conversational, relatable language that connects emotionally.
3. Structure verses to build tension toward the chorus payoff.
4. Include a pre-chorus or bridge for dynamic variety.
5. Keep lyrics contemporary and universally appealing.
6. Balance specificity with relatability — personal but not niche.`,
    linesPerSection: 4,
    sceneDirectorPersona:
      "You are a music video director known for sleek, visually stunning pop videos with high production value, dynamic choreography, and cinematic storytelling.",
    defaultVisualStyle:
      "sleek modern pop aesthetic, vibrant neon lighting, clean compositions, dynamic camera work, fashion-forward styling, glossy production value",
    characterPreset:
      "stylish contemporary performer with expressive movement, modern fashion, confident stage presence",
    defaultImageStyle:
      "modern pop music video aesthetic, vibrant colors, cinematic lighting, high fashion, glossy and polished, professional production quality",
    videoAnimationStyle:
      "Dynamic cinematic movement with dramatic lighting shifts, smooth dolly and crane shots, energetic cuts synced to beat, pop music video production quality.",
    musicSpec: {
      genre: "Modern pop, synth-pop, dance-pop",
      mood: "Upbeat, catchy, confident, feel-good",
      tempo: "110-128 BPM",
      instruments:
        "Punchy synth bass, crisp snare, shimmering synth pads, bright electric piano, layered vocal harmonies, rhythmic acoustic guitar",
      vocalStyle:
        "Clear, polished, emotionally expressive pop vocals with strong melodic hooks. Confident delivery with dynamic range from intimate verses to powerful choruses.",
    },
  },

  rock: {
    label: "Rock",
    icon: "electric_bolt",
    color: "bg-red-100 text-red-700",
    songwriterPersona:
      "You are a legendary rock songwriter, channeling raw energy, powerful riffs, and anthemic choruses that make crowds roar.",
    lyricsRules: `RULES FOR ROCK SONGWRITING:
1. Write with raw emotion and conviction — rock is about authenticity.
2. Build to explosive, anthemic choruses that demand to be shouted along.
3. Use vivid, visceral imagery — fire, thunder, roads, freedom, rebellion.
4. Verses should tell a story or paint a scene with gritty detail.
5. Include dynamic contrast — quiet verses erupting into loud choruses.
6. Keep it punchy and direct — no filler words.`,
    linesPerSection: 4,
    sceneDirectorPersona:
      "You are a rock music video director known for high-energy performances, dramatic lighting, gritty aesthetics, and raw emotional intensity.",
    defaultVisualStyle:
      "gritty rock aesthetic, high contrast lighting, dark moody tones with bursts of fire/neon, raw and authentic, concert energy",
    characterPreset:
      "edgy rock performer with leather jacket energy, intense expression, guitar-wielding stage presence",
    defaultImageStyle:
      "rock music video aesthetic, dramatic high-contrast lighting, dark tones with vivid accents, gritty textures, raw energy, concert atmosphere",
    videoAnimationStyle:
      "High-energy cinematic with rapid cuts, dramatic lighting, smoke and lens flares, handheld camera feel, intense performance energy.",
    musicSpec: {
      genre: "Rock, alternative rock, indie rock",
      mood: "Powerful, raw, energetic, anthemic",
      tempo: "120-145 BPM",
      instruments:
        "Distorted electric guitars, driving bass guitar, powerful drums with heavy kick and snare, occasional piano or organ, raw vocal harmonies",
      vocalStyle:
        "Powerful, raw, emotionally charged rock vocals. Gritty and authentic with dynamic range — restrained verses building to belted, soaring choruses.",
    },
  },

  "hip-hop": {
    label: "Hip-Hop",
    icon: "mic",
    color: "bg-purple-100 text-purple-700",
    songwriterPersona:
      "You are a masterful hip-hop lyricist with razor-sharp wordplay, intricate flow patterns, and storytelling that hits hard.",
    lyricsRules: `RULES FOR HIP-HOP SONGWRITING:
1. Prioritize flow and rhythm — every syllable should land on the beat.
2. Use internal rhymes, multi-syllabic rhyme schemes, and clever wordplay.
3. Tell vivid stories or paint pictures with sharp, specific details.
4. Include punchlines that hit — moments of surprise or cleverness.
5. Vary the cadence — speed up, slow down, create rhythmic tension.
6. Chorus/hook should be memorable, simple, and chantable.`,
    linesPerSection: 8,
    sceneDirectorPersona:
      "You are a hip-hop music video director known for urban aesthetics, stylish visuals, creative camera angles, and street-level authenticity.",
    defaultVisualStyle:
      "urban hip-hop aesthetic, street art influences, neon lights against dark city backdrops, stylish fashion, graffiti textures, cinematic wide angles",
    characterPreset:
      "confident hip-hop artist with streetwear style, expressive gestures, commanding presence",
    defaultImageStyle:
      "hip-hop music video aesthetic, urban environment, neon-lit streets, graffiti art, dark atmosphere with vivid color accents, street fashion, cinematic",
    videoAnimationStyle:
      "Stylish urban cinematography with low-angle shots, slow-motion sequences, smooth tracking shots through city environments, dramatic lighting contrasts.",
    musicSpec: {
      genre: "Hip-hop, trap, boom bap, lo-fi hip-hop",
      mood: "Confident, hard-hitting, smooth, street-smart",
      tempo: "85-100 BPM (half-time feel) or 140-160 BPM (trap)",
      instruments:
        "808 bass, hi-hat rolls, snappy snares, atmospheric pads, sampled loops, piano chops, vocal ad-libs",
      vocalStyle:
        "Rhythmic, confident rap delivery with sharp enunciation. Varied flow patterns with emphasis on wordplay. Melodic hook on chorus with layered ad-libs.",
    },
  },

  electronic: {
    label: "Electronic",
    icon: "equalizer",
    color: "bg-cyan-100 text-cyan-700",
    songwriterPersona:
      "You are an electronic music producer-songwriter, crafting hypnotic, danceable tracks with euphoric builds, drops, and atmospheric textures.",
    lyricsRules: `RULES FOR ELECTRONIC SONGWRITING:
1. Lyrics should be atmospheric and evocative — paint sonic landscapes.
2. Keep verses minimal and hypnotic — repetition is a tool, not a weakness.
3. Chorus should be euphoric and uplifting — the emotional peak.
4. Use imagery of light, movement, energy, space, and transformation.
5. Short, punchy phrases work better than long prose.
6. Include moments designed for vocal chops and effects processing.`,
    linesPerSection: 4,
    sceneDirectorPersona:
      "You are a visual artist directing electronic music videos with futuristic aesthetics, geometric patterns, light shows, and immersive digital worlds.",
    defaultVisualStyle:
      "futuristic electronic aesthetic, geometric patterns, neon glow, digital landscapes, laser-like lighting, cyberpunk influences, immersive and hypnotic",
    characterPreset:
      "futuristic figure in luminescent outfit, geometric face paint, moving through digital landscapes",
    defaultImageStyle:
      "electronic music aesthetic, futuristic, neon-lit geometric environments, cyberpunk influence, laser lighting, digital art, immersive atmosphere",
    videoAnimationStyle:
      "Hypnotic motion graphics, pulsing lights synced to beat, smooth camera orbits through geometric landscapes, futuristic particle effects, immersive 3D environments.",
    musicSpec: {
      genre: "Electronic, house, future bass, synthwave, EDM",
      mood: "Euphoric, hypnotic, energetic, atmospheric",
      tempo: "120-130 BPM (house) or 140-150 BPM (DnB/future bass)",
      instruments:
        "Layered synths, arpeggiated sequences, deep sub-bass, four-on-the-floor kick, crisp hi-hats, atmospheric pads, vocal chops, risers and impacts",
      vocalStyle:
        "Ethereal, processed vocals with reverb and delay. Breathy and atmospheric in verses, soaring and euphoric in chorus. Suitable for vocal chops and effects.",
    },
  },

  rnb: {
    label: "R&B / Soul",
    icon: "favorite",
    color: "bg-rose-100 text-rose-700",
    songwriterPersona:
      "You are a soulful R&B songwriter, weaving smooth melodies, heartfelt emotion, and groove-driven rhythms into timeless love songs.",
    lyricsRules: `RULES FOR R&B SONGWRITING:
1. Write from deep emotion — vulnerability and honesty are essential.
2. Use sensual, intimate language that creates closeness.
3. Melodies should be smooth and singable with room for vocal runs.
4. Include metaphors for love, desire, heartbreak, and connection.
5. Build emotional intensity gradually across sections.
6. Leave space for vocal improvisation and ad-libs.`,
    linesPerSection: 4,
    sceneDirectorPersona:
      "You are an R&B music video director known for intimate, mood-lit visuals, smooth choreography, and emotionally charged storytelling.",
    defaultVisualStyle:
      "intimate R&B aesthetic, warm golden lighting, soft shadows, luxurious textures, mood-lit environments, romantic and sensual atmosphere",
    characterPreset:
      "stylish R&B artist with smooth movement, elegant fashion, emotionally expressive performance",
    defaultImageStyle:
      "R&B music video aesthetic, warm golden hour lighting, intimate mood, luxurious settings, soft focus, romantic atmosphere, high fashion",
    videoAnimationStyle:
      "Smooth, sensual cinematography with slow dolly moves, intimate close-ups, warm color grading, soft lighting transitions, elegant movement.",
    musicSpec: {
      genre: "R&B, neo-soul, contemporary R&B",
      mood: "Smooth, sensual, emotional, groovy",
      tempo: "80-100 BPM",
      instruments:
        "Smooth electric piano (Rhodes/Wurlitzer), warm bass guitar, crisp snare with ghost notes, lush string pads, subtle guitar licks, finger snaps",
      vocalStyle:
        "Smooth, soulful vocals with rich tone and emotional depth. Intimate delivery in verses with melismatic runs and ad-libs. Falsetto transitions and layered harmonies.",
    },
  },

  country: {
    label: "Country",
    icon: "landscape",
    color: "bg-yellow-100 text-yellow-700",
    songwriterPersona:
      "You are a Nashville-caliber country songwriter, telling authentic stories with heart, wit, and melodies that feel like home.",
    lyricsRules: `RULES FOR COUNTRY SONGWRITING:
1. Tell a story — country thrives on narrative and vivid characters.
2. Use concrete, specific details — truck brands, town names, weather, seasons.
3. Write with genuine emotion — heartbreak, joy, nostalgia, pride.
4. Include a twist or payoff in the final chorus or bridge.
5. Balance sincerity with clever wordplay and double meanings.
6. Make it singable around a campfire — acoustic-friendly melodies.`,
    linesPerSection: 4,
    sceneDirectorPersona:
      "You are a country music video director capturing wide-open landscapes, small-town charm, golden-hour beauty, and heartfelt storytelling.",
    defaultVisualStyle:
      "warm country aesthetic, golden-hour lighting, wide-open landscapes, rustic textures, small-town charm, authentic and heartfelt atmosphere",
    characterPreset:
      "authentic country artist with boots and denim, genuine smile, storyteller energy, outdoor setting",
    defaultImageStyle:
      "country music aesthetic, golden sunset lighting, wide landscapes, rustic barn textures, pickup trucks, open fields, warm and authentic atmosphere",
    videoAnimationStyle:
      "Cinematic wide shots of landscapes, warm golden-hour lighting, slow tracking shots, intimate close-ups of storytelling moments, natural and authentic feel.",
    musicSpec: {
      genre: "Country, country-pop, Americana, folk-country",
      mood: "Heartfelt, nostalgic, warm, storytelling",
      tempo: "100-120 BPM",
      instruments:
        "Acoustic guitar (fingerpicking and strumming), pedal steel guitar, fiddle, upright bass, brushed drums, banjo, harmonica",
      vocalStyle:
        "Warm, storytelling vocals with slight twang and genuine emotion. Clear diction for narrative clarity. Harmonies on choruses, occasional spoken-word bridge.",
    },
  },

  jazz: {
    label: "Jazz",
    icon: "piano",
    color: "bg-indigo-100 text-indigo-700",
    songwriterPersona:
      "You are a sophisticated jazz composer-lyricist, blending complex harmonies, witty wordplay, and swinging grooves into timeless standards.",
    lyricsRules: `RULES FOR JAZZ SONGWRITING:
1. Write with sophistication and wit — clever wordplay and double entendres.
2. Use rich vocabulary and poetic imagery — moonlight, smoke, velvet, shadows.
3. Structure should allow for musical improvisation and variation.
4. Include internal rhymes and flowing, conversational phrasing.
5. Evoke atmosphere — late-night clubs, city rain, intimate conversation.
6. Balance complexity with accessibility — smart but not pretentious.`,
    linesPerSection: 4,
    sceneDirectorPersona:
      "You are a jazz music video director creating smoky club atmospheres, noir-inspired visuals, sophisticated urban nightlife, and intimate musical moments.",
    defaultVisualStyle:
      "smoky jazz club aesthetic, noir-inspired lighting, warm amber tones, sophisticated urban nightlife, intimate atmosphere, vintage elegance",
    characterPreset:
      "sophisticated jazz musician in elegant attire, lost in the music, intimate club setting, spotlight",
    defaultImageStyle:
      "jazz music aesthetic, smoky club atmosphere, warm amber lighting, noir-inspired shadows, sophisticated elegance, vintage microphone, intimate setting",
    videoAnimationStyle:
      "Smooth, atmospheric cinematography with warm tones, slow push-ins on performers, smoky atmosphere, intimate club lighting, elegant camera movement.",
    musicSpec: {
      genre: "Jazz, vocal jazz, smooth jazz, bebop",
      mood: "Sophisticated, smooth, intimate, swinging",
      tempo: "100-140 BPM (swing feel)",
      instruments:
        "Grand piano, upright bass (walking bass lines), brushed drums, tenor saxophone, trumpet with mute, vibraphone, subtle guitar comping",
      vocalStyle:
        "Smooth, sophisticated jazz vocals with impeccable phrasing and timing. Conversational delivery with subtle swing. Scatting sections welcome. Rich, warm tone.",
    },
  },

  classical: {
    label: "Classical",
    icon: "symphony",
    color: "bg-slate-100 text-slate-700",
    songwriterPersona:
      "You are a contemporary classical composer creating art songs that blend orchestral grandeur with accessible, emotional vocal writing.",
    lyricsRules: `RULES FOR CLASSICAL/ART SONG WRITING:
1. Write with poetic elegance — elevated language that rewards close listening.
2. Use rich metaphor and symbolism — nature, time, memory, transcendence.
3. Structure should serve the emotional arc, not just repeat patterns.
4. Allow for dynamic extremes — whispered pianissimo to soaring fortissimo.
5. Each word should feel intentional and weighted with meaning.
6. Consider how vowels and consonants feel when sung at length.`,
    linesPerSection: 4,
    sceneDirectorPersona:
      "You are a visionary director creating cinematic visual poems — sweeping landscapes, architectural beauty, and grand emotional narratives.",
    defaultVisualStyle:
      "grand cinematic aesthetic, sweeping landscapes, architectural grandeur, dramatic chiaroscuro lighting, oil painting textures, timeless elegance",
    characterPreset:
      "ethereal figure in flowing garments, set against grand architecture or sweeping natural landscapes",
    defaultImageStyle:
      "classical art aesthetic, oil painting quality, dramatic chiaroscuro lighting, grand architecture, sweeping landscapes, timeless beauty, museum quality",
    videoAnimationStyle:
      "Grand sweeping camera movements, slow and majestic pacing, dramatic lighting shifts, time-lapse nature sequences, architectural reveals.",
    musicSpec: {
      genre: "Contemporary classical, art song, cinematic orchestral",
      mood: "Grand, emotional, transcendent, majestic",
      tempo: "60-100 BPM (varies with dynamics)",
      instruments:
        "Full string section, grand piano, French horn, oboe, flute, harp, timpani, choir harmonies, celesta",
      vocalStyle:
        "Trained, classically-influenced vocals with wide dynamic range. Pure tone with controlled vibrato. Soaring high notes and intimate low passages. Operatic power when needed.",
    },
  },

  latin: {
    label: "Latin",
    icon: "nightlife",
    color: "bg-orange-100 text-orange-700",
    songwriterPersona:
      "You are a Latin music hitmaker, blending reggaeton rhythms, tropical beats, and passionate melodies that ignite the dancefloor.",
    lyricsRules: `RULES FOR LATIN SONGWRITING:
1. Write with passion and fire — Latin music is about feeling deeply.
2. Use rhythmic, danceable phrasing that locks into the beat.
3. Include bilingual elements if natural (Spanish/English flow).
4. Themes of love, desire, dancing, celebration, and heartbreak.
5. Chorus should be an instant earworm — simple, repetitive, irresistible.
6. Include ad-lib moments ("dale!", "fuego!", vocal runs).`,
    linesPerSection: 4,
    sceneDirectorPersona:
      "You are a Latin music video director creating vibrant, sun-drenched visuals with passionate choreography, tropical settings, and infectious energy.",
    defaultVisualStyle:
      "vibrant Latin aesthetic, tropical colors, sun-drenched settings, passionate dance scenes, warm saturated tones, beach/city nightlife energy",
    characterPreset:
      "passionate Latin performer with fluid dance moves, vibrant fashion, magnetic energy, tropical or urban setting",
    defaultImageStyle:
      "Latin music aesthetic, vibrant tropical colors, sun-drenched beach or neon-lit club, passionate dance energy, warm saturated tones, festive atmosphere",
    videoAnimationStyle:
      "Energetic, sun-soaked cinematography with fluid camera movement following dancers, vibrant color grading, quick rhythmic cuts, beach and nightlife settings.",
    musicSpec: {
      genre: "Reggaeton, Latin pop, tropical, bachata, salsa-pop",
      mood: "Passionate, fiery, danceable, festive",
      tempo: "90-100 BPM (reggaeton) or 120-130 BPM (salsa/tropical)",
      instruments:
        "Dembow rhythm, Latin percussion (congas, timbales, güiro), tropical synths, reggaeton bass, acoustic guitar, brass stabs, piano montuno",
      vocalStyle:
        "Passionate, rhythmic vocals with Latin flair. Smooth melodic singing on chorus, rhythmic flow on verses. Vocal ad-libs and call-and-response energy.",
    },
  },

  indie: {
    label: "Indie",
    icon: "headphones",
    color: "bg-teal-100 text-teal-700",
    songwriterPersona:
      "You are an indie songwriter with a gift for introspective, quirky, and emotionally honest music that feels like a personal diary entry set to melody.",
    lyricsRules: `RULES FOR INDIE SONGWRITING:
1. Prioritize authenticity and emotional honesty over polish.
2. Use unexpected imagery and metaphors — avoid clichés entirely.
3. Embrace imperfection — quirky phrasing and unconventional structures welcome.
4. Write from specific personal experience — specificity creates universality.
5. Subvert expectations in structure or lyrical turns.
6. Balance melancholy with hope, cynicism with sincerity.`,
    linesPerSection: 4,
    sceneDirectorPersona:
      "You are an indie film-inspired music video director creating lo-fi, dreamy visuals with 35mm film grain, natural settings, and authentic emotional moments.",
    defaultVisualStyle:
      "indie aesthetic, 35mm film grain, muted pastel tones, natural lighting, lo-fi charm, dreamy and introspective, analog warmth",
    characterPreset:
      "authentic indie artist in thrifted clothes, natural setting, candid and unposed, reflective mood",
    defaultImageStyle:
      "indie music aesthetic, 35mm film look, muted warm tones, natural lighting, lo-fi texture, vintage charm, candid and authentic, dreamy atmosphere",
    videoAnimationStyle:
      "Lo-fi, film-grain aesthetic with handheld camera, natural lighting, dreamy slow-motion moments, candid performance shots, intimate and authentic feel.",
    musicSpec: {
      genre: "Indie rock, indie pop, dream pop, lo-fi indie",
      mood: "Introspective, dreamy, bittersweet, authentic",
      tempo: "100-125 BPM",
      instruments:
        "Jangly electric guitar, warm analog synths, simple bass lines, lo-fi drums, glockenspiel, reverb-heavy guitar, Casio keyboard textures",
      vocalStyle:
        "Intimate, slightly imperfect vocals with genuine emotion. Breathy and close-mic'd in verses, opening up in chorus. Conversational and authentic delivery.",
    },
  },
};

export function getGenre(slug?: string): GenreConfig {
  if (slug && slug in GENRES) return GENRES[slug as GenreSlug];
  return GENRES[DEFAULT_GENRE];
}

export function getGenreList(): Array<{ slug: GenreSlug } & GenreConfig> {
  return (Object.entries(GENRES) as [GenreSlug, GenreConfig][]).map(
    ([slug, config]) => ({ slug, ...config })
  );
}
