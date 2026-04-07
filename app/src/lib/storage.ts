import { Project } from "@/types/project";

const STORAGE_KEY = "sparkgen_projects";
const BINARY_KEY_PREFIX = "sparkgen_bin_";

// Strip large binary data before saving to localStorage (5MB limit)
function stripBinaryForStorage(project: Project): Project {
  return {
    ...project,
    music: project.music
      ? { ...project.music, audioBase64: undefined }
      : undefined,
    scenes: project.scenes?.map((s) => ({
      ...s,
      imageBase64: undefined,
    })),
  };
}

// Save binary data (images, audio) separately in sessionStorage/indexedDB-like chunks
function saveBinaryData(project: Project): void {
  if (typeof window === "undefined") return;
  try {
    // Save scene images
    project.scenes?.forEach((s) => {
      if (s.imageBase64) {
        sessionStorage.setItem(`${BINARY_KEY_PREFIX}${project.id}_scene_${s.id}`, s.imageBase64);
      }
    });
    // Save audio
    if (project.music?.audioBase64) {
      sessionStorage.setItem(`${BINARY_KEY_PREFIX}${project.id}_audio`, project.music.audioBase64);
      sessionStorage.setItem(
        `${BINARY_KEY_PREFIX}${project.id}_audio_mime`,
        project.music.mimeType || "audio/mp3"
      );
    }
  } catch {
    // sessionStorage full - non-critical, data exists in memory
  }
}

// Restore binary data from sessionStorage
function restoreBinaryData(project: Project): Project {
  if (typeof window === "undefined") return project;
  try {
    const scenes = project.scenes?.map((s) => {
      const img = sessionStorage.getItem(`${BINARY_KEY_PREFIX}${project.id}_scene_${s.id}`);
      return img ? { ...s, imageBase64: img } : s;
    });
    const audioBase64 = sessionStorage.getItem(`${BINARY_KEY_PREFIX}${project.id}_audio`);
    const audioMime = sessionStorage.getItem(`${BINARY_KEY_PREFIX}${project.id}_audio_mime`);
    const music =
      audioBase64 && project.music
        ? { ...project.music, audioBase64, mimeType: audioMime || "audio/mp3" }
        : project.music;
    return { ...project, scenes, music };
  } catch {
    return project;
  }
}

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const projects: Project[] = raw ? JSON.parse(raw) : [];
    return projects.map(restoreBinaryData);
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    // Save binary data to sessionStorage
    projects.forEach(saveBinaryData);
    // Save metadata (without binary) to localStorage
    const stripped = projects.map(stripBinaryForStorage);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
  } catch (e) {
    console.error("Failed to save projects:", e);
  }
}

export function getProject(id: string): Project | null {
  return getProjects().find((p) => p.id === id) || null;
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.unshift(project);
  }
  saveProjects(projects);
}

export function deleteProject(id: string): void {
  if (typeof window === "undefined") return;
  // Clean up binary data
  try {
    const keys = Object.keys(sessionStorage).filter((k) =>
      k.startsWith(`${BINARY_KEY_PREFIX}${id}`)
    );
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch { /* ignore */ }
  saveProjects(getProjects().filter((p) => p.id !== id));
}
