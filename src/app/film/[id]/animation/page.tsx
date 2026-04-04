"use client";

import FilmSidebar from "@/components/film/FilmSidebar";
import FilmTopNav from "@/components/film/FilmTopNav";
import { useFilm } from "@/context/FilmContext";
import { FilmScene, VideoProvider } from "@/types/film";
import { buildFilmVideoPrompt } from "@/lib/film/prompts";
import { getFilmStyle } from "@/lib/film/styles";
import Link from "next/link";
import { use, useState, useEffect, useCallback, useRef } from "react";

const VOICES = ["Kore", "Zephyr", "Puck", "Charon", "Fenrir", "Leda", "Orus", "Aoede"];

export default function FilmAnimationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentProject, setCurrentProject, updateProject } = useFilm();
  const [scenes, setScenes] = useState<FilmScene[]>([]);
  const scenesRef = useRef<FilmScene[]>([]);
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const [isGeneratingNarrations, setIsGeneratingNarrations] = useState(false);
  const [bgmStatus, setBgmStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [videoProvider, setVideoProvider] = useState<VideoProvider>("veo");
  const [draftMode, setDraftMode] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("Kore");

  useEffect(() => { scenesRef.current = scenes; }, [scenes]);
  useEffect(() => { setCurrentProject(id); }, [id, setCurrentProject]);
  useEffect(() => {
    if (currentProject?.scenes?.length && scenes.length === 0) setScenes(currentProject.scenes);
    if (currentProject?.music?.status === "done" && bgmStatus === "idle") setBgmStatus("done");
    if (currentProject?.videoProvider) setVideoProvider(currentProject.videoProvider);
    if (currentProject?.filmStyle) {
      const style = getFilmStyle(currentProject.filmStyle);
      setSelectedVoice(style.voiceName);
    }
  }, [currentProject]);

  // --- VIDEO ---
  const generateVideoForScene = async (sceneIndex: number) => {
    const scene = scenesRef.current[sceneIndex];
    if (!scene?.imageBase64 && !scene?.imageUrl) return;

    const updateScene = (patch: Partial<FilmScene>) => {
      setScenes((prev) => { const next = [...prev]; next[sceneIndex] = { ...next[sceneIndex], ...patch }; return next; });
    };
    updateScene({ videoStatus: "generating" });
    try {
      const res = await fetch("/api/film/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: scene.imageBase64, imageUrl: scene.imageUrl, prompt: buildFilmVideoPrompt(scene.visualDescription, currentProject?.filmStyle), duration: Math.min(scene.durationEstimate || 6, 10), provider: videoProvider, draft: draftMode }),
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

  // --- NARRATION ---
  const generateNarrationForScene = async (sceneIndex: number) => {
    const scene = scenesRef.current[sceneIndex];
    if (!scene?.narrationText) return;

    const updateScene = (patch: Partial<FilmScene>) => {
      setScenes((prev) => { const next = [...prev]; next[sceneIndex] = { ...next[sceneIndex], ...patch }; return next; });
    };
    updateScene({ narrationStatus: "generating" });
    try {
      const res = await fetch("/api/film/generate-narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scene.narrationText, voiceName: selectedVoice }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      updateScene({ narrationStatus: "done", narrationAudioBase64: data.audioBase64, narrationMimeType: data.mimeType });
    } catch (e: unknown) {
      updateScene({ narrationStatus: "error", narrationError: e instanceof Error ? e.message : "Error" });
    }
    updateProject(id, { scenes: scenesRef.current });
  };

  const generateAllNarrations = async () => {
    setIsGeneratingNarrations(true);
    for (let i = 0; i < scenesRef.current.length; i++) {
      if (scenesRef.current[i].narrationText && scenesRef.current[i].narrationStatus !== "done") {
        await generateNarrationForScene(i);
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    setIsGeneratingNarrations(false);
  };

  // --- BGM ---
  const generateBGM = useCallback(async () => {
    if (!currentProject?.script?.synopsis) return;
    setBgmStatus("generating");
    try {
      const res = await fetch("/api/film/generate-bgm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ synopsis: currentProject.script.synopsis, filmStyleSlug: currentProject.filmStyle }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setBgmStatus("done");
      updateProject(id, { music: { audioBase64: data.audioBase64, mimeType: data.mimeType, status: "done" } });
    } catch { setBgmStatus("error"); }
  }, [currentProject, id, updateProject]);

  const videoDone = scenes.filter((s) => s.videoStatus === "done").length;
  const narrationDone = scenes.filter((s) => s.narrationStatus === "done").length;
  const totalScenes = scenes.filter((s) => s.status === "done").length;
  const allReady = videoDone === totalScenes && narrationDone === totalScenes && totalScenes > 0;

  return (
    <>
      <FilmSidebar />
      <FilmTopNav projectId={id} />
      <main className="ml-0 md:ml-64 pt-20 pb-8 px-4 md:px-6 min-h-screen">
        {/* Header */}
        <section className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-on-surface tracking-tight mb-2">Animation & Voice</h2>
            <p className="text-on-surface-variant text-lg">Generate video clips, narration, and background music.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-bold text-on-surface">{videoDone}/{totalScenes} videos</p>
              <p className="font-bold text-violet-600">{narrationDone}/{totalScenes} narrations</p>
            </div>
            {allReady ? (
              <Link href={`/film/${id}/editor`} className="bg-violet-600 text-white px-8 py-4 rounded-full font-black flex items-center gap-3 shadow-lg hover:scale-105 active:scale-95 transition-all">
                <span className="material-symbols-outlined filled">movie_edit</span>PROCEED TO EDITOR
              </Link>
            ) : null}
          </div>
        </section>

        {error && <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-2xl"><p className="text-error font-bold text-sm">{error}</p></div>}

        {/* Video Provider + Narration Voice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-500">videocam</span>Video Model
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <button onClick={() => { setVideoProvider("veo"); updateProject(id, { videoProvider: "veo" }); }} className={`px-4 py-2 rounded-full text-sm font-bold ${videoProvider === "veo" ? "bg-violet-600 text-white" : "bg-surface-container-high text-on-surface-variant"}`}>Veo 3.1 Lite</button>
              <button onClick={() => { setVideoProvider("p-video"); updateProject(id, { videoProvider: "p-video" }); }} className={`px-4 py-2 rounded-full text-sm font-bold ${videoProvider === "p-video" ? "bg-violet-600 text-white" : "bg-surface-container-high text-on-surface-variant"}`}>P-Video (Fast)</button>
              {videoProvider === "p-video" && (
                <label className="flex items-center gap-2 ml-2 cursor-pointer"><input type="checkbox" checked={draftMode} onChange={(e) => setDraftMode(e.target.checked)} className="w-4 h-4 accent-violet-600" /><span className="text-sm font-bold text-on-surface-variant">Draft</span></label>
              )}
            </div>
            <button onClick={generateAllVideos} disabled={isGeneratingVideos || totalScenes === 0} className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              <span className={`material-symbols-outlined ${isGeneratingVideos ? "animate-spin" : ""}`}>{isGeneratingVideos ? "progress_activity" : "bolt"}</span>
              {isGeneratingVideos ? "Generating Videos..." : "Generate All Videos"}
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-500">record_voice_over</span>Narration Voice
            </h3>
            <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full mb-3 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface font-bold text-sm border-none">
              {VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <button onClick={generateAllNarrations} disabled={isGeneratingNarrations || totalScenes === 0} className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              <span className={`material-symbols-outlined ${isGeneratingNarrations ? "animate-spin" : ""}`}>{isGeneratingNarrations ? "progress_activity" : "mic"}</span>
              {isGeneratingNarrations ? "Generating Narrations..." : "Generate All Narrations"}
            </button>
          </div>
        </div>

        {/* BGM */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-500">music_note</span>Background Music (Optional)
            </h3>
            <button onClick={generateBGM} disabled={bgmStatus === "generating"} className="px-6 py-2 bg-surface-container-high text-on-surface-variant rounded-full font-bold text-sm hover:bg-surface-container-highest disabled:opacity-50">
              {bgmStatus === "generating" ? "Generating..." : bgmStatus === "done" ? "Regenerate" : "Generate BGM"}
            </button>
          </div>
          {bgmStatus === "done" && currentProject?.music?.audioBase64 && (
            <audio controls className="w-full mt-3 h-8" src={`data:${currentProject.music.mimeType};base64,${currentProject.music.audioBase64}`} />
          )}
        </div>

        {/* Scene Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {scenes.map((scene) => (
            <div key={scene.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
              <div className="relative aspect-video bg-surface-container-high">
                {scene.imageBase64 ? <img className="w-full h-full object-cover" src={`data:image/png;base64,${scene.imageBase64}`} alt={scene.title} /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-4xl opacity-50">image</span></div>}
                <div className="absolute top-2 left-2 flex gap-1">
                  {scene.videoStatus === "done" && <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Video</span>}
                  {scene.videoStatus === "generating" && <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">Video...</span>}
                  {scene.narrationStatus === "done" && <span className="bg-violet-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Voice</span>}
                  {scene.narrationStatus === "generating" && <span className="bg-violet-400 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">Voice...</span>}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black text-xs">{scene.id}</span>
                  <h4 className="font-bold text-sm text-on-surface">{scene.title}</h4>
                  <span className="text-xs text-on-surface-variant ml-auto">{scene.durationEstimate}s</span>
                </div>
                <p className="text-xs text-on-surface-variant italic line-clamp-2">&ldquo;{scene.narrationText}&rdquo;</p>
                {scene.narrationStatus === "done" && scene.narrationAudioBase64 && (
                  <audio controls className="w-full mt-2 h-7" src={`data:${scene.narrationMimeType || "audio/wav"};base64,${scene.narrationAudioBase64}`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
