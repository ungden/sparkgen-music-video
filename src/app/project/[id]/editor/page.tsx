"use client";

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { useProject } from "@/context/ProjectContext";
import { Scene } from "@/types/project";
import { use, useState, useEffect, useRef } from "react";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentProject, setCurrentProject, updateProject } = useProject();
  const [selectedScene, setSelectedScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setCurrentProject(id);
  }, [id, setCurrentProject]);

  const scenes: Scene[] = currentProject?.scenes?.filter((s) => s.status === "done") || [];
  const activeScene = scenes[selectedScene] || null;
  const hasMusic = currentProject?.music?.status === "done" && currentProject.music.audioBase64;
  const videosReady = scenes.filter((s) => s.videoStatus === "done").length;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleRender = async () => {
    if (!scenes.length) {
      showToast("No scenes to render. Complete previous steps first.");
      return;
    }

    setIsRendering(true);
    setRenderProgress("Preparing scenes...");

    try {
      const renderScenes = scenes
        .filter((s) => s.videoUrl || s.videoFileName)
        .map((s) => ({
          id: s.id,
          videoUrl: s.videoUrl || s.videoFileName || "",
          time: s.time,
          lyrics: s.lyrics,
        }));

      if (renderScenes.length === 0) {
        showToast("No rendered videos found. Generate videos in the Animation step first.");
        setIsRendering(false);
        return;
      }

      setRenderProgress(`Compositing ${renderScenes.length} scenes + audio...`);

      const res = await fetch("/api/render-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: renderScenes,
          musicAudioBase64: currentProject?.music?.audioBase64,
          musicMimeType: currentProject?.music?.mimeType,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      // Handle fallback (no FFmpeg on server)
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.fallback) {
          setRenderProgress("Downloading individual clips...");
          for (const clip of data.clips || []) {
            const a = document.createElement("a");
            a.href = clip.videoUrl;
            a.download = `scene-${clip.id}.mp4`;
            a.target = "_blank";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
          updateProject(id, { status: "finished" });
          showToast(`Downloaded ${data.clips?.length || 0} clips. Combine them with a video editor.`);
          setIsRendering(false);
          setRenderProgress("");
          return;
        }
        if (data.error) throw new Error(data.error);
      }

      if (!res.ok) throw new Error("Failed to render video");

      setRenderProgress("Downloading final video...");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentProject?.title || "music-video"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      updateProject(id, { status: "finished", renderStatus: "done", renderedAt: new Date().toISOString() });
      showToast("Video rendered and downloaded!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Render failed";
      showToast(`Error: ${msg}`);
      updateProject(id, { renderStatus: "error", renderError: msg });
    } finally {
      setIsRendering(false);
      setRenderProgress("");
    }
  };

  return (
    <>
      <Sidebar />
      <TopNav projectId={id} />
      <main className="ml-0 md:ml-64 pt-20 h-screen flex flex-col overflow-hidden">
        {/* Workspace */}
        <div className="flex flex-1 min-h-0 p-4 md:p-6 gap-4 md:gap-6 flex-col md:flex-row">
          {/* Video Player Canvas */}
          <div className="flex-[3] flex flex-col gap-4">
            <div className="relative flex-1 bg-on-background rounded-xl overflow-hidden shadow-2xl group min-h-[300px]">
              {activeScene?.imageBase64 ? (
                <img
                  className="w-full h-full object-cover opacity-80"
                  src={`data:image/png;base64,${activeScene.imageBase64}`}
                  alt={activeScene.title}
                />
              ) : activeScene?.imageUrl ? (
                <img
                  className="w-full h-full object-cover opacity-80"
                  src={activeScene.imageUrl}
                  alt={activeScene.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-6xl mb-4">movie</span>
                    <p className="font-bold">No scenes available</p>
                    <p className="text-sm mt-2">Complete the previous steps first</p>
                  </div>
                </div>
              )}
              {/* Overlay Controls */}
              {activeScene && (
                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-on-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlay}
                        className="w-12 h-12 flex items-center justify-center bg-white text-primary rounded-full transition-transform active:scale-90"
                      >
                        <span className="material-symbols-outlined filled text-3xl">
                          {isPlaying ? "pause" : "play_arrow"}
                        </span>
                      </button>
                      <div className="text-white">
                        <p className="text-sm font-bold">{activeScene.time}</p>
                        <p className="text-xs opacity-70">Scene {selectedScene + 1}: {activeScene.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Badge */}
              {activeScene?.videoStatus === "done" && (
                <div className="absolute top-4 left-4 bg-tertiary-container/90 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 border border-tertiary/20">
                  <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider">Video Ready</span>
                </div>
              )}
            </div>

            {/* Scene Quick Select */}
            <div className="flex gap-3 overflow-x-auto pb-2 px-1 hide-scrollbar">
              {scenes.map((scene, i) => (
                <div
                  key={scene.id}
                  onClick={() => setSelectedScene(i)}
                  className={`flex-none w-32 aspect-video rounded-lg relative overflow-hidden cursor-pointer group ${
                    selectedScene === i ? "border-2 border-primary bg-surface-container-highest" : "bg-surface-container-low"
                  }`}
                >
                  {scene.imageBase64 ? (
                    <img
                      className={`w-full h-full object-cover ${selectedScene === i ? "" : "opacity-60 group-hover:opacity-100"}`}
                      src={`data:image/png;base64,${scene.imageBase64}`}
                      alt={scene.title}
                    />
                  ) : scene.imageUrl ? (
                    <img
                      className={`w-full h-full object-cover ${selectedScene === i ? "" : "opacity-60 group-hover:opacity-100"}`}
                      src={scene.imageUrl}
                      alt={scene.title}
                    />
                  ) : null}
                  {selectedScene === i && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />}
                  {scene.videoStatus === "done" && selectedScene !== i && (
                    <div className="absolute top-1 right-1 bg-tertiary rounded-full w-4 h-4 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[10px]">check</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Audio & Render Sidebar */}
          <div className="flex-1 min-w-[280px] bg-surface-container-low rounded-xl p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-extrabold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">library_music</span>
                Audio &amp; Preview
              </h3>

              {/* Audio Player */}
              {hasMusic && currentProject?.music?.audioBase64 && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined filled text-primary text-sm">music_note</span>
                    <span className="text-xs font-bold text-primary">AI Generated Soundtrack</span>
                  </div>
                  <audio
                    ref={audioRef}
                    controls
                    className="w-full h-8"
                    src={`data:${currentProject.music.mimeType};base64,${currentProject.music.audioBase64}`}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>
              )}

              {/* Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl">
                  <span className="text-sm text-on-surface-variant">Scenes</span>
                  <span className="font-bold text-on-surface">{scenes.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl">
                  <span className="text-sm text-on-surface-variant">Videos Ready</span>
                  <span className={`font-bold ${videosReady === scenes.length && scenes.length > 0 ? "text-tertiary" : "text-on-surface"}`}>
                    {videosReady} / {scenes.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl">
                  <span className="text-sm text-on-surface-variant">Music</span>
                  <span className={`font-bold ${hasMusic ? "text-tertiary" : "text-error"}`}>
                    {hasMusic ? "Ready" : "Not generated"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              {isRendering && (
                <div className="p-3 bg-tertiary/10 border border-tertiary/20 rounded-xl text-center">
                  <span className="material-symbols-outlined text-tertiary animate-spin text-xl">progress_activity</span>
                  <p className="text-xs font-bold text-tertiary mt-1">{renderProgress}</p>
                </div>
              )}
              <button
                onClick={handleRender}
                disabled={isRendering || scenes.length === 0}
                className="w-full py-5 bg-gradient-to-br from-secondary to-secondary-container text-on-secondary-container font-black rounded-2xl shadow-xl shadow-secondary/20 flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                <span className="material-symbols-outlined text-3xl">
                  {isRendering ? "progress_activity" : "rocket_launch"}
                </span>
                {isRendering ? "RENDERING..." : "RENDER & DOWNLOAD"}
                <span className="text-[10px] font-bold opacity-70">
                  {videosReady > 0 ? `${videosReady} video clips + music` : "No videos ready yet"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="h-48 md:h-56 bg-surface-container border-t-2 border-surface-container-high p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Timeline</span>
            </div>
            <span className="text-xs text-on-surface-variant">
              {scenes.length > 0 ? `~${scenes.length * 6}s total` : "No scenes"}
            </span>
          </div>

          <div className="flex-1 bg-surface-container-low rounded-xl relative overflow-hidden flex flex-col p-2 gap-2 shadow-inner">
            {/* Playhead */}
            <div className="absolute top-0 bottom-0 left-[35%] w-[2px] bg-tertiary z-20 pointer-events-none">
              <div className="absolute -top-1 -left-2 w-4 h-4 bg-tertiary rounded-full shadow-lg flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            </div>

            {/* Video Track */}
            <div className="flex gap-1 h-12 relative">
              <div className="w-16 md:w-20 flex items-center justify-center bg-white/50 rounded-lg text-[10px] font-black text-on-surface-variant uppercase tracking-tighter shrink-0">Video</div>
              <div className="flex-1 flex gap-0.5">
                {scenes.map((scene, i) => (
                  <div
                    key={scene.id}
                    onClick={() => setSelectedScene(i)}
                    className={`h-full rounded-md border-2 relative overflow-hidden cursor-pointer ${
                      selectedScene === i ? "bg-primary-container border-primary" : "bg-primary-container/40 border-primary-container"
                    }`}
                    style={{ width: `${100 / scenes.length}%` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-on-primary-container">
                      {scene.videoStatus === "done" ? (
                        <span className="material-symbols-outlined text-tertiary text-sm">check_circle</span>
                      ) : (
                        `S${scene.id}`
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Track */}
            <div className="flex gap-1 h-10">
              <div className="w-16 md:w-20 flex items-center justify-center bg-white/50 rounded-lg text-[10px] font-black text-on-surface-variant uppercase tracking-tighter shrink-0">Audio</div>
              <div className="flex-1 relative">
                <div className={`absolute left-0 right-0 h-full rounded-md flex items-center px-4 overflow-hidden border-2 ${
                  hasMusic ? "bg-secondary-container border-secondary/20" : "bg-surface-container-high border-dashed border-outline-variant"
                }`}>
                  <span className="text-[10px] font-bold text-on-secondary-container">
                    {hasMusic ? "AI Soundtrack" : "No audio — generate in Animation step"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-tertiary text-on-tertiary px-6 py-3 rounded-full shadow-xl font-bold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined filled text-sm">check_circle</span>
          {toast}
        </div>
      )}
    </>
  );
}
