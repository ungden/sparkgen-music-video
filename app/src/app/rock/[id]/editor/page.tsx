"use client";

import RockSidebar from "@/components/rock/RockSidebar";
import RockTopNav from "@/components/rock/RockTopNav";
import { useRock } from "@/context/RockContext";
import { RockScene } from "@/types/rock";
import { getRockCategory } from "@/lib/rock-categories";
import { renderFilmClient, downloadBlob } from "@/lib/client-render";
import { use, useState, useEffect, useRef } from "react";

export default function RockEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentProject, setCurrentProject, updateProject } = useRock();
  const [selectedScene, setSelectedScene] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const categoryConfig = currentProject?.categorySlug ? getRockCategory(currentProject.categorySlug) : null;
  const accentColor = categoryConfig?.color || "#8B0000";

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { setCurrentProject(id); }, [id, setCurrentProject]);

  const scenes: RockScene[] = currentProject?.scenes?.filter((s) => s.status === "done") || [];
  const activeScene = scenes[selectedScene] || null;
  const hasMusic = currentProject?.music?.status === "done" && currentProject.music.audioBase64;
  const videosReady = scenes.filter((s) => s.videoStatus === "done").length;

  const handleRender = async () => {
    if (!scenes.length) { showToast("No scenes to render."); return; }
    setIsRendering(true);
    setRenderProgress("Preparing...");
    try {
      const clips = scenes.filter((s) => s.videoUrl).map((s) => ({
        id: s.id,
        videoUrl: s.videoUrl || "",
      }));
      if (clips.length === 0) { showToast("No videos ready."); setIsRendering(false); return; }

      const blob = await renderFilmClient({
        clips,
        bgmBase64: currentProject?.music?.audioBase64,
        bgmMimeType: currentProject?.music?.mimeType,
        bgmVolume: 0.8,
        onProgress: setRenderProgress,
      });

      downloadBlob(blob, `${currentProject?.title || "rock-video"}.mp4`);
      updateProject(id, { status: "finished" });
      showToast("Rock video rendered and downloaded!");
    } catch (e: unknown) {
      showToast(`Error: ${e instanceof Error ? e.message : "Render failed"}`);
    } finally { setIsRendering(false); setRenderProgress(""); }
  };

  return (
    <>
      <RockSidebar />
      <RockTopNav projectId={id} />
      <main className="ml-0 md:ml-64 pt-20 h-screen flex flex-col overflow-hidden" style={{ background: "#0D0D0D" }}>
        <div className="flex flex-1 min-h-0 p-4 md:p-6 gap-4 md:gap-6 flex-col md:flex-row">
          {/* Video Canvas */}
          <div className="flex-[3] flex flex-col gap-4">
            <div className="relative flex-1 bg-black rounded-xl overflow-hidden shadow-2xl group min-h-[300px] border border-gray-800">
              {activeScene?.imageBase64 ? (
                <img className="w-full h-full object-cover opacity-80" src={`data:image/png;base64,${activeScene.imageBase64}`} alt={activeScene.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-center">
                  <div><span className="material-symbols-outlined text-6xl mb-4">music_video</span><p className="font-bold">No scenes available</p></div>
                </div>
              )}
              {activeScene && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                  <p className="text-white text-sm font-bold">Scene {selectedScene + 1}: {activeScene.title}</p>
                  <p className="text-white/60 text-xs italic">&ldquo;{activeScene.lyrics?.slice(0, 100)}&rdquo;</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {scenes.map((scene, i) => (
                <div key={scene.id} onClick={() => setSelectedScene(i)} className={`flex-none w-32 aspect-video rounded-lg relative overflow-hidden cursor-pointer border-2 ${selectedScene === i ? "" : "border-gray-800 opacity-60"}`} style={selectedScene === i ? { borderColor: accentColor } : {}}>
                  {scene.imageBase64 && <img className="w-full h-full object-cover" src={`data:image/png;base64,${scene.imageBase64}`} alt="" />}
                  {selectedScene === i && <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accentColor }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex-1 min-w-[280px] bg-[#111] border border-gray-800 rounded-xl p-6 flex flex-col gap-4">
            <h3 className="text-lg font-extrabold text-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: accentColor }}>movie_edit</span>Rock Video Preview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#0D0D0D] border border-gray-800 rounded-xl"><span className="text-sm text-gray-500">Scenes</span><span className="font-bold text-gray-200">{scenes.length}</span></div>
              <div className="flex items-center justify-between p-3 bg-[#0D0D0D] border border-gray-800 rounded-xl"><span className="text-sm text-gray-500">Videos</span><span className={`font-bold ${videosReady === scenes.length && scenes.length > 0 ? "text-green-500" : "text-gray-400"}`}>{videosReady}/{scenes.length}</span></div>
              <div className="flex items-center justify-between p-3 bg-[#0D0D0D] border border-gray-800 rounded-xl"><span className="text-sm text-gray-500">Music</span><span className="font-bold" style={{ color: hasMusic ? "#D4A017" : "#666" }}>{hasMusic ? "Ready" : "Pending"}</span></div>
            </div>
            {hasMusic && currentProject?.music?.audioBase64 && (
              <audio ref={audioRef} controls className="w-full h-8" src={`data:${currentProject.music.mimeType};base64,${currentProject.music.audioBase64}`} />
            )}
            <div className="mt-auto space-y-3">
              {isRendering && <div className="p-3 rounded-xl text-center" style={{ background: `${accentColor}22` }}><span className="material-symbols-outlined animate-spin" style={{ color: accentColor }}>progress_activity</span><p className="text-xs font-bold mt-1" style={{ color: accentColor }}>{renderProgress}</p></div>}
              <button onClick={handleRender} disabled={isRendering || videosReady === 0} className="w-full py-5 text-white font-black rounded-2xl shadow-xl flex flex-col items-center justify-center gap-1 disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${accentColor}, #D4A017)` }}>
                <span className="material-symbols-outlined text-3xl">{isRendering ? "progress_activity" : "rocket_launch"}</span>
                {isRendering ? "RENDERING..." : "RENDER & DOWNLOAD"}
                <span className="text-[10px] font-bold opacity-70">{videosReady} clips + music track</span>
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="h-36 bg-[#111] border-t-2 border-gray-800 p-4 flex flex-col gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Timeline</span>
          <div className="flex-1 bg-[#0D0D0D] rounded-xl relative overflow-hidden flex flex-col p-2 gap-1.5 shadow-inner border border-gray-800">
            <div className="flex gap-1 h-10">
              <div className="w-16 md:w-20 flex items-center justify-center bg-gray-800/50 rounded-lg text-[10px] font-black text-gray-500 uppercase shrink-0">Video</div>
              <div className="flex-1 flex gap-0.5">{scenes.map((s, i) => (
                <div key={s.id} onClick={() => setSelectedScene(i)} className="h-full rounded-md border-2 flex items-center justify-center cursor-pointer" style={{ width: `${100 / scenes.length}%`, background: selectedScene === i ? `${accentColor}33` : `${accentColor}11`, borderColor: selectedScene === i ? accentColor : `${accentColor}44` }}>
                  <span className="text-[10px] font-bold text-gray-400">{s.videoStatus === "done" ? "ok" : `S${s.id}`}</span>
                </div>
              ))}</div>
            </div>
            <div className="flex gap-1 h-7">
              <div className="w-16 md:w-20 flex items-center justify-center bg-gray-800/50 rounded-lg text-[10px] font-black text-gray-500 uppercase shrink-0">Music</div>
              <div className={`flex-1 rounded-md flex items-center px-4 border ${hasMusic ? "border-[#D4A017]/30" : "border-gray-800 border-dashed"}`} style={hasMusic ? { background: "#D4A01722" } : {}}>
                <span className="text-[10px] font-bold text-gray-500">{hasMusic ? "Rock Track" : "No Music"}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      {toast && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl font-bold text-sm flex items-center gap-2 text-white" style={{ background: accentColor }}><span className="material-symbols-outlined filled text-sm">check_circle</span>{toast}</div>}
    </>
  );
}
