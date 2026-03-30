import { createClient } from "./client";
import type { Project, Scene, Lyrics, ThemeIdea, MusicTrack } from "@/types/project";

const supabase = createClient();

// --- Projects ---

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, scenes(*)")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbProject);
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, scenes(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapDbProject(data);
}

export async function createProject(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: userId, title: "Untitled Project" })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, "title" | "description" | "status" | "selectedTheme" | "customPrompt" | "lyrics" | "music">>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.selectedTheme !== undefined) dbUpdates.selected_theme = updates.selectedTheme;
  if (updates.customPrompt !== undefined) dbUpdates.custom_prompt = updates.customPrompt;
  if (updates.lyrics !== undefined) dbUpdates.lyrics = updates.lyrics;
  if (updates.music !== undefined) dbUpdates.music = updates.music;

  if (Object.keys(dbUpdates).length > 0) {
    const { error } = await supabase
      .from("projects")
      .update(dbUpdates)
      .eq("id", id);
    if (error) throw error;
  }
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// --- Scenes ---

export async function upsertScenes(projectId: string, scenes: Scene[]): Promise<void> {
  // Delete existing scenes for project, then insert fresh
  await supabase.from("scenes").delete().eq("project_id", projectId);

  if (scenes.length === 0) return;

  const rows = scenes.map((s) => ({
    project_id: projectId,
    scene_number: s.id,
    title: s.title,
    time_range: s.time,
    lyrics: s.lyrics,
    description: s.description,
    image_url: s.imageBase64 ? `data:image/png;base64,${s.imageBase64}` : null,
    status: s.status,
    video_status: s.videoStatus || "idle",
    video_file_name: s.videoFileName || null,
    video_error: s.videoError || null,
  }));

  const { error } = await supabase.from("scenes").insert(rows);
  if (error) throw error;
}

// --- Storage (for images) ---

export async function uploadSceneImage(
  userId: string,
  projectId: string,
  sceneId: number,
  base64: string
): Promise<string> {
  const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const path = `${userId}/${projectId}/scene-${sceneId}.png`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, buffer, { contentType: "image/png", upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAudio(
  userId: string,
  projectId: string,
  base64: string,
  mimeType: string
): Promise<string> {
  const ext = mimeType.includes("wav") ? "wav" : "mp3";
  const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const path = `${userId}/${projectId}/soundtrack.${ext}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

// --- Mappers ---

interface DbScene {
  scene_number: number;
  title: string;
  time_range: string;
  lyrics: string | null;
  description: string | null;
  image_url: string | null;
  status: string;
  video_status: string | null;
  video_file_name: string | null;
  video_error: string | null;
}

function mapDbProject(row: Record<string, unknown>): Project {
  const scenes = (row.scenes as DbScene[] | undefined) || [];
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || "",
    status: row.status as Project["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    selectedTheme: row.selected_theme as ThemeIdea | undefined,
    customPrompt: row.custom_prompt as string | undefined,
    lyrics: row.lyrics as Lyrics | undefined,
    music: row.music as MusicTrack | undefined,
    scenes: scenes
      .sort((a, b) => a.scene_number - b.scene_number)
      .map((s) => ({
        id: s.scene_number,
        title: s.title,
        time: s.time_range,
        lyrics: s.lyrics || "",
        description: s.description || "",
        imageBase64: s.image_url?.startsWith("data:") ? s.image_url.split(",")[1] : undefined,
        status: s.status as Scene["status"],
        videoStatus: (s.video_status as Scene["videoStatus"]) || undefined,
        videoFileName: s.video_file_name || undefined,
        videoError: s.video_error || undefined,
      })),
  };
}
