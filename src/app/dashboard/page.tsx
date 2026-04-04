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
  const { projects: musicProjects, createProject: createMusicProject, deleteProject: deleteMusicProject, updateProject: updateMusicProject, loading: musicLoading } = useProject();
  const { projects: filmProjects, createProject: createFilmProject, deleteProject: deleteFilmProject, updateProject: updateFilmProject, loading: filmLoading } = useFilm();
  const isLoading = musicLoading || filmLoading;
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
          <header className="mb-8">
            <h2 className="text-4xl font-black text-on-surface tracking-tight mb-1">My Studio</h2>
            <p className="text-on-surface-variant font-medium">Create AI-powered videos from idea to final render</p>
          </header>

          {/* Create New — 2 big cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <button onClick={() => handleCreate("music")} className="flex items-center gap-5 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all text-left group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                <span className="material-symbols-outlined text-white text-2xl filled">music_video</span>
              </div>
              <div>
                <h3 className="font-black text-lg text-on-surface mb-0.5">New Music Video</h3>
                <p className="text-xs text-on-surface-variant">AI lyrics, illustrations, animation &amp; soundtrack &mdash; 11 genres</p>
              </div>
              <span className="material-symbols-outlined text-blue-400 ml-auto text-xl">arrow_forward</span>
            </button>
            <button onClick={() => handleCreate("film")} className="flex items-center gap-5 p-6 rounded-2xl bg-gradient-to-r from-violet-50 to-violet-100 border-2 border-violet-200 hover:border-violet-400 hover:shadow-lg transition-all text-left group">
              <div className="w-14 h-14 rounded-2xl bg-violet-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/20">
                <span className="material-symbols-outlined text-white text-2xl filled">movie</span>
              </div>
              <div>
                <h3 className="font-black text-lg text-on-surface mb-0.5">New Animated Film</h3>
                <p className="text-xs text-on-surface-variant">AI script, visuals, narration &amp; background music &mdash; 6 styles</p>
              </div>
              <span className="material-symbols-outlined text-violet-400 ml-auto text-xl">arrow_forward</span>
            </button>
          </div>

          {/* Filter Tabs + Project Count */}
          {allProjects.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                {(["all", "music", "film"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === f ? "bg-primary text-on-primary shadow" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"}`}>
                    {f === "all" ? `All (${allProjects.length})` : f === "music" ? `Music Videos (${musicProjects.length})` : `Films (${filmProjects.length})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 animate-pulse">
                  <div className="flex justify-between mb-3"><div className="h-5 w-20 bg-surface-container-high rounded-full" /><div className="h-3 w-16 bg-surface-container-high rounded" /></div>
                  <div className="h-36 rounded-xl bg-surface-container-high mb-3" />
                  <div className="h-5 w-2/3 bg-surface-container-high rounded mb-2" />
                  <div className="h-3 w-1/3 bg-surface-container-high rounded mb-3" />
                  <div className="h-10 bg-surface-container-high rounded-full" />
                </div>
              ))}
            </section>
          ) : filtered.length === 0 ? (
            <div className="max-w-3xl mx-auto">
              {/* Welcome + How It Works */}
              <div className="text-center mb-12">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                  <span className="material-symbols-outlined text-4xl text-primary">auto_awesome</span>
                </div>
                <h3 className="text-3xl font-black text-on-surface mb-3">Welcome to SparkGen AI</h3>
                <p className="text-on-surface-variant text-lg max-w-xl mx-auto">Create AI-powered music videos and animated short films in minutes. Here&apos;s how it works:</p>
              </div>

              {/* Steps Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {[
                  { step: "1", icon: "lightbulb", title: "Pick a Theme", desc: "Choose a genre/style, then select or write your own idea. AI generates lyrics or a script.", color: "bg-blue-100 text-blue-600" },
                  { step: "2", icon: "image", title: "Storyboard", desc: "AI breaks your song/script into scenes and generates stunning illustrations for each one.", color: "bg-amber-100 text-amber-600" },
                  { step: "3", icon: "movie", title: "Animate & Add Audio", desc: "AI animates scenes into video clips, generates music (or narration for films).", color: "bg-emerald-100 text-emerald-600" },
                  { step: "4", icon: "download", title: "Render & Download", desc: "All clips are composited into a final MP4 video you can download and share.", color: "bg-rose-100 text-rose-600" },
                ].map((s) => (
                  <div key={s.step} className="bg-surface-container-lowest rounded-2xl p-6 flex gap-4 items-start shadow-sm">
                    <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-xl filled">{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Step {s.step}</p>
                      <h4 className="font-black text-on-surface mb-1">{s.title}</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create CTA */}
              <div className="text-center">
                <button onClick={() => setShowNewModal(true)} className="inline-flex items-center gap-3 bg-primary text-on-primary px-10 py-5 rounded-full font-black text-lg shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
                  <span className="material-symbols-outlined filled text-2xl">add_circle</span>
                  Create Your First Project
                </button>
                <p className="text-xs text-on-surface-variant mt-4">Choose between Music Video or Animated Short Film</p>
              </div>
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
