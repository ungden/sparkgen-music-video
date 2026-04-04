"use client";

import FilmSidebar from "@/components/film/FilmSidebar";
import FilmTopNav from "@/components/film/FilmTopNav";
import { useFilm } from "@/context/FilmContext";
import { FilmScene } from "@/types/film";
import { use, useState, useEffect, useRef } from "react";

export default function FilmEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentProject, setCurrentProject, updateProject } = useFilm();
  const [selectedScene, setSelectedScene] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { setCurrentProject(id); }, [id, setCurrentProject]);

  const scenes: FilmScene[] = currentProject?.scenes?.filter((s) => s.status === "done") || [];
  const activeScene = scenes[selectedScene] || null;
  const hasBGM = currentProject?.music?.status === "done" && currentProject.music.audioBase64;
  const videosReady = scenes.filter((s) => s.videoStatus === "done").length;
  const narrationsReady = scenes.filter((s) => s.narrationStatus === "done").length;

  const handleRender = async () => {
    if (!scenes.length) { showToast("No scenes to render."); return; }
    setIsRendering(true);
    setRenderProgress("Preparing scenes...");
    try {
      const renderScenes = scenes.filter((s) => s.videoUrl).map((s) => ({
        id: s.id, videoUrl: s.videoUrl || "", narrationText: s.narrationText,
        narrationAudioBase64: s.narrationAudioBase64, narrationMimeType: s.narrationMimeType, durationEstimate: s.durationEstimate,
      }));
      if (renderScenes.length === 0) { showToast("No videos ready. Generate videos first."); setIsRendering(false); return; }

      setRenderProgress(`Compositing ${renderScenes.length} scenes + narration...`);
      const res = await fetch("/api/film/render-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenes: renderScenes, bgmAudioBase64: currentProject?.music?.audioBase64, bgmMimeType: currentProject?.music?.mimeType, bgmVolume: 0.25 }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.fallback) {
          setRenderProgress("Downloading clips...");
          for (const clip of data.clips || []) {
            const a = document.createElement("a");
            a.href = clip.videoUrl; a.download = `scene-${clip.id}.mp4`; a.target = "_blank";
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }
          updateProject(id, { status: "finished" });
          showToast(`Downloaded ${data.clips?.length || 0} clips individually.`);
          setIsRendering(false); setRenderProgress(""); return;
        }
        if (data.error) throw new Error(data.error);
      }
      if (!res.ok) throw new Error("Render failed");

      setRenderProgress("Downloading...");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentProject?.title || "short-film"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      updateProject(id, { status: "finished" });
      showToast("Film rendered and downloaded!");
    } catch (e: unknown) {
      showToast(`Error: ${e instanceof Error ? e.message : "Render failed"}`);
    } finally { setIsRendering(false); setRenderProgress(""); }
  };

  return (
    <>
      <FilmSidebar />
      <FilmTopNav projectId={id} />
      <main className="ml-0 md:ml-64 pt-20 h-screen flex flex-col overflow-hidden">
        <div className="flex flex-1 min-h-0 p-4 md:p-6 gap-4 md:gap-6 flex-col md:flex-row">
          {/* Video Canvas */}
          <div className="flex-[3] flex flex-col gap-4">
            <div className="relative flex-1 bg-on-background rounded-xl overflow-hidden shadow-2xl group min-h-[300px]">
              {activeScene?.imageBase64 ? (
                <img className="w-full h-full object-cover opacity-80" src={`data:image/png;base64,${activeScene.imageBase64}`} alt={activeScene.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50 text-center">
                  <div><span className="material-symbols-outlined text-6xl mb-4">movie</span><p className="font-bold">No scenes available</p></div>
                </div>
              )}
              {activeScene && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-sm font-bold">Scene {selectedScene + 1}: {activeScene.title}</p>
                  <p className="text-white/70 text-xs italic">&ldquo;{activeScene.narrationText?.slice(0, 100)}&rdquo;</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {scenes.map((scene, i) => (
                <div key={scene.id} onClick={() => setSelectedScene(i)} className={`flex-none w-32 aspect-video rounded-lg relative overflow-hidden cursor-pointer ${selectedScene === i ? "border-2 border-violet-500" : "bg-surface-container-low"}`}>
                  {scene.imageBase64 && <img className={`w-full h-full object-cover ${selectedScene === i ? "" : "opacity-60"}`} src={`data:image/png;base64,${scene.imageBase64}`} alt="" />}
                  {selectedScene === i && <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-500" />}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex-1 min-w-[280px] bg-surface-container-low rounded-xl p-6 flex flex-col gap-4">
            <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-500">movie_edit</span>Film Preview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl"><span className="text-sm text-on-surface-variant">Scenes</span><span className="font-bold">{scenes.length}</span></div>
              <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl"><span className="text-sm text-on-surface-variant">Videos</span><span className={`font-bold ${videosReady === scenes.length && scenes.length > 0 ? "text-green-600" : ""}`}>{videosReady}/{scenes.length}</span></div>
              <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl"><span className="text-sm text-on-surface-variant">Narrations</span><span className={`font-bold ${narrationsReady === scenes.length && scenes.length > 0 ? "text-violet-600" : ""}`}>{narrationsReady}/{scenes.length}</span></div>
              <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl"><span className="text-sm text-on-surface-variant">BGM</span><span className={`font-bold ${hasBGM ? "text-green-600" : "text-on-surface-variant"}`}>{hasBGM ? "Ready" : "Optional"}</span></div>
            </div>
            {hasBGM && currentProject?.music?.audioBase64 && (
              <audio ref={audioRef} controls className="w-full h-8" src={`data:${currentProject.music.mimeType};base64,${currentProject.music.audioBase64}`} />
            )}
            <div className="mt-auto space-y-3">
              {isRendering && <div className="p-3 bg-violet-50 rounded-xl text-center"><span className="material-symbols-outlined text-violet-500 animate-spin">progress_activity</span><p className="text-xs font-bold text-violet-600 mt-1">{renderProgress}</p></div>}
              <button onClick={handleRender} disabled={isRendering || videosReady === 0} className="w-full py-5 bg-gradient-to-br from-violet-600 to-violet-400 text-white font-black rounded-2xl shadow-xl flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                <span className="material-symbols-outlined text-3xl">{isRendering ? "progress_activity" : "rocket_launch"}</span>
                {isRendering ? "RENDERING..." : "RENDER & DOWNLOAD"}
                <span className="text-[10px] font-bold opacity-70">{videosReady} clips + {narrationsReady} narrations</span>
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="h-40 bg-surface-container border-t-2 border-surface-container-high p-4 flex flex-col gap-2">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Timeline</span>
          <div className="flex-1 bg-surface-container-low rounded-xl relative overflow-hidden flex flex-col p-2 gap-1.5 shadow-inner">
            <div className="flex gap-1 h-10">
              <div className="w-16 md:w-20 flex items-center justify-center bg-white/50 rounded-lg text-[10px] font-black text-on-surface-variant uppercase shrink-0">Video</div>
              <div className="flex-1 flex gap-0.5">{scenes.map((s, i) => (
                <div key={s.id} onClick={() => setSelectedScene(i)} className={`h-full rounded-md border-2 flex items-center justify-center cursor-pointer ${selectedScene === i ? "bg-violet-100 border-violet-500" : "bg-violet-50 border-violet-200"}`} style={{ width: `${100 / scenes.length}%` }}>
                  <span className="text-[10px] font-bold">{s.videoStatus === "done" ? "ok" : `S${s.id}`}</span>
                </div>
              ))}</div>
            </div>
            <div className="flex gap-1 h-8">
              <div className="w-16 md:w-20 flex items-center justify-center bg-white/50 rounded-lg text-[10px] font-black text-on-surface-variant uppercase shrink-0">Voice</div>
              <div className="flex-1 flex gap-0.5">{scenes.map((s) => (
                <div key={s.id} className={`h-full rounded-md flex items-center justify-center ${s.narrationStatus === "done" ? "bg-violet-200 border border-violet-300" : "bg-surface-container-high border border-dashed border-outline-variant"}`} style={{ width: `${100 / scenes.length}%` }}>
                  <span className="text-[9px] font-bold text-on-surface-variant">{s.narrationStatus === "done" ? "ok" : "-"}</span>
                </div>
              ))}</div>
            </div>
            <div className="flex gap-1 h-7">
              <div className="w-16 md:w-20 flex items-center justify-center bg-white/50 rounded-lg text-[10px] font-black text-on-surface-variant uppercase shrink-0">BGM</div>
              <div className={`flex-1 rounded-md flex items-center px-4 ${hasBGM ? "bg-green-100 border border-green-200" : "bg-surface-container-high border border-dashed border-outline-variant"}`}>
                <span className="text-[10px] font-bold text-on-surface-variant">{hasBGM ? "Background Score" : "No BGM"}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      {toast && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-violet-600 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm flex items-center gap-2"><span className="material-symbols-outlined filled text-sm">check_circle</span>{toast}</div>}
    </>
  );
}
