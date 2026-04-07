"use client";

import type { RockProject, RockScene, RockLyrics, RockMusicTrack, RockCategorySlug, RockThemeIdea, VideoProvider } from "@/types/rock";
import { createClient } from "@/lib/supabase/client";
import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

interface RockContextType {
  user: User | null;
  projects: RockProject[];
  currentProject: RockProject | null;
  loading: boolean;
  loadProjects: () => Promise<void>;
  createProject: () => Promise<string>;
  updateProject: (id: string, updates: Partial<RockProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string) => void;
}

const RockContext = createContext<RockContextType | null>(null);

export function RockProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<RockProject[]>([]);
  const [currentProject, setCurrentProjectState] = useState<RockProject | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

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
        .from("rock_projects")
        .select("*, rock_scenes(*)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setProjects((data || []).map(mapDbRockProject));
    } catch (e) {
      console.error("Failed to load rock projects:", e);
    } finally {
      setLoading(false);
    }
  }

  const loadProjects = useCallback(async () => { await loadProjectsInternal(); }, []);

  const createProject = useCallback(async (): Promise<string> => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("rock_projects")
      .insert({ user_id: u.id, title: "Untitled Rock Song" })
      .select("*, rock_scenes(*)")
      .single();
    if (error) throw error;
    const project = mapDbRockProject(data);
    setProjects((prev) => [project, ...prev]);
    setCurrentProjectState(project);
    return project.id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<RockProject>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.categorySlug !== undefined) dbUpdates.category_slug = updates.categorySlug;
    if (updates.videoProvider !== undefined) dbUpdates.video_provider = updates.videoProvider;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.selectedTheme !== undefined) dbUpdates.selected_theme = updates.selectedTheme;
    if (updates.customPrompt !== undefined) dbUpdates.custom_prompt = updates.customPrompt;
    if (updates.artStyle !== undefined) dbUpdates.art_style = updates.artStyle;
    if (updates.lyrics !== undefined) dbUpdates.lyrics = updates.lyrics;
    if (updates.music !== undefined) dbUpdates.music = updates.music;

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from("rock_projects").update(dbUpdates).eq("id", id);
    }

    if (updates.scenes) {
      if (updates.scenes.length === 0) {
        await supabase.from("rock_scenes").delete().eq("project_id", id);
      } else {
        const rows = updates.scenes.map((s) => ({
          project_id: id,
          scene_number: s.id,
          title: s.title,
          time_range: s.time,
          lyrics: s.lyrics,
          description: s.description,
          image_url: s.imageUrl || (s.imageBase64 ? `data:image/png;base64,${s.imageBase64}` : null),
          status: s.status,
          video_status: s.videoStatus || "idle",
          video_url: s.videoUrl || null,
          video_file_name: s.videoFileName || null,
          video_error: s.videoError || null,
        }));
        const { error: upsertError } = await supabase
          .from("rock_scenes")
          .upsert(rows, { onConflict: "project_id,scene_number" });
        if (upsertError) console.error("Upsert rock scenes error:", upsertError);

        const sceneNumbers = updates.scenes.map((s) => s.id);
        await supabase
          .from("rock_scenes")
          .delete()
          .eq("project_id", id)
          .not("scene_number", "in", `(${sceneNumbers.join(",")})`);
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
    await supabase.from("rock_projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setCurrentProjectState((cur) => (cur?.id === id ? null : cur));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrentProject = useCallback((id: string) => {
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      console.error("Invalid rock project ID:", id);
      return;
    }
    setProjects((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) {
        setCurrentProjectState(found);
      } else {
        supabase.from("rock_projects").select("*, rock_scenes(*)").eq("id", id).single()
          .then(({ data, error }) => {
            if (error || !data) return;
            const project = mapDbRockProject(data);
            setCurrentProjectState(project);
            setProjects((p) => p.find((x) => x.id === id) ? p : [project, ...p]);
          });
      }
      return prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RockContext.Provider value={{ user, projects, currentProject, loading, loadProjects, createProject, updateProject, deleteProject: deleteProjectFn, setCurrentProject }}>
      {children}
    </RockContext.Provider>
  );
}

export function useRock() {
  const ctx = useContext(RockContext);
  if (!ctx) throw new Error("useRock must be used within RockProvider");
  return ctx;
}

function mapDbRockProject(row: Record<string, unknown>): RockProject {
  const scenes = (row.rock_scenes as Array<Record<string, unknown>>) || [];
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || "",
    categorySlug: (row.category_slug as RockCategorySlug) || "conquerors-kings",
    videoProvider: (row.video_provider as VideoProvider) || "veo",
    status: row.status as RockProject["status"],
    selectedTheme: row.selected_theme as RockThemeIdea | undefined,
    customPrompt: row.custom_prompt as string | undefined,
    artStyle: row.art_style as string | undefined,
    lyrics: row.lyrics as RockLyrics | undefined,
    music: row.music as RockMusicTrack | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    scenes: scenes
      .sort((a, b) => (a.scene_number as number) - (b.scene_number as number))
      .map((s) => {
        const imgUrl = s.image_url as string | null;
        return {
          id: s.scene_number as number,
          title: s.title as string,
          time: (s.time_range as string) || "",
          lyrics: (s.lyrics as string) || "",
          description: (s.description as string) || "",
          imageBase64: imgUrl?.startsWith("data:") ? imgUrl.split(",")[1] : undefined,
          imageUrl: imgUrl && !imgUrl.startsWith("data:") ? imgUrl : undefined,
          status: s.status as RockScene["status"],
          videoStatus: (s.video_status as RockScene["videoStatus"]) || undefined,
          videoUrl: (s.video_url as string) || undefined,
          videoFileName: (s.video_file_name as string) || undefined,
          videoError: (s.video_error as string) || undefined,
        };
      }),
  };
}
