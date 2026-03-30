// Gemini API Pricing (as of March 2026)
// Source: https://ai.google.dev/pricing

export const PRICING = {
  // --- Text Generation ---
  "gemini-2.5-flash": {
    label: "Gemini 2.5 Flash",
    inputPer1M: 0.30,
    outputPer1M: 2.50,
  },

  // --- Image Generation ---
  "gemini-2.0-flash-image": {
    label: "Gemini 2.0 Flash (Image Gen)",
    perImage: 0.04,
  },
  "imagen-4-fast": {
    label: "Imagen 4 Fast",
    perImage: 0.02,
  },
  "imagen-4-standard": {
    label: "Imagen 4 Standard",
    perImage: 0.04,
  },
  "imagen-4-ultra": {
    label: "Imagen 4 Ultra",
    perImage: 0.06,
  },

  // --- Video Generation (Veo) ---
  veo: {
    "3.1": {
      standard: { "720p": 0.40, "1080p": 0.40, "4k": 0.60 },
      fast:     { "720p": 0.15, "1080p": 0.15, "4k": 0.35 },
    },
    "3": {
      standard: { "720p": 0.40, "1080p": 0.40 },
      fast:     { "720p": 0.15, "1080p": 0.15 },
    },
    "2": {
      standard: { "720p": 0.35, "1080p": 0.35 },
    },
  } as Record<string, Record<string, Record<string, number>>>,

  // --- Music Generation (Lyria) ---
  lyria: {
    "clip": { label: "Lyria 3 Clip (~30s)", perSong: 0.04 },
    "pro":  { label: "Lyria 3 Pro (~2min)", perSong: 0.08 },
  },
} as const;

// Estimate token counts for our use cases
const AVG_TOKENS = {
  ideasPrompt:  { input: 300, output: 400 },
  lyricsPrompt: { input: 200, output: 600 },
  scenesPrompt: { input: 800, output: 1200 },
};

export type VeoVersion = "3.1" | "3" | "2";
export type VeoSpeed = "standard" | "fast";
export type VeoResolution = "720p" | "1080p" | "4k";
export type LyriaTier = "clip" | "pro";
export type ImageModel = "gemini-2.0-flash-image" | "imagen-4-fast" | "imagen-4-standard" | "imagen-4-ultra";

export interface CostBreakdown {
  step: string;
  model: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface CostOptions {
  numScenes: number;
  videoDuration: number; // 4, 6, or 8 seconds
  veoVersion: VeoVersion;
  veoSpeed: VeoSpeed;
  veoResolution: VeoResolution;
  lyriaTier: LyriaTier;
  imageModel: ImageModel;
}

export const DEFAULT_OPTIONS: CostOptions = {
  numScenes: 5,
  videoDuration: 6,
  veoVersion: "3.1",
  veoSpeed: "standard",
  veoResolution: "720p",
  lyriaTier: "clip",
  imageModel: "gemini-2.0-flash-image",
};

export function getVeoPrice(version: VeoVersion, speed: VeoSpeed, resolution: VeoResolution): number | null {
  const v = PRICING.veo[version];
  if (!v) return null;
  const s = v[speed];
  if (!s) return null;
  return s[resolution] ?? null;
}

export function getImagePrice(model: ImageModel): number {
  if (model === "gemini-2.0-flash-image") return PRICING["gemini-2.0-flash-image"].perImage;
  if (model === "imagen-4-fast") return PRICING["imagen-4-fast"].perImage;
  if (model === "imagen-4-standard") return PRICING["imagen-4-standard"].perImage;
  if (model === "imagen-4-ultra") return PRICING["imagen-4-ultra"].perImage;
  return 0.04;
}

export function calculateProjectCost(options: CostOptions = DEFAULT_OPTIONS) {
  const { numScenes, videoDuration, veoVersion, veoSpeed, veoResolution, lyriaTier, imageModel } = options;
  const items: CostBreakdown[] = [];

  // Step 1: Idea Generation
  const ideasCost =
    (AVG_TOKENS.ideasPrompt.input / 1_000_000) * PRICING["gemini-2.5-flash"].inputPer1M +
    (AVG_TOKENS.ideasPrompt.output / 1_000_000) * PRICING["gemini-2.5-flash"].outputPer1M;
  items.push({
    step: "Step 1",
    model: "Gemini 2.5 Flash",
    description: "Generate 4 theme ideas",
    quantity: 1,
    unitCost: ideasCost,
    totalCost: ideasCost,
  });

  // Step 1: Lyrics Generation
  const lyricsCost =
    (AVG_TOKENS.lyricsPrompt.input / 1_000_000) * PRICING["gemini-2.5-flash"].inputPer1M +
    (AVG_TOKENS.lyricsPrompt.output / 1_000_000) * PRICING["gemini-2.5-flash"].outputPer1M;
  items.push({
    step: "Step 1",
    model: "Gemini 2.5 Flash",
    description: "Generate song lyrics",
    quantity: 1,
    unitCost: lyricsCost,
    totalCost: lyricsCost,
  });

  // Step 2: Scene Descriptions
  const scenesCost =
    (AVG_TOKENS.scenesPrompt.input / 1_000_000) * PRICING["gemini-2.5-flash"].inputPer1M +
    (AVG_TOKENS.scenesPrompt.output / 1_000_000) * PRICING["gemini-2.5-flash"].outputPer1M;
  items.push({
    step: "Step 2",
    model: "Gemini 2.5 Flash",
    description: "Generate scene descriptions",
    quantity: 1,
    unitCost: scenesCost,
    totalCost: scenesCost,
  });

  // Step 2: Image Generation
  const imgPrice = getImagePrice(imageModel);
  const imgLabel = imageModel === "gemini-2.0-flash-image" ? "Gemini Flash" :
    imageModel === "imagen-4-fast" ? "Imagen 4 Fast" :
    imageModel === "imagen-4-standard" ? "Imagen 4 Std" : "Imagen 4 Ultra";
  items.push({
    step: "Step 2",
    model: imgLabel,
    description: `Generate scene images`,
    quantity: numScenes,
    unitCost: imgPrice,
    totalCost: imgPrice * numScenes,
  });

  // Step 3: Video Generation
  const veoPricePerSec = getVeoPrice(veoVersion, veoSpeed, veoResolution);
  if (veoPricePerSec !== null) {
    const clipCost = veoPricePerSec * videoDuration;
    items.push({
      step: "Step 3",
      model: `Veo ${veoVersion} ${veoSpeed} (${veoResolution})`,
      description: `Animate scenes (${videoDuration}s each)`,
      quantity: numScenes,
      unitCost: clipCost,
      totalCost: clipCost * numScenes,
    });
  }

  // Step 3: Music Generation
  const musicPrice = PRICING.lyria[lyriaTier].perSong;
  const musicLabel = lyriaTier === "pro" ? "Lyria 3 Pro (~2min)" : "Lyria 3 Clip (~30s)";
  items.push({
    step: "Step 3",
    model: musicLabel,
    description: "Generate soundtrack",
    quantity: 1,
    unitCost: musicPrice,
    totalCost: musicPrice,
  });

  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

  // Total video duration for the whole project
  const totalVideoDuration = numScenes * videoDuration;

  return { items, totalCost, totalVideoDuration };
}
