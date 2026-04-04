"use client";

import type { FilmProject, FilmScene, Script, FilmMusicTrack, FilmStyleSlug, VideoProvider } from "@/types/film";
import { createClient } from "@/lib/supabase/client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

interface FilmContextType {
  user: User | null;
  projects: FilmProject[];
  currentProject: FilmProject | null;
  loading: boolean;
  loadProjects: () => Promise<void>;
  createProject: () => Promise<string>;
  updateProject: (id: string, updates: Partial<FilmProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string) => void;
}

const FilmContext = createContext<FilmContextType | null>(null);

export function FilmProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<FilmProject[]>([]);
  const [currentProject, setCurrentProjectState] = useState<FilmProject | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadProjectsInternal();
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProjectsInternal();
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProjectsInternal() {
    try {
      const { data, error } = await supabase
        .from("film_projects")
        .select("*, film_scenes(*)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setProjects((data || []).map(mapDbFilmProject));
    } catch (e) {
      console.error("Failed to load film projects:", e);
    } finally {
      setLoading(false);
    }
  }

  const loadProjects = useCallback(async () => { await loadProjectsInternal(); }, []);

  const createProject = useCallback(async (): Promise<string> => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("film_projects")
      .insert({ user_id: u.id, title: "Untitled Film" })
      .select("*, film_scenes(*)")
      .single();
    if (error) throw error;
    const project = mapDbFilmProject(data);
    setProjects((prev) => [project, ...prev]);
    setCurrentProjectState(project);
    return project.id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<FilmProject>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.filmStyle !== undefined) dbUpdates.film_style = updates.filmStyle;
    if (updates.videoProvider !== undefined) dbUpdates.video_provider = updates.videoProvider;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.script !== undefined) dbUpdates.script = updates.script;
    if (updates.music !== undefined) dbUpdates.music = updates.music;
    if (updates.selectedStory !== undefined) dbUpdates.selected_story = updates.selectedStory;
    if (updates.customPrompt !== undefined) dbUpdates.custom_prompt = updates.customPrompt;
    if (updates.characterPrompt !== undefined) dbUpdates.character_prompt = updates.characterPrompt;
    if (updates.artStyle !== undefined) dbUpdates.art_style = updates.artStyle;

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from("film_projects").update(dbUpdates).eq("id", id);
    }

    if (updates.scenes) {
      await supabase.from("film_scenes").delete().eq("project_id", id);
      if (updates.scenes.length > 0) {
        const rows = updates.scenes.map((s) => ({
          project_id: id,
          scene_number: s.id,
          title: s.title,
          time_range: s.time,
          narration_text: s.narrationText,
          visual_description: s.visualDescription,
          duration_estimate: s.durationEstimate,
          image_url: s.imageUrl || (s.imageBase64 ? `data:image/png;base64,${s.imageBase64}` : null),
          status: s.status,
          video_status: s.videoStatus || "idle",
          video_url: s.videoUrl || null,
          video_file_name: s.videoFileName || null,
          video_error: s.videoError || null,
          narration_audio_url: s.narrationAudioBase64 ? `data:${s.narrationMimeType || "audio/mp3"};base64,${s.narrationAudioBase64}` : null,
          narration_status: s.narrationStatus || "idle",
          narration_error: s.narrationError || null,
        }));
        await supabase.from("film_scenes").insert(rows);
      }
    }

    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const updated = { ...prev[idx], ...updates, updatedAt: new Date().toISOString() };
      const next = [...prev];
      next[idx] = updated;
      setCurrentProjectState((cur) => (cur?.id === id ? updated : cur));
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteProjectFn = useCallback(async (id: string) => {
    await supabase.from("film_projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setCurrentProjectState((cur) => (cur?.id === id ? null : cur));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrentProject = useCallback((id: string) => {
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      console.error("Invalid film project ID:", id);
      return;
    }
    setProjects((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) {
        setCurrentProjectState(found);
      } else {
        supabase.from("film_projects").select("*, film_scenes(*)").eq("id", id).single()
          .then(({ data, error }) => {
            if (error || !data) return;
            const project = mapDbFilmProject(data);
            setCurrentProjectState(project);
            setProjects((p) => p.find((x) => x.id === id) ? p : [project, ...p]);
          });
      }
      return prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FilmContext.Provider value={{ user, projects, currentProject, loading, loadProjects, createProject, updateProject, deleteProject: deleteProjectFn, setCurrentProject }}>
      {children}
    </FilmContext.Provider>
  );
}

export function useFilm() {
  const ctx = useContext(FilmContext);
  if (!ctx) throw new Error("useFilm must be used within FilmProvider");
  return ctx;
}

function mapDbFilmProject(row: Record<string, unknown>): FilmProject {
  const scenes = (row.film_scenes as Array<Record<string, unknown>>) || [];
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || "",
    filmStyle: (row.film_style as FilmStyleSlug) || "adventure",
    videoProvider: (row.video_provider as VideoProvider) || "veo",
    status: row.status as FilmProject["status"],
    script: row.script as Script | undefined,
    music: row.music as FilmMusicTrack | undefined,
    selectedStory: row.selected_story as FilmProject["selectedStory"],
    customPrompt: row.custom_prompt as string | undefined,
    characterPrompt: row.character_prompt as string | undefined,
    artStyle: row.art_style as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    scenes: scenes
      .sort((a, b) => (a.scene_number as number) - (b.scene_number as number))
      .map((s) => {
        const imgUrl = s.image_url as string | null;
        const narUrl = s.narration_audio_url as string | null;
        return {
          id: s.scene_number as number,
          title: s.title as string,
          time: (s.time_range as string) || "",
          narrationText: (s.narration_text as string) || "",
          visualDescription: (s.visual_description as string) || "",
          durationEstimate: (s.duration_estimate as number) || 6,
          imageBase64: imgUrl?.startsWith("data:") ? imgUrl.split(",")[1] : undefined,
          imageUrl: imgUrl && !imgUrl.startsWith("data:") ? imgUrl : undefined,
          status: s.status as FilmScene["status"],
          videoStatus: (s.video_status as FilmScene["videoStatus"]) || undefined,
          videoUrl: (s.video_url as string) || undefined,
          videoFileName: (s.video_file_name as string) || undefined,
          videoError: (s.video_error as string) || undefined,
          narrationAudioBase64: narUrl?.startsWith("data:") ? narUrl.split(",")[1] : undefined,
          narrationMimeType: narUrl?.startsWith("data:") ? narUrl.split(";")[0].split(":")[1] : undefined,
          narrationStatus: (s.narration_status as FilmScene["narrationStatus"]) || undefined,
          narrationError: (s.narration_error as string) || undefined,
        };
      }),
  };
}
