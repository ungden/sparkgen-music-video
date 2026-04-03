"use client";

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import CostCalculator from "@/components/CostCalculator";
import { useProject } from "@/context/ProjectContext";
import { Scene } from "@/types/project";
import { buildVideoPrompt } from "@/lib/prompts";
import { getGenre } from "@/lib/genres";
import Link from "next/link";
import { use, useState, useEffect, useCallback, useRef } from "react";

export default function AnimationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentProject, setCurrentProject, updateProject } = useProject();

  const [scenes, setScenes] = useState<Scene[]>([]);
  const scenesRef = useRef<Scene[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [musicStatus, setMusicStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [musicError, setMusicError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Keep ref in sync for use in async functions
  useEffect(() => { scenesRef.current = scenes; }, [scenes]);

  useEffect(() => {
    setCurrentProject(id);
  }, [id, setCurrentProject]);

  useEffect(() => {
    if (currentProject?.scenes?.length && scenes.length === 0) {
      setScenes(currentProject.scenes);
    }
    if (currentProject?.music?.status === "done" && musicStatus === "idle") {
      setMusicStatus("done");
    }
  }, [currentProject]);

  // --- VIDEO GENERATION ---

  const generateVideoForScene = async (sceneIndex: number) => {
    const current = scenesRef.current;
    const scene = current[sceneIndex];
    if (!scene?.imageBase64) {
      setError(`Scene has no image. Go back to Storyboard to generate it.`);
      return;
    }

    const updateScene = (patch: Partial<Scene>) => {
      setScenes((prev) => {
        const next = [...prev];
        next[sceneIndex] = { ...next[sceneIndex], ...patch };
        return next;
      });
    };

    updateScene({ videoStatus: "generating" });

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: scene.imageBase64,
          prompt: buildVideoPrompt(scene.description, currentProject?.genre),
          duration: "6",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate video");
      }

      const data = await res.json();
      updateScene({ videoStatus: "done", videoFileName: data.videoFileName });
    } catch (e: unknown) {
      updateScene({
        videoStatus: "error",
        videoError: e instanceof Error ? e.message : "Unknown error",
      });
    }

    // Save latest state to project
    updateProject(id, { scenes: scenesRef.current });
  };

  const generateAllVideos = async () => {
    setIsGeneratingAll(true);
    setError(null);

    const scenesWithImages = scenes.filter(
      (s) => s.status === "done" && s.imageBase64
    );

    if (scenesWithImages.length === 0) {
      setError("No scenes with images found. Go back to Storyboard first.");
      setIsGeneratingAll(false);
      return;
    }

    // Generate videos sequentially using ref for latest state
    for (let i = 0; i < scenesRef.current.length; i++) {
      const s = scenesRef.current[i];
      if (s.status === "done" && s.imageBase64 && s.videoStatus !== "done") {
        await generateVideoForScene(i);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    updateProject(id, { status: "animation" });
    setIsGeneratingAll(false);
  };

  // --- MUSIC GENERATION ---

  const generateMusic = useCallback(async () => {
    if (!currentProject?.lyrics) {
      setMusicError("No lyrics found.");
      return;
    }

    setMusicStatus("generating");
    setMusicError(null);

    try {
      const lyricsText = Object.entries(currentProject.lyrics)
        .map(([section, lines]) => `[${section}]\n${(lines as string[]).join("\n")}`)
        .join("\n\n");

      const genreConfig = getGenre(currentProject.genre);
      const res = await fetch("/api/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lyrics: lyricsText,
          theme: currentProject.selectedTheme?.title || "song",
          genreSlug: currentProject.genre,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate music");
      }

      const data = await res.json();
      setMusicStatus("done");
      updateProject(id, {
        music: {
          audioBase64: data.audioBase64,
          mimeType: data.mimeType,
          genre: genreConfig.musicSpec.genre,
          mood: genreConfig.musicSpec.mood,
          tempo: genreConfig.musicSpec.tempo,
          status: "done",
        },
      });
    } catch (e: unknown) {
      setMusicStatus("error");
      setMusicError(e instanceof Error ? e.message : "Failed to generate music");
    }
  }, [currentProject, id, updateProject]);

  const videoDone = scenes.filter((s) => s.videoStatus === "done").length;
  const videoGenerating = scenes.filter((s) => s.videoStatus === "generating").length;
  const totalScenes = scenes.filter((s) => s.status === "done").length;

  return (
    <>
      <Sidebar />
      <TopNav projectId={id} />
      <main className="ml-64 pt-20 pb-8 px-6 min-h-screen">
        {/* Header */}
        <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-on-surface tracking-tight mb-2">
              Bring It To Life
            </h2>
            <p className="text-on-surface-variant text-lg max-w-2xl">
              Transform your storyboard images into animated video clips and generate the perfect soundtrack.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {/* Progress */}
            <div className="flex items-center gap-4 bg-surface-container-low px-6 py-3 rounded-2xl">
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-primary-dim">Stage 3 of 4</p>
                <p className="text-on-surface font-black">
                  {videoDone}/{totalScenes} clips ready
                </p>
              </div>
              <div className="w-32 h-3 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-tertiary rounded-full transition-all duration-500"
                  style={{ width: totalScenes > 0 ? `${(videoDone / totalScenes) * 100}%` : "0%" }}
                />
              </div>
            </div>
            {videoDone === totalScenes && totalScenes > 0 && musicStatus === "done" ? (
              <Link
                href={`/project/${id}/editor`}
                className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-full font-black flex items-center gap-3 shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined filled">movie_edit</span>
                PROCEED TO EDITOR
              </Link>
            ) : (
              <button
                onClick={generateAllVideos}
                disabled={isGeneratingAll || totalScenes === 0}
                className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-full font-black flex items-center gap-3 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className={`material-symbols-outlined filled ${isGeneratingAll ? "animate-spin" : ""}`}>
                  {isGeneratingAll ? "progress_activity" : "bolt"}
                </span>
                {isGeneratingAll ? "GENERATING VIDEOS..." : "GENERATE ALL VIDEOS"}
              </button>
            )}
          </div>
        </section>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-2xl flex items-center justify-between">
            <p className="text-error font-bold text-sm">{error}</p>
            <button onClick={() => setError(null)} className="material-symbols-outlined text-error">close</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Scenes - 2 columns */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-black text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">movie</span>
              Video Clips ({videoDone}/{totalScenes})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scenes.filter((s) => s.status === "done").map((scene) => {
                const origIdx = scenes.findIndex((s) => s.id === scene.id);
                return (
                <div key={scene.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  {/* Scene Preview */}
                  <div className="relative aspect-video bg-on-background overflow-hidden">
                    {scene.imageBase64 && (
                      <img
                        className="w-full h-full object-cover"
                        src={`data:image/png;base64,${scene.imageBase64}`}
                        alt={scene.title}
                      />
                    )}
                    {/* Video Status Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {scene.videoStatus === "generating" ? (
                        <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-white text-4xl animate-spin">progress_activity</span>
                          <p className="text-white text-xs font-bold">Animating...</p>
                          <p className="text-white/60 text-[10px]">This may take a few minutes</p>
                        </div>
                      ) : scene.videoStatus === "done" ? (
                        <div className="bg-tertiary/90 rounded-full p-3">
                          <span className="material-symbols-outlined filled text-white text-3xl">check_circle</span>
                        </div>
                      ) : scene.videoStatus === "error" ? (
                        <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-error text-3xl">error</span>
                          <p className="text-white text-xs font-bold">Failed</p>
                          <button
                            onClick={() => generateVideoForScene(origIdx)}
                            className="text-primary-fixed text-xs font-bold hover:underline"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-4">
                          <span className="material-symbols-outlined text-white text-3xl opacity-60">videocam</span>
                        </div>
                      )}
                    </div>
                    {/* Time badge */}
                    <div className="absolute top-3 left-3 bg-black/40 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold">
                      {scene.time}
                    </div>
                    {/* Status badge */}
                    {scene.videoStatus === "done" && (
                      <div className="absolute top-3 right-3 bg-tertiary/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full" />
                        6s clip ready
                      </div>
                    )}
                  </div>
                  {/* Scene Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-black text-xs">
                        {scene.id}
                      </span>
                      <h4 className="font-bold text-on-surface">{scene.title}</h4>
                    </div>
                    <p className="text-xs text-on-surface-variant italic truncate">&ldquo;{scene.lyrics}&rdquo;</p>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* Music Panel - 1 column */}
          <div className="space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-black text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">music_note</span>
                Soundtrack
              </h3>

              {musicStatus === "idle" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-secondary-container/30 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-secondary text-3xl">library_music</span>
                  </div>
                  <p className="text-on-surface-variant text-sm mb-4">
                    Generate an AI soundtrack matching your lyrics
                  </p>
                  <button
                    onClick={generateMusic}
                    className="bg-gradient-to-r from-secondary to-secondary-dim text-on-secondary px-6 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition-all active:scale-95"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined">auto_awesome</span>
                      Generate Music
                    </span>
                  </button>
                </div>
              )}

              {musicStatus === "generating" && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-secondary text-4xl animate-spin mb-4 block">progress_activity</span>
                  <p className="font-bold text-on-surface">Composing your song...</p>
                  <p className="text-xs text-on-surface-variant mt-2">AI is creating music from your lyrics</p>
                </div>
              )}

              {musicStatus === "done" && currentProject?.music?.audioBase64 && (
                <div className="space-y-4">
                  <div className="bg-secondary-container/20 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-secondary-container rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined filled text-on-secondary-container">music_note</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">{currentProject.title} - Soundtrack</p>
                        <p className="text-[10px] text-on-surface-variant">
                          {currentProject.music.genre} • {currentProject.music.mood}
                        </p>
                      </div>
                    </div>
                    <audio
                      ref={audioRef}
                      controls
                      className="w-full h-10"
                      src={`data:${currentProject.music.mimeType};base64,${currentProject.music.audioBase64}`}
                    />
                  </div>
                  <button
                    onClick={generateMusic}
                    className="w-full py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Regenerate
                  </button>
                </div>
              )}

              {musicStatus === "error" && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-error text-3xl mb-2 block">error</span>
                  <p className="text-error text-sm font-bold mb-2">{musicError || "Failed to generate music"}</p>
                  <button
                    onClick={generateMusic}
                    className="text-primary font-bold text-sm hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>


            {/* Cost Calculator */}
            <CostCalculator actualScenes={totalScenes || 5} />
          </div>
        </div>
      </main>
    </>
  );
}
