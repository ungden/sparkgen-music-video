"use client";

import { Project } from "@/types/project";
import { createClient } from "@/lib/supabase/client";
import { mapDbProject } from "@/lib/supabase/db";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";

interface ProjectContextType {
  user: User | null;
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  loadProjects: () => Promise<void>;
  createProject: () => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  // Auth listener
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
        .from("projects")
        .select("*, scenes(*)")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map(mapDbProject);
      setProjects(mapped);
    } catch (e) {
      console.error("Failed to load projects:", e);
    } finally {
      setLoading(false);
    }
  }

  const loadProjects = useCallback(async () => {
    await loadProjectsInternal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createProject = useCallback(async (): Promise<string> => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: currentUser.id, title: "Untitled Project" })
      .select("*, scenes(*)")
      .single();

    if (error) throw error;
    const project = mapDbProject(data);
    setProjects((prev) => [project, ...prev]);
    setCurrentProjectState(project);
    return project.id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProject = useCallback(
    async (id: string, updates: Partial<Project>) => {
      // Build DB update object
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.genre !== undefined) dbUpdates.genre = updates.genre;
      if (updates.videoProvider !== undefined) dbUpdates.video_provider = updates.videoProvider;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.selectedTheme !== undefined) dbUpdates.selected_theme = updates.selectedTheme;
      if (updates.characterPrompt !== undefined) dbUpdates.character_prompt = updates.characterPrompt;
      if (updates.artStyle !== undefined) dbUpdates.art_style = updates.artStyle;
      if (updates.customPrompt !== undefined) dbUpdates.custom_prompt = updates.customPrompt;
      if (updates.lyrics !== undefined) dbUpdates.lyrics = updates.lyrics;
      if (updates.music !== undefined) dbUpdates.music = updates.music;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from("projects")
          .update(dbUpdates)
          .eq("id", id);
        if (error) throw new Error(`Update project failed: ${error.message}`);
      }

      // Update scenes if provided - use upsert to prevent data loss
      if (updates.scenes) {
        if (updates.scenes.length === 0) {
          await supabase.from("scenes").delete().eq("project_id", id);
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
            video_file_name: s.videoFileName || null,
            video_url: s.videoUrl || null,
            video_error: s.videoError || null,
          }));
          const { error: upsertError } = await supabase
            .from("scenes")
            .upsert(rows, { onConflict: "project_id,scene_number" });
          if (upsertError) console.error("Upsert scenes error:", upsertError);

          // Remove scenes no longer in the list
          const sceneNumbers = updates.scenes.map((s) => s.id);
          await supabase
            .from("scenes")
            .delete()
            .eq("project_id", id)
            .not("scene_number", "in", `(${sceneNumbers.join(",")})`);
        }
      }

      // Update local state immediately
      setProjects((prev) => {
        const idx = prev.findIndex((p) => p.id === id);
        if (idx < 0) return prev;
        const updated = { ...prev[idx], ...updates, updatedAt: new Date().toISOString() };
        const next = [...prev];
        next[idx] = updated;
        setCurrentProjectState((cur) => (cur?.id === id ? updated : cur));
        return next;
      });
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const deleteProjectFn = useCallback(async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setCurrentProjectState((cur) => (cur?.id === id ? null : cur));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrentProject = useCallback(
    (id: string) => {
      // Validate UUID format to prevent infinite loops from bad IDs
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        console.error("Invalid project ID:", id);
        return;
      }
      setProjects((prev) => {
        const found = prev.find((p) => p.id === id);
        if (found) {
          setCurrentProjectState(found);
        } else {
          supabase
            .from("projects")
            .select("*, scenes(*)")
            .eq("id", id)
            .single()
            .then(({ data, error }) => {
              if (error || !data) return;
              const project = mapDbProject(data);
              setCurrentProjectState(project);
              setProjects((p) => {
                if (p.find((x) => x.id === id)) return p;
                return [project, ...p];
              });
            });
        }
        return prev;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <ProjectContext.Provider
      value={{
        user,
        projects,
        currentProject,
        loading,
        loadProjects,
        createProject,
        updateProject,
        deleteProject: deleteProjectFn,
        setCurrentProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}

// mapDbProject is imported from @/lib/supabase/db
