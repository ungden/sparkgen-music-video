"use client";

import RockSidebar from "@/components/rock/RockSidebar";
import RockTopNav from "@/components/rock/RockTopNav";
import { useRock } from "@/context/RockContext";
import { RockScene } from "@/types/rock";
import { getRockCategory } from "@/lib/rock-categories";
import Link from "next/link";
import { use, useState, useEffect, useCallback } from "react";

export default function RockStoryboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentProject, setCurrentProject, updateProject } = useRock();
  const [scenes, setScenes] = useState<RockScene[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingImageIdx, setGeneratingImageIdx] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setCurrentProject(id); }, [id, setCurrentProject]);
  useEffect(() => { if (currentProject?.scenes?.length && scenes.length === 0) setScenes(currentProject.scenes); }, [currentProject, scenes.length]);

  const categoryConfig = currentProject?.categorySlug ? getRockCategory(currentProject.categorySlug) : null;

  const generateScenes = useCallback(async () => {
    if (!currentProject?.lyrics) { setError("No lyrics found. Go back to Step 1."); return; }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/rock/generate-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics: currentProject.lyrics, categorySlug: currentProject.categorySlug, themeTitle: currentProject.selectedTheme?.title }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setScenes(data.scenes);
      updateProject(id, { scenes: data.scenes, status: "storyboard", artStyle: data.artStyle });

      for (let i = 0; i < data.scenes.length; i++) {
        await generateImageForScene(data.scenes, i);
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setIsGenerating(false); }
  }, [currentProject, id, updateProject]);

  const generateImageForScene = async (currentScenes: RockScene[], index: number, retries = 2) => {
    setGeneratingImageIdx(index);
    const updated = [...currentScenes];
    updated[index] = { ...updated[index], status: "generating" };
    setScenes([...updated]);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch("/api/rock/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: currentScenes[index].description, style: currentProject?.artStyle, categorySlug: currentProject?.categorySlug }),
        });
        if (!res.ok) {
          if (attempt < retries) { await new Promise((r) => setTimeout(r, 3000 * (attempt + 1))); continue; }
          throw new Error("Failed after retries");
        }
        const data = await res.json();
        updated[index] = { ...updated[index], imageBase64: data.imageBase64, status: "done" };
        setScenes([...updated]);
        updateProject(id, { scenes: [...updated] });
        break;
      } catch {
        if (attempt === retries) {
          updated[index] = { ...updated[index], status: "error" };
          setScenes([...updated]);
        } else {
          await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
        }
      }
    }
    setGeneratingImageIdx(-1);
    await new Promise((r) => setTimeout(r, 3000));
  };

  const retryImage = async (index: number) => {
    await generateImageForScene(scenes, index);
    updateProject(id, { scenes });
  };

  useEffect(() => {
    if (currentProject?.lyrics && !currentProject?.scenes?.length && !isGenerating && scenes.length === 0) generateScenes();
  }, [currentProject, isGenerating, scenes.length, generateScenes]);

  const completedScenes = scenes.filter((s) => s.status === "done").length;
  const accentColor = categoryConfig?.color || "#8B0000";

  return (
    <>
      <RockSidebar />
      <RockTopNav projectId={id} />
      <main className="ml-0 md:ml-64 pt-20 pb-28 px-4 md:px-6 min-h-screen" style={{ background: "linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%)" }}>
        <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-gray-100 tracking-tight mb-2">Storyboard</h2>
            <p className="text-gray-400 text-lg">{isGenerating ? "AI is visualizing your scenes..." : scenes.length > 0 ? "Review the visuals before animation." : "Click Generate to visualize your lyrics."}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-4 bg-[#1A1A1A] border border-gray-800 px-6 py-3 rounded-2xl">
              <p className="text-gray-200 font-black">{completedScenes}/{scenes.length} images</p>
              <div className="w-32 h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: scenes.length > 0 ? `${(completedScenes / scenes.length) * 100}%` : "0%", background: accentColor }} />
              </div>
            </div>
            {scenes.length > 0 ? (
              <Link href={`/rock/${id}/animation`} className="text-white px-8 py-4 rounded-full font-black flex items-center gap-3 shadow-lg hover:scale-105 active:scale-95 transition-all" style={{ background: `linear-gradient(135deg, ${accentColor}, #D4A017)` }}>
                <span className="material-symbols-outlined filled">bolt</span>PROCEED TO ANIMATION
              </Link>
            ) : (
              <button onClick={generateScenes} disabled={isGenerating} className="text-white px-8 py-4 rounded-full font-black flex items-center gap-3 shadow-lg disabled:opacity-50" style={{ background: accentColor }}>
                <span className={`material-symbols-outlined filled ${isGenerating ? "animate-spin" : ""}`}>{isGenerating ? "progress_activity" : "bolt"}</span>
                {isGenerating ? "GENERATING..." : "GENERATE STORYBOARD"}
              </button>
            )}
          </div>
        </section>

        {error && <div className="mb-6 p-4 bg-red-900/20 border border-red-800/30 rounded-2xl flex items-center justify-between"><p className="text-red-400 font-bold text-sm">{error}</p><button onClick={() => setError(null)} className="material-symbols-outlined text-red-400">close</button></div>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {scenes.length === 0 && isGenerating
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden animate-pulse"><div className="aspect-video bg-gray-800" /><div className="p-4 space-y-2"><div className="h-4 bg-gray-800 rounded w-1/2" /><div className="h-3 bg-gray-800 rounded w-full" /></div></div>)
            : scenes.map((scene, i) => (
                <div key={scene.id} className="group bg-[#111] border border-gray-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#8B0000]/10 transition-all">
                  <div className="relative aspect-video overflow-hidden bg-gray-900">
                    {scene.status === "generating" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"><span className="material-symbols-outlined text-4xl animate-spin" style={{ color: accentColor }}>progress_activity</span><p className="text-sm font-bold text-gray-400">Generating...</p></div>
                    ) : scene.imageBase64 ? (
                      <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={`data:image/png;base64,${scene.imageBase64}`} alt={scene.title} />
                    ) : scene.status === "error" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-950/30">
                        <span className="material-symbols-outlined text-3xl text-red-400">error</span>
                        <button onClick={() => retryImage(i)} disabled={generatingImageIdx >= 0} className="px-4 py-1.5 text-white text-xs font-bold rounded-full hover:opacity-90 disabled:opacity-50" style={{ background: accentColor }}>
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-gray-600">image</span>
                        <button onClick={() => retryImage(i)} disabled={generatingImageIdx >= 0} className="px-4 py-1.5 text-white text-xs font-bold rounded-full hover:opacity-90 disabled:opacity-50" style={{ background: accentColor }}>
                          Generate
                        </button>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full font-bold text-sm">{scene.time}</div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white" style={{ background: `${accentColor}66` }}>{scene.id}</span>
                      <h3 className="font-bold text-lg text-gray-100">{scene.title}</h3>
                    </div>
                    <blockquote className="text-gray-400 italic border-l-4 pl-4 py-1 leading-relaxed text-sm" style={{ borderColor: `${accentColor}66` }}>&ldquo;{scene.lyrics}&rdquo;</blockquote>
                  </div>
                </div>
              ))}
        </div>

        {generatingImageIdx >= 0 && (
          <div className="fixed bottom-8 right-8 bg-[#1A1A1A] border border-gray-700 p-4 rounded-2xl shadow-xl flex items-center gap-4 z-50">
            <span className="material-symbols-outlined animate-spin" style={{ color: accentColor }}>progress_activity</span>
            <div><p className="font-bold text-sm text-gray-200">Scene {generatingImageIdx + 1} of {scenes.length}</p><p className="text-xs text-gray-500">{completedScenes} images complete</p></div>
          </div>
        )}
      </main>
    </>
  );
}
