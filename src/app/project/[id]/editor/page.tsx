"use client";

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { useProject } from "@/context/ProjectContext";
import { Scene } from "@/types/project";
import { use, useState, useEffect, useRef } from "react";

const defaultAudioTracks = [
  { icon: "music_note", title: "Starlight Symphony", desc: "Upbeat • 03:20", color: "bg-secondary-container", iconColor: "text-on-secondary-container" },
  { icon: "waves", title: "Neon Dreamscape", desc: "Electronic • 02:45", color: "bg-tertiary-container", iconColor: "text-on-tertiary-container" },
  { icon: "auto_fix_high", title: "Whimsical Waltz", desc: "Classical • 04:12", color: "bg-surface-container-highest", iconColor: "text-on-surface-variant" },
];

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentProject, setCurrentProject, updateProject } = useProject();
  const [selectedScene, setSelectedScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<"tracks" | "fx" | "voices">("tracks");
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

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <Sidebar />
      <TopNav projectId={id} />
      <main className="ml-64 pt-20 h-screen flex flex-col overflow-hidden">
        {/* Workspace */}
        <div className="flex flex-1 min-h-0 p-6 gap-6">
          {/* Video Player Canvas */}
          <div className="flex-[3] flex flex-col gap-4">
            <div className="relative flex-1 bg-on-background rounded-xl overflow-hidden shadow-2xl group">
              {activeScene?.imageBase64 ? (
                <img
                  className="w-full h-full object-cover opacity-80"
                  src={`data:image/png;base64,${activeScene.imageBase64}`}
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
                    <div className="flex gap-2">
                      <button className="p-2 text-white bg-white/20 hover:bg-white/40 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">fullscreen</span>
                      </button>
                      <button className="p-2 text-white bg-white/20 hover:bg-white/40 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">volume_up</span>
                      </button>
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
              {activeScene && !activeScene.videoStatus && (
                <div className="absolute top-4 left-4 bg-surface-container-highest/90 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-on-surface-variant">image</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Preview</span>
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
                  {scene.imageBase64 && (
                    <img
                      className={`w-full h-full object-cover ${selectedScene === i ? "" : "opacity-60 group-hover:opacity-100"}`}
                      src={`data:image/png;base64,${scene.imageBase64}`}
                      alt={scene.title}
                    />
                  )}
                  {selectedScene === i && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />}
                  {scene.videoStatus === "done" && selectedScene !== i && (
                    <div className="absolute top-1 right-1 bg-tertiary rounded-full w-4 h-4 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[10px]">check</span>
                    </div>
                  )}
                  {scene.videoStatus === "generating" && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center bg-on-background/40">
                        <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-1 rounded">
                          {scene.videoStatus === "generating" ? "..." : ""}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div className="flex-none w-32 aspect-video bg-surface-container-low border border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">
                <span className="material-symbols-outlined">add_circle</span>
                <span className="text-[10px] font-bold mt-1">Add Scene</span>
              </div>
            </div>
          </div>

          {/* Audio & FX Sidebar */}
          <div className="flex-1 min-w-[320px] bg-surface-container-low rounded-xl p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-extrabold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">library_music</span>
                Audio &amp; FX
              </h3>
              <div className="flex p-1 bg-surface-container-high rounded-full mb-4">
                {(["tracks", "fx", "voices"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-colors ${
                      activeTab === tab ? "bg-white text-primary shadow-sm" : "text-on-surface-variant"
                    }`}
                  >
                    {tab === "tracks" ? "Tracks" : tab === "fx" ? "Sound FX" : "Voices"}
                  </button>
                ))}
              </div>

              {/* Audio Player for generated music */}
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

              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {defaultAudioTracks.map((track, i) => (
                  <div key={i} className="p-3 bg-surface-container-lowest rounded-xl flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer group">
                    <div className={`w-10 h-10 ${track.color} rounded-lg flex items-center justify-center ${track.iconColor}`}>
                      <span className="material-symbols-outlined">{track.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-on-surface">{track.title}</p>
                      <p className="text-[10px] text-on-surface-variant">{track.desc}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1.5 bg-primary text-white rounded-full transition-opacity">
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto">
              <button
                onClick={() => { updateProject(id, { status: "finished" }); showToast("Project finalized! Video rendering coming soon."); }}
                className="w-full py-5 bg-gradient-to-br from-secondary to-secondary-container text-on-secondary-container font-black rounded-2xl shadow-xl shadow-secondary/20 flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-95"
              >
                <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                RENDER FULL MV
                <span className="text-[10px] font-bold opacity-70">
                  {scenes.length > 0 ? `${scenes.length} scenes ready` : "Estimated: 4 mins"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Editor Timeline Section */}
        <div className="h-64 bg-surface-container border-t-2 border-surface-container-high p-4 flex flex-col gap-3">
          {/* Timeline Toolbar */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="flex bg-white rounded-lg p-1">
                <button className="p-1.5 hover:bg-surface-container rounded-md"><span className="material-symbols-outlined text-sm">undo</span></button>
                <button className="p-1.5 hover:bg-surface-container rounded-md"><span className="material-symbols-outlined text-sm">redo</span></button>
              </div>
              <div className="h-4 w-[1px] bg-outline-variant/30" />
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">zoom_in</span>
                <div className="w-32 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-primary" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-primary shadow-sm">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                AI Transitions
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-on-surface-variant shadow-sm">
                <span className="material-symbols-outlined text-sm">content_cut</span>
                Split Clip
              </button>
            </div>
          </div>

          {/* Tracks Area */}
          <div className="flex-1 bg-surface-container-low rounded-xl relative overflow-hidden flex flex-col p-2 gap-2 shadow-inner">
            {/* Playhead */}
            <div className="absolute top-0 bottom-0 left-[35%] w-[2px] bg-tertiary z-20 pointer-events-none">
              <div className="absolute -top-1 -left-2 w-4 h-4 bg-tertiary rounded-full shadow-lg flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            </div>

            {/* Video Track */}
            <div className="flex gap-1 h-12 relative">
              <div className="w-20 flex items-center justify-center bg-white/50 rounded-lg text-[10px] font-black text-on-surface-variant uppercase tracking-tighter shrink-0">Video</div>
              <div className="flex-1 flex gap-0.5">
                {scenes.length > 0 ? (
                  scenes.map((scene, i) => (
                    <div
                      key={scene.id}
                      onClick={() => setSelectedScene(i)}
                      className={`h-full rounded-md border-2 relative overflow-hidden cursor-pointer ${
                        selectedScene === i ? "bg-primary-container border-primary" : "bg-primary-container/40 border-primary-container"
                      }`}
                      style={{ width: `${100 / scenes.length}%` }}
                    >
                      {scene.imageBase64 && (
                        <img className="w-full h-full object-cover opacity-30" src={`data:image/png;base64,${scene.imageBase64}`} alt="" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-on-primary-container">
                        SCENE {scene.id}
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="w-[20%] h-full bg-primary-container/40 rounded-md border-2 border-primary-container relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-on-primary-container">SCENE 1</div>
                    </div>
                    <div className="w-[30%] h-full bg-primary-container rounded-md border-2 border-primary relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-on-primary-container">SCENE 2</div>
                    </div>
                    <div className="w-[25%] h-full bg-primary-container/60 rounded-md border-2 border-primary-container/80 relative overflow-hidden">
                      <div className="absolute inset-0 bg-tertiary/20 animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-on-primary-container italic">RENDERING...</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Audio Track */}
            <div className="flex gap-1 h-10">
              <div className="w-20 flex items-center justify-center bg-white/50 rounded-lg text-[10px] font-black text-on-surface-variant uppercase tracking-tighter shrink-0">Audio</div>
              <div className="flex-1 relative">
                <div className="absolute left-[5%] right-[10%] h-full bg-secondary-container rounded-md flex items-center px-4 overflow-hidden border-2 border-secondary/20">
                  <div className="flex items-center gap-0.5 h-full py-2 opacity-50">
                    {[4, 6, 8, 5, 7, 3, 6, 4, 8, 7, 2, 6, 4, 8, 5, 7].map((h, i) => (
                      <div key={i} className="w-1 bg-on-secondary-container rounded-full" style={{ height: `${h * 4}px` }} />
                    ))}
                  </div>
                  <span className="absolute left-4 text-[10px] font-bold text-on-secondary-container">
                    {hasMusic ? "AI Soundtrack" : "Starlight_Symphony_Main.mp3"}
                  </span>
                </div>
              </div>
            </div>

            {/* FX Track */}
            <div className="flex gap-1 h-8">
              <div className="w-20 flex items-center justify-center bg-white/50 rounded-lg text-[10px] font-black text-on-surface-variant uppercase tracking-tighter shrink-0">Effects</div>
              <div className="flex-1 flex gap-2">
                <div className="w-24 h-full bg-tertiary-container/30 rounded-md border border-tertiary-dim border-dashed flex items-center justify-center">
                  <span className="text-[9px] font-bold text-tertiary uppercase">Color Bloom</span>
                </div>
                <div className="w-32 h-full bg-tertiary-container/30 rounded-md border border-tertiary-dim border-dashed flex items-center justify-center translate-x-12">
                  <span className="text-[9px] font-bold text-tertiary uppercase">Motion Blur</span>
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
