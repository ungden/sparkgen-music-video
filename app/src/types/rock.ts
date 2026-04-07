export type RockCategorySlug =
  | "conquerors-kings"
  | "rebels-outlaws"
  | "visionaries-inventors"
  | "dark-legends"
  | "fallen-heroes"
  | "queens-seducers"
  | "doomsday-prophecy";

export type VideoProvider = "veo" | "p-video";

export interface RockLyrics {
  verse1: string[];
  chorus: string[];
  verse2: string[];
  outro: string[];
}

export interface RockScene {
  id: number;
  title: string;
  time: string;
  lyrics: string;
  description: string;
  imageBase64?: string;
  imageUrl?: string;
  status: "pending" | "generating" | "done" | "error";
  videoStatus?: "idle" | "generating" | "done" | "error";
  videoFileName?: string;
  videoUrl?: string;
  videoError?: string;
}

export interface RockMusicTrack {
  audioBase64?: string;
  audioUrl?: string;
  mimeType?: string;
  status: "idle" | "generating" | "done" | "error";
  error?: string;
}

export interface RockThemeIdea {
  icon: string;
  title: string;
  desc: string;
  color: string;
  iconColor: string;
  categorySlug: RockCategorySlug;
  characterName?: string;
  storyAngle?: string;
}

export interface RockProject {
  id: string;
  title: string;
  description: string;
  categorySlug: RockCategorySlug;
  videoProvider: VideoProvider;
  status: "idea" | "storyboard" | "animation" | "editing" | "rendering" | "finished";
  selectedTheme?: RockThemeIdea;
  customPrompt?: string;
  artStyle?: string;
  lyrics?: RockLyrics;
  scenes?: RockScene[];
  music?: RockMusicTrack;
  createdAt: string;
  updatedAt: string;
}
