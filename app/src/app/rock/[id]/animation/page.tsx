"use client";

import RockSidebar from "@/components/rock/RockSidebar";
import RockTopNav from "@/components/rock/RockTopNav";
import { useRock } from "@/context/RockContext";
import { RockScene, VideoProvider } from "@/types/rock";
import { getRockCategory } from "@/lib/rock-categories";
import Link from "next/link";
import { use, useState, useEffect, useCallback, useRef } from "react";

export default function RockAnimationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentProject, setCurrentProject, updateProject } = useRock();
  const [scenes, setScenes] = useState<RockScene[]>([]);
  const scenesRef = useRef<RockScene[]>([]);
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoProvider, setVideoProvider] = useState<VideoProvider>("veo");
  const [draftMode, setDraftMode] = useState(false);

  const categoryConfig = currentProject?.categorySlug ? getRockCategory(currentProject.categorySlug) : null;
  const accentColor = categoryConfig?.color || "#8B0000";

  useEffect(() => { scenesRef.current = scenes; }, [scenes]);
  useEffect(() => { setCurrentProject(id); }, [id, setCurrentProject]);
  useEffect(() => {
    if (currentProject?.scenes?.length && scenes.length === 0) setScenes(currentProject.scenes);
    if (currentProject?.videoProvider) setVideoProvider(currentProject.videoProvider);
  }, [currentProject, scenes.length]);

  // --- VIDEO ---
  const generateVideoForScene = async (sceneIndex: number) => {
    const scene = scenesRef.current[sceneIndex];
    if (!scene?.imageBase64 && !scene?.imageUrl) return;

    const updateScene = (patch: Partial<RockScene>) => {
      setScenes((prev) => { const next = [...prev]; next[sceneIndex] = { ...next[sceneIndex], ...patch }; return next; });
    };
    updateScene({ videoStatus: "generating" });
    try {
      const res = await fetch("/api/rock/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: scene.imageBase64,
          imageUrl: scene.imageUrl,
          prompt: scene.description,
          categorySlug: currentProject?.categorySlug,
          provider: videoProvider,
          draft: draftMode,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      updateScene({ videoStatus: "done", videoFileName: data.videoFileName, videoUrl: data.videoUrl });
    } catch (e: unknown) {
      updateScene({ videoStatus: "error", videoError: e instanceof Error ? e.message : "Error" });
    }
    updateProject(id, { scenes: scenesRef.current });
  };

  const generateAllVideos = async () => {
    setIsGeneratingVideos(true);
    setError(null);
    for (let i = 0; i < scenesRef.current.length; i++) {
      const s = scenesRef.current[i];
      if (s.status === "done" && (s.imageBase64 || s.imageUrl) && s.videoStatus !== "done") {
        await generateVideoForScene(i);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    setIsGeneratingVideos(false);
  };

  // --- MUSIC ---
  const generateMusic = useCallback(async () => {
    if (!currentProject?.lyrics) return;
    setIsGeneratingMusic(true);
    try {
      const res = await fetch("/api/rock/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lyrics: currentProject.lyrics,
          categorySlug: currentProject.categorySlug,
          themeTitle: currentProject.selectedTheme?.title,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      updateProject(id, { music: { audioBase64: data.audioBase64, mimeType: data.mimeType, status: "done" } });
    } catch (e: unknown) {
      updateProject(id, { music: { status: "error", error: e instanceof Error ? e.message : "Failed" } });
    } finally {
      setIsGeneratingMusic(false);
    }
  }, [currentProject, id, updateProject]);

  const videoDone = scenes.filter((s) => s.videoStatus === "done").length;
  const totalScenes = scenes.filter((s) => s.status === "done").length;
  const musicReady = currentProject?.music?.status === "done";
  const allReady = videoDone === totalScenes && totalScenes > 0;

  return (
    <>
      <RockSidebar />
      <RockTopNav projectId={id} />
      <main className="ml-0 md:ml-64 pt-20 pb-8 px-4 md:px-6 min-h-screen" style={{ background: "linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%)" }}>
        {/* Header */}
        <section className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-gray-100 tracking-tight mb-2">Animation & Music</h2>
            <p className="text-gray-400 text-lg">Generate video clips and the rock track for your music video.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-bold text-gray-200">{videoDone}/{totalScenes} videos</p>
              <p className="font-bold" style={{ color: "#D4A017" }}>{musicReady ? "Music ready" : "Music pending"}</p>
            </div>
            {allReady ? (
              <Link href={`/rock/${id}/editor`} className="text-white px-8 py-4 rounded-full font-black flex items-center gap-3 shadow-lg hover:scale-105 active:scale-95 transition-all" style={{ background: `linear-gradient(135deg, ${accentColor}, #D4A017)` }}>
                <span className="material-symbols-outlined filled">movie_edit</span>PROCEED TO EDITOR
              </Link>
            ) : null}
          </div>
        </section>

        {error && <div className="mb-6 p-4 bg-red-900/20 border border-red-800/30 rounded-2xl"><p className="text-red-400 font-bold text-sm">{error}</p></div>}

        {/* Video Provider + Music */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-black text-gray-200 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: accentColor }}>videocam</span>Video Model
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <button onClick={() => { setVideoProvider("veo"); updateProject(id, { videoProvider: "veo" }); }} className={`px-4 py-2 rounded-full text-sm font-bold border ${videoProvider === "veo" ? "text-white border-transparent" : "bg-transparent border-gray-700 text-gray-400"}`} style={videoProvider === "veo" ? { background: accentColor } : {}}>Veo 3.1 Lite</button>
              <button onClick={() => { setVideoProvider("p-video"); updateProject(id, { videoProvider: "p-video" }); }} className={`px-4 py-2 rounded-full text-sm font-bold border ${videoProvider === "p-video" ? "text-white border-transparent" : "bg-transparent border-gray-700 text-gray-400"}`} style={videoProvider === "p-video" ? { background: accentColor } : {}}>P-Video (Fast)</button>
              {videoProvider === "p-video" && (
                <label className="flex items-center gap-2 ml-2 cursor-pointer"><input type="checkbox" checked={draftMode} onChange={(e) => setDraftMode(e.target.checked)} className="w-4 h-4 accent-[#8B0000]" /><span className="text-sm font-bold text-gray-400">Draft</span></label>
              )}
            </div>
            <button onClick={generateAllVideos} disabled={isGeneratingVideos || totalScenes === 0} className="w-full py-3 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: accentColor }}>
              <span className={`material-symbols-outlined ${isGeneratingVideos ? "animate-spin" : ""}`}>{isGeneratingVideos ? "progress_activity" : "bolt"}</span>
              {isGeneratingVideos ? "Generating Videos..." : "Generate All Videos"}
            </button>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-black text-gray-200 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: "#D4A017" }}>music_note</span>Rock Music Track
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              {categoryConfig ? `${categoryConfig.musicSpec.genre} - ${categoryConfig.musicSpec.tempo}` : "Select category first"}
            </p>
            <button onClick={generateMusic} disabled={isGeneratingMusic} className="w-full py-3 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: "#D4A017", color: "#1A1A1A" }}>
              <span className={`material-symbols-outlined ${isGeneratingMusic ? "animate-spin" : ""}`}>{isGeneratingMusic ? "progress_activity" : "music_note"}</span>
              {isGeneratingMusic ? "Generating Track..." : musicReady ? "Regenerate Track" : "Generate Rock Track"}
            </button>
            {musicReady && currentProject?.music?.audioBase64 && (
              <audio controls className="w-full mt-3 h-8" src={`data:${currentProject.music.mimeType};base64,${currentProject.music.audioBase64}`} />
            )}
            {currentProject?.music?.status === "error" && (
              <p className="text-red-400 text-xs mt-2">Failed to generate music. Try again.</p>
            )}
          </div>
        </div>

        {/* Scene Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {scenes.map((scene) => (
            <div key={scene.id} className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="relative aspect-video bg-gray-900">
                {scene.imageBase64 ? <img className="w-full h-full object-cover" src={`data:image/png;base64,${scene.imageBase64}`} alt={scene.title} /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-4xl text-gray-700">image</span></div>}
                <div className="absolute top-2 left-2 flex gap-1">
                  {scene.videoStatus === "done" && <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Video</span>}
                  {scene.videoStatus === "generating" && <span className="text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse" style={{ background: "#D4A017" }}>Video...</span>}
                  {scene.videoStatus === "error" && <button onClick={() => generateVideoForScene(scene.id - 1)} className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold hover:bg-red-700">Retry Video</button>}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs text-white" style={{ background: `${accentColor}88` }}>{scene.id}</span>
                  <h4 className="font-bold text-sm text-gray-200">{scene.title}</h4>
                </div>
                <p className="text-xs text-gray-500 italic line-clamp-2">&ldquo;{scene.lyrics}&rdquo;</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
