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
  updates: Partial<Pick<Project, "title" | "description" | "genre" | "status" | "selectedTheme" | "customPrompt" | "lyrics" | "music">>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.genre !== undefined) dbUpdates.genre = updates.genre;
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
  if (scenes.length === 0) {
    // Only delete if explicitly clearing all scenes
    const { error } = await supabase.from("scenes").delete().eq("project_id", projectId);
    if (error) throw error;
    return;
  }

  const rows = scenes.map((s) => ({
    project_id: projectId,
    scene_number: s.id,
    title: s.title,
    time_range: s.time,
    lyrics: s.lyrics,
    description: s.description,
    image_url: s.imageUrl || (s.imageBase64 ? `data:image/png;base64,${s.imageBase64}` : null),
    status: s.status,
    video_status: s.videoStatus || "idle",
    video_file_name: s.videoFileName || null,
    video_url: s.videoUrl || null,
    video_error: s.videoError || null,
  }));

  // Upsert instead of delete+insert to prevent data loss on partial failure
  const { error: upsertError } = await supabase
    .from("scenes")
    .upsert(rows, { onConflict: "project_id,scene_number" });
  if (upsertError) throw upsertError;

  // Remove scenes that no longer exist (scene numbers not in the new set)
  const sceneNumbers = scenes.map((s) => s.id);
  const { error: deleteError } = await supabase
    .from("scenes")
    .delete()
    .eq("project_id", projectId)
    .not("scene_number", "in", `(${sceneNumbers.join(",")})`);
  if (deleteError) throw deleteError;
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

// --- Mappers (shared - also used by ProjectContext) ---

export function mapDbProject(row: Record<string, unknown>): Project {
  const scenes = (row.scenes as Array<Record<string, unknown>>) || [];
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || "",
    genre: (row.genre as string) || undefined,
    videoProvider: (row.video_provider as Project["videoProvider"]) || undefined,
    status: row.status as Project["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    selectedTheme: row.selected_theme as ThemeIdea | undefined,
    customPrompt: row.custom_prompt as string | undefined,
    characterPrompt: row.character_prompt as string | undefined,
    artStyle: row.art_style as string | undefined,
    lyrics: row.lyrics as Lyrics | undefined,
    music: row.music as MusicTrack | undefined,
    scenes: scenes
      .sort((a, b) => (a.scene_number as number) - (b.scene_number as number))
      .map((s) => {
        const imgUrl = s.image_url as string | null;
        return {
          id: s.scene_number as number,
          title: s.title as string,
          time: s.time_range as string,
          lyrics: (s.lyrics as string) || "",
          description: (s.description as string) || "",
          imageBase64: imgUrl?.startsWith("data:") ? imgUrl.split(",")[1] : undefined,
          imageUrl: imgUrl && !imgUrl.startsWith("data:") ? imgUrl : undefined,
          status: s.status as Scene["status"],
          videoStatus: (s.video_status as Scene["videoStatus"]) || undefined,
          videoFileName: (s.video_file_name as string) || undefined,
          videoUrl: (s.video_url as string) || undefined,
          videoError: (s.video_error as string) || undefined,
        };
      }),
  };
}
