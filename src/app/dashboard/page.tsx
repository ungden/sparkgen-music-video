"use client";

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { useProject } from "@/context/ProjectContext";
import { useFilm } from "@/context/FilmContext";
import { Project } from "@/types/project";
import { FilmProject } from "@/types/film";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AnyProject = { type: "music"; data: Project } | { type: "film"; data: FilmProject };

function StatusBadge({ status, type }: { status: string; type: "music" | "film" }) {
  const color = type === "film" ? "bg-violet-100 text-violet-700" : "bg-primary-container text-on-primary-container";
  const labels: Record<string, string> = { idea: "Drafting", storyboard: "Storyboarding", animation: "Animating", editing: "Editing", rendering: "Rendering", finished: "Finished" };
  return (
    <span className={`text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 w-fit ${status === "finished" ? color : "bg-surface-container-highest text-on-surface-variant"}`}>
      {(status === "storyboard" || status === "animation" || status === "rendering") && <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />}
      {labels[status] || "Draft"}
    </span>
  );
}

function TypeBadge({ type }: { type: "music" | "film" }) {
  return type === "film"
    ? <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-600">Film</span>
    : <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-600">Music Video</span>;
}

function getImage(p: AnyProject): string | null {
  const scenes = p.data.scenes;
  if (!scenes?.length) return null;
  const done = scenes.find((s) => s.status === "done" && ("imageBase64" in s ? s.imageBase64 : false));
  if (done && "imageBase64" in done && done.imageBase64) return `data:image/png;base64,${done.imageBase64}`;
  return null;
}

function getHref(p: AnyProject): string {
  const d = p.data;
  const base = p.type === "film" ? `/film/${d.id}` : `/project/${d.id}`;
  if (d.status === "finished" || d.status === "editing") return `${base}/editor`;
  if (d.status === "animation") return `${base}/animation`;
  if (d.scenes?.length) return `${base}/animation`;
  if (p.type === "music" && (d as Project).lyrics) return `${base}/storyboard`;
  if (p.type === "film" && (d as FilmProject).script) return `${base}/storyboard`;
  return `${base}/idea`;
}

function getSubtext(p: AnyProject): string {
  const d = p.data;
  if (d.scenes?.length) return `${d.scenes.length} scenes`;
  if (p.type === "music" && (d as Project).lyrics) return "Lyrics ready";
  if (p.type === "film" && (d as FilmProject).script) return "Script ready";
  return "Just started";
}

export default function Dashboard() {
  const { projects: musicProjects, createProject: createMusicProject, deleteProject: deleteMusicProject, updateProject: updateMusicProject } = useProject();
  const { projects: filmProjects, createProject: createFilmProject, deleteProject: deleteFilmProject, updateProject: updateFilmProject } = useFilm();
  const router = useRouter();
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AnyProject | null>(null);
  const [filter, setFilter] = useState<"all" | "music" | "film">("all");

  // Merge and sort all projects by date
  const allProjects: AnyProject[] = [
    ...musicProjects.map((p) => ({ type: "music" as const, data: p })),
    ...filmProjects.map((p) => ({ type: "film" as const, data: p })),
  ].sort((a, b) => new Date(b.data.updatedAt).getTime() - new Date(a.data.updatedAt).getTime());

  const filtered = filter === "all" ? allProjects : allProjects.filter((p) => p.type === filter);

  const handleCreate = async (type: "music" | "film") => {
    setShowNewModal(false);
    if (type === "music") {
      const id = await createMusicProject();
      router.push(`/project/${id}/idea`);
    } else {
      const id = await createFilmProject();
      router.push(`/film/${id}/idea`);
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "music") deleteMusicProject(confirmDelete.data.id);
    else deleteFilmProject(confirmDelete.data.id);
    setConfirmDelete(null);
  };

  const handleRename = (p: AnyProject) => {
    if (!editingId || !editTitle.trim()) { setEditingId(null); return; }
    if (p.type === "music") updateMusicProject(editingId, { title: editTitle.trim() });
    else updateFilmProject(editingId, { title: editTitle.trim() });
    setEditingId(null);
  };

  return (
    <>
      <Sidebar />
      <main className="ml-0 md:ml-64 min-h-screen p-4 md:p-8 lg:p-12">
        <TopNav />
        <div className="pt-20">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-4xl font-black text-on-surface tracking-tight mb-1">My Studio</h2>
              <p className="text-on-surface-variant font-medium">
                {allProjects.length} project{allProjects.length !== 1 ? "s" : ""} &mdash; {musicProjects.length} music video{musicProjects.length !== 1 ? "s" : ""}, {filmProjects.length} film{filmProjects.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-full font-black text-lg shadow-lg hover:opacity-90 transition-all active:scale-95">
              <span className="material-symbols-outlined filled">add_circle</span>
              New Project
            </button>
          </header>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-8">
            {(["all", "music", "film"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === f ? "bg-primary text-on-primary shadow" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"}`}>
                {f === "all" ? `All (${allProjects.length})` : f === "music" ? `Music Videos (${musicProjects.length})` : `Films (${filmProjects.length})`}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-50">movie_filter</span>
              </div>
              <h3 className="text-2xl font-black text-on-surface mb-2">
                {filter === "all" ? "No projects yet" : `No ${filter === "music" ? "music video" : "film"} projects`}
              </h3>
              <p className="text-on-surface-variant mb-8 max-w-md">Create your first project to get started.</p>
              <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-full font-black text-lg shadow-lg hover:opacity-90 active:scale-95">
                <span className="material-symbols-outlined">add</span>
                Create Project
              </button>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p) => {
                const image = getImage(p);
                const href = getHref(p);
                return (
                  <Link key={`${p.type}-${p.data.id}`} href={href} className="bg-surface-container-lowest rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <TypeBadge type={p.type} />
                        <StatusBadge status={p.data.status} type={p.type} />
                      </div>
                      <span className="text-[10px] text-on-surface-variant">{new Date(p.data.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="h-36 rounded-xl overflow-hidden mb-3 bg-surface-container">
                      {image ? (
                        <img className="w-full h-full object-cover" src={image} alt={p.data.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-outline-variant opacity-30">
                            {p.type === "film" ? "movie" : "music_video"}
                          </span>
                        </div>
                      )}
                    </div>
                    {editingId === p.data.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleRename(p); }} className="mb-1" onClick={(e) => e.preventDefault()}>
                        <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={() => handleRename(p)} className="text-base font-black text-on-surface bg-surface-container px-2 py-1 rounded-lg w-full border-2 border-primary" />
                      </form>
                    ) : (
                      <div className="flex items-center gap-2 mb-1 group/title">
                        <h4 className="text-base font-black text-on-surface flex-1 truncate">{p.data.title}</h4>
                        <div className="opacity-0 group-hover/title:opacity-100 flex gap-0.5 shrink-0">
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingId(p.data.id); setEditTitle(p.data.title); }} className="p-1 hover:bg-surface-container rounded" title="Rename">
                            <span className="material-symbols-outlined text-xs text-on-surface-variant">edit</span>
                          </button>
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(p); }} className="p-1 hover:bg-red-50 rounded" title="Delete">
                            <span className="material-symbols-outlined text-xs text-red-500">delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-on-surface-variant mb-3">{getSubtext(p)}</p>
                    <span className={`mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-full font-bold text-sm text-white ${p.type === "film" ? "bg-violet-600" : "bg-primary"}`}>
                      {p.data.status === "finished" ? "View" : p.data.status === "idea" ? "Start" : "Continue"}
                    </span>
                  </Link>
                );
              })}

              {/* New Project Card */}
              <div onClick={() => setShowNewModal(true)} className="bg-surface-container-low border-3 border-dashed border-outline-variant/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-high transition-colors min-h-[280px]">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl text-primary">add</span>
                </div>
                <h4 className="text-base font-black text-on-surface">New Project</h4>
                <p className="text-xs text-on-surface-variant mt-1">Music video or animated film</p>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowNewModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg mx-4 shadow-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-black text-on-surface text-center mb-2">Create New Project</h3>
            <p className="text-sm text-on-surface-variant text-center mb-8">What do you want to create?</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleCreate("music")} className="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-surface-container-high hover:border-primary hover:bg-primary/5 transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-blue-600">music_video</span>
                </div>
                <div className="text-center">
                  <h4 className="font-black text-on-surface mb-1">Music Video</h4>
                  <p className="text-xs text-on-surface-variant">AI lyrics, visuals, animation & soundtrack</p>
                </div>
              </button>
              <button onClick={() => handleCreate("film")} className="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-surface-container-high hover:border-violet-500 hover:bg-violet-50 transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-violet-600">movie</span>
                </div>
                <div className="text-center">
                  <h4 className="font-black text-on-surface mb-1">Animated Film</h4>
                  <p className="text-xs text-on-surface-variant">AI script, visuals, narration & background music</p>
                </div>
              </button>
            </div>
            <button onClick={() => setShowNewModal(false)} className="w-full mt-6 py-3 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
              <span className="material-symbols-outlined text-red-500 text-2xl">delete</span>
            </div>
            <h3 className="text-lg font-black text-on-surface text-center mb-2">Delete Project?</h3>
            <p className="text-sm text-on-surface-variant text-center mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-xl font-bold bg-surface-container-high text-on-surface-variant">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
