"use client";

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { useProject } from "@/context/ProjectContext";
import { Scene } from "@/types/project";
import Link from "next/link";
import { use, useState, useEffect, useCallback } from "react";

export default function StoryboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currentProject, setCurrentProject, updateProject } = useProject();

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingImageIdx, setGeneratingImageIdx] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentProject(id);
  }, [id, setCurrentProject]);

  useEffect(() => {
    if (currentProject?.scenes?.length && scenes.length === 0) {
      setScenes(currentProject.scenes);
    }
  }, [currentProject, scenes.length]);

  const generateSceneDescriptions = useCallback(async () => {
    if (!currentProject?.lyrics || !currentProject?.selectedTheme) {
      setError("No lyrics found. Please go back to Step 1 and generate lyrics first.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lyrics: currentProject.lyrics,
          theme: currentProject.selectedTheme.title || currentProject.customPrompt || "song",
          genreSlug: currentProject.genre,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate scenes");
      }

      const data = await res.json();
      setScenes(data.scenes);
      updateProject(id, {
        scenes: data.scenes,
        status: "storyboard",
        characterPrompt: data.characterPrompt,
        artStyle: data.artStyle,
      });

      // Generate images for each scene
      for (let i = 0; i < data.scenes.length; i++) {
        await generateImageForScene(data.scenes, i);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate scenes");
    } finally {
      setIsGenerating(false);
    }
  }, [currentProject, id, updateProject]);

  const generateImageForScene = async (currentScenes: Scene[], index: number) => {
    setGeneratingImageIdx(index);
    const scene = currentScenes[index];

    const updated = [...currentScenes];
    updated[index] = { ...scene, status: "generating" };
    setScenes(updated);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
              description: scene.description,
              style: currentProject?.artStyle,
              genreSlug: currentProject?.genre,
              characterReferenceBase64: currentProject?.characterReferenceBase64,
            }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate image");
      }

      const data = await res.json();
      updated[index] = {
        ...updated[index],
        imageBase64: data.imageBase64,
        status: "done",
      };
      setScenes([...updated]);
      updateProject(id, { scenes: [...updated] });
    } catch {
      updated[index] = { ...updated[index], status: "error" };
      setScenes([...updated]);
    }

    setGeneratingImageIdx(-1);
    // Small delay between image generations to respect rate limits
    await new Promise((r) => setTimeout(r, 1000));
  };

  const regenerateImage = async (index: number) => {
    await generateImageForScene(scenes, index);
  };

  // Auto-generate on mount if no scenes exist
  useEffect(() => {
    if (
      currentProject?.lyrics &&
      currentProject?.selectedTheme &&
      !currentProject?.scenes?.length &&
      !isGenerating &&
      scenes.length === 0
    ) {
      generateSceneDescriptions();
    }
  }, [currentProject, isGenerating, scenes.length, generateSceneDescriptions]);

  const completedScenes = scenes.filter((s) => s.status === "done").length;

  return (
    <>
      <Sidebar />
      <TopNav projectId={id} />
      <main className="ml-0 md:ml-64 pt-20 pb-28 px-4 md:px-6 min-h-screen">
        {/* Header & Progress */}
        <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-on-surface tracking-tight mb-2">Visualizing Your Story</h2>
            <p className="text-on-surface-variant text-lg max-w-2xl">
              {isGenerating
                ? "AI is generating your storyboard scenes..."
                : scenes.length > 0
                ? `Review the imagery and lyrics before we bring them to life.`
                : "Click Generate to create your storyboard from the lyrics."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-4 bg-surface-container-low px-6 py-3 rounded-2xl">
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-primary-dim">Overall Progress</p>
                <p className="text-on-surface font-black">Stage 2 of 4</p>
              </div>
              <div className="w-32 h-3 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-500"
                  style={{ width: scenes.length > 0 ? `${(completedScenes / scenes.length) * 100}%` : "0%" }}
                />
              </div>
            </div>
            {scenes.length === 0 ? (
              <button
                onClick={generateSceneDescriptions}
                disabled={isGenerating}
                className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-full font-black flex items-center gap-3 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className={`material-symbols-outlined filled ${isGenerating ? "animate-spin" : ""}`}>
                  {isGenerating ? "progress_activity" : "bolt"}
                </span>
                {isGenerating ? "GENERATING..." : "GENERATE STORYBOARD"}
              </button>
            ) : (
              <Link
                href={`/project/${id}/animation`}
                className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-full font-black flex items-center gap-3 shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined filled">bolt</span>
                PROCEED TO ANIMATION
              </Link>
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

        {/* Storyboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {scenes.length === 0 && isGenerating
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-video bg-surface-container-high" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-surface-container-high rounded w-1/2" />
                    <div className="h-3 bg-surface-container-high rounded w-full" />
                    <div className="h-3 bg-surface-container-high rounded w-3/4" />
                  </div>
                </div>
              ))
            : scenes.map((scene, i) => (
                <div key={scene.id} className="group relative bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="relative aspect-video overflow-hidden bg-surface-container-high">
                    {scene.status === "generating" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                        <p className="text-sm font-bold text-on-surface-variant">Generating image...</p>
                      </div>
                    ) : scene.status === "error" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-error">error</span>
                        <button onClick={() => regenerateImage(i)} className="text-sm font-bold text-primary hover:underline">
                          Retry
                        </button>
                      </div>
                    ) : scene.imageBase64 ? (
                      <img
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        src={`data:image/png;base64,${scene.imageBase64}`}
                        alt={scene.title}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-outline-variant opacity-50">image</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white px-4 py-1.5 rounded-full font-bold text-sm">
                      {scene.time}
                    </div>
                    {scene.status === "done" && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                        <div className="flex gap-3 w-full">
                          <button
                            onClick={() => regenerateImage(i)}
                            disabled={generatingImageIdx >= 0}
                            className="flex-1 bg-white/20 backdrop-blur-xl text-white py-2.5 rounded-full font-bold text-sm hover:bg-white/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">refresh</span> Regenerate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-black text-sm">
                        {scene.id}
                      </span>
                      <h3 className="font-bold text-lg text-on-surface">{scene.title}</h3>
                    </div>
                    <blockquote className="text-on-surface-variant italic border-l-4 border-secondary-container pl-4 py-1 leading-relaxed text-sm">
                      &ldquo;{scene.lyrics}&rdquo;
                    </blockquote>
                  </div>
                </div>
              ))}

          {/* Add Scene Placeholder */}
          {scenes.length > 0 && (
            <div className="relative bg-surface-container-low rounded-2xl border-4 border-dashed border-outline-variant flex flex-col items-center justify-center p-8 text-center group cursor-pointer hover:bg-surface-container transition-colors duration-300">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary mb-4 shadow-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">add</span>
              </div>
              <h3 className="font-bold text-xl text-on-surface">Add Scene</h3>
              <p className="text-on-surface-variant text-sm mt-2">Extend your music video with a custom prompt</p>
            </div>
          )}
        </div>

        {/* Generation Progress Toast */}
        {generatingImageIdx >= 0 && (
          <div className="fixed bottom-8 right-8 bg-surface-container-highest border border-white/40 p-4 rounded-2xl shadow-xl flex items-center gap-4 max-w-xs z-50">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            </div>
            <div>
              <p className="font-bold text-sm text-on-surface leading-tight">
                Generating Scene {generatingImageIdx + 1} of {scenes.length}
              </p>
              <p className="text-xs text-on-surface-variant">
                {completedScenes} of {scenes.length} images complete
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
