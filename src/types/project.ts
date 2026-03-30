export interface ThemeIdea {
  icon: string;
  title: string;
  desc: string;
  color: string;
  iconColor: string;
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
  // Video generation fields
  videoOperationName?: string; // Veo async operation name for polling
  videoFileName?: string; // Generated video file name in Gemini
  videoStatus?: "idle" | "generating" | "done" | "error";
  videoError?: string;
  status: "pending" | "generating" | "done" | "error";
}

export interface MusicTrack {
  audioBase64?: string; // Base64 encoded MP3/WAV
  mimeType?: string;
  genre?: string;
  mood?: string;
  tempo?: string;
  status: "idle" | "generating" | "done" | "error";
  error?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: "idea" | "storyboard" | "animation" | "editing" | "rendering" | "finished";
  createdAt: string;
  updatedAt: string;
  selectedTheme?: ThemeIdea;
  customPrompt?: string;
  lyrics?: Lyrics;
  scenes?: Scene[];
  music?: MusicTrack;
  thumbnailUrl?: string;
}
