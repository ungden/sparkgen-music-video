export interface ThemeIdea {
  icon: string;
  title: string;
  desc: string;
  color: string;
  iconColor: string;
  categorySlug?: string;
}

export interface Lyrics {
  verse1: string[];
  chorus: string[];
  verse2: string[];
  outro: string[];
}

export interface Scene {
  id: number;
  title: string;
  time: string;
  lyrics: string;
  description: string;
  imageBase64?: string;
  imageUrl?: string;
  // Video generation fields
  videoOperationName?: string; // Veo async operation name for polling
  videoFileName?: string; // Generated video file name in Gemini
  videoUrl?: string;
  videoStatus?: "idle" | "generating" | "done" | "error";
  videoError?: string;
  status: "pending" | "generating" | "done" | "error";
}

export interface MusicTrack {
  audioBase64?: string; // Base64 encoded MP3/WAV
  mimeType?: string;
  audioUrl?: string;
  audioStoragePath?: string;
  genre?: string;
  mood?: string;
  tempo?: string;
  status: "idle" | "generating" | "done" | "error";
  error?: string;
}

export interface CharacterLibraryItem {
  id: string;
  name: string;
  categorySlug?: string;
  imageUrl: string;
  createdAt: string;
}

export type VideoProvider = "veo" | "p-video";

export interface Project {
  id: string;
  title: string;
  description: string;
  genre?: string;
  videoProvider?: VideoProvider;
  status: "idea" | "storyboard" | "animation" | "editing" | "rendering" | "finished";
  createdAt: string;
  updatedAt: string;
  selectedTheme?: ThemeIdea;
  customPrompt?: string;
  lyrics?: Lyrics;
  scenes?: Scene[];
  music?: MusicTrack;
  thumbnailUrl?: string;
  characterReferenceBase64?: string;
  characterReferenceUrl?: string;
  artStyle?: string;
  characterPrompt?: string;
  finalVideoUrl?: string;
  finalVideoStoragePath?: string;
  finalThumbnailUrl?: string;
  finalThumbnailStoragePath?: string;
  finalSongId?: string;
  renderStatus?: "idle" | "rendering" | "done" | "error";
  renderError?: string;
  renderedAt?: string;
  estimatedCost?: number;
  youtubeVideoId?: string | null;
}
