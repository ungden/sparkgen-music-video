export type FilmStyleSlug = "adventure" | "fairy-tale" | "sci-fi" | "comedy" | "mystery" | "documentary";
export type VideoProvider = "veo" | "p-video";

export interface ScriptScene {
  id: number;
  title: string;
  narration: string;
  dialogue?: string;
  visualDescription: string;
  durationEstimate: number;
}

export interface Script {
  synopsis: string;
  scenes: ScriptScene[];
}

export interface FilmScene {
  id: number;
  title: string;
  time: string;
  narrationText: string;
  visualDescription: string;
  durationEstimate: number;
  imageBase64?: string;
  imageUrl?: string;
  status: "pending" | "generating" | "done" | "error";
  videoStatus?: "idle" | "generating" | "done" | "error";
  videoFileName?: string;
  videoUrl?: string;
  videoError?: string;
  narrationAudioBase64?: string;
  narrationAudioUrl?: string;
  narrationMimeType?: string;
  narrationStatus?: "idle" | "generating" | "done" | "error";
  narrationError?: string;
}

export interface FilmMusicTrack {
  audioBase64?: string;
  mimeType?: string;
  status: "idle" | "generating" | "done" | "error";
  error?: string;
}

export interface FilmProject {
  id: string;
  title: string;
  description: string;
  filmStyle: FilmStyleSlug;
  videoProvider: VideoProvider;
  status: "idea" | "storyboard" | "animation" | "editing" | "rendering" | "finished";
  script?: Script;
  scenes?: FilmScene[];
  music?: FilmMusicTrack;
  selectedStory?: { icon: string; title: string; desc: string; color: string; iconColor: string };
  customPrompt?: string;
  characterPrompt?: string;
  characterReferenceBase64?: string;
  artStyle?: string;
  createdAt: string;
  updatedAt: string;
}
