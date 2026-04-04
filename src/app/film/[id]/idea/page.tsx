"use client";

import FilmSidebar from "@/components/film/FilmSidebar";
import FilmTopNav from "@/components/film/FilmTopNav";
import { useFilm } from "@/context/FilmContext";
import { Script } from "@/types/film";
import { getFilmStyleList, DEFAULT_FILM_STYLE } from "@/lib/film/styles";
import { useRouter } from "next/navigation";
import { use, useState, useEffect, useCallback } from "react";

interface StoryIdea { icon: string; title: string; desc: string; color: string; iconColor: string }

export default function FilmIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentProject, setCurrentProject, updateProject } = useFilm();

  const [stories, setStories] = useState<StoryIdea[]>([]);
  const [selectedStory, setSelectedStory] = useState(-1);
  const [customPrompt, setCustomPrompt] = useState("");
  const [script, setScript] = useState<Script | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(DEFAULT_FILM_STYLE);
  const styleList = getFilmStyleList();

  useEffect(() => { setCurrentProject(id); }, [id, setCurrentProject]);

  useEffect(() => {
    if (!currentProject) return;
    if (currentProject.filmStyle) setSelectedStyle(currentProject.filmStyle);
    if (currentProject.script && !script) setScript(currentProject.script);
    if (currentProject.selectedStory && stories.length === 0) {
      setStories([currentProject.selectedStory]);
      setSelectedStory(0);
    }
  }, [currentProject, script, stories.length]);

  const handleStyleSelect = (slug: typeof selectedStyle) => {
    setSelectedStyle(slug);
    updateProject(id, { filmStyle: slug });
    setStories([]);
    setSelectedStory(-1);
    setScript(null);
    setStreamedText("");
  };

  const fetchStories = useCallback(async () => {
    setIsLoadingStories(true);
    setError(null);
    try {
      const res = await fetch("/api/film/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filmStyleSlug: selectedStyle }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setStories(data.ideas);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load stories");
    } finally {
      setIsLoadingStories(false);
    }
  }, [selectedStyle]);

  useEffect(() => {
    if (stories.length === 0 && !script && !currentProject?.script) fetchStories();
  }, [stories.length, script, currentProject?.script, fetchStories]);

  const generateScript = async (storyTitle: string, prompt?: string) => {
    setIsStreaming(true);
    setStreamedText("");
    setScript(null);
    setError(null);
    try {
      const res = await fetch("/api/film/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyIdea: storyTitle, customPrompt: prompt, filmStyleSlug: selectedStyle }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamedText(fullText);
      }

      // Parse script JSON from streamed text
      try {
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Script;
          setScript(parsed);
          updateProject(id, { script: parsed, status: "idea", title: parsed.synopsis?.slice(0, 40) || "Untitled Film" });
        }
      } catch { setError("Failed to parse script. Try again."); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate script");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStoryClick = (index: number) => {
    setSelectedStory(index);
    const story = stories[index];
    updateProject(id, { selectedStory: story, title: story.title });
    generateScript(story.title);
  };

  const handleCustomSpark = () => {
    if (!customPrompt.trim()) return;
    setSelectedStory(-1);
    updateProject(id, { customPrompt, title: customPrompt.slice(0, 30) + "..." });
    generateScript("", customPrompt);
  };

  const handleProceed = () => {
    if (script) {
      updateProject(id, { script, status: "storyboard" });
      router.push(`/film/${id}/storyboard`);
    }
  };

  return (
    <>
      <FilmSidebar />
      <FilmTopNav projectId={id} />
      <main className="ml-0 md:ml-64 mt-20 p-4 md:p-8 min-h-[calc(100vh-5rem)]">
        {/* Style Picker */}
        <div className="max-w-4xl mx-auto mb-8">
          <h2 className="text-lg font-bold text-on-surface mb-3">Choose a Film Style</h2>
          <div className="flex flex-wrap gap-2">
            {styleList.map((s) => (
              <button key={s.slug} onClick={() => handleStyleSelect(s.slug)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedStyle === s.slug ? "bg-violet-600 text-white shadow-lg scale-105" : `${s.color} hover:shadow-md hover:scale-105`}`}>
                <span className="material-symbols-outlined text-base">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-lg">warning</span>
            <p className="text-error font-medium text-xs flex-1">{error}</p>
            <button onClick={() => setError(null)} className="material-symbols-outlined text-error text-lg">close</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Story Ideas */}
          <section className="flex flex-col gap-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black text-violet-600 tracking-tight mb-2">Pick a Story</h2>
                <p className="text-on-surface-variant font-medium">Which story should we bring to life?</p>
              </div>
              <button onClick={fetchStories} disabled={isLoadingStories} className="flex items-center gap-2 text-violet-600 font-bold hover:opacity-70 disabled:opacity-40">
                <span className={`material-symbols-outlined ${isLoadingStories ? "animate-spin" : ""}`}>refresh</span>
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {isLoadingStories
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-surface-container-low p-6 min-h-[180px] animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high mb-auto" />
                      <div className="mt-auto space-y-2"><div className="h-5 bg-surface-container-high rounded w-3/4" /><div className="h-4 bg-surface-container-high rounded w-full" /></div>
                    </div>))
                : stories.map((story, i) => (
                    <div key={i} onClick={() => handleStoryClick(i)} className={`group rounded-2xl cursor-pointer p-6 flex flex-col justify-end min-h-[180px] transition-all ${story.color} ${selectedStory === i ? "ring-4 ring-violet-300 shadow-xl" : "hover:shadow-lg"}`}>
                      <div className="absolute top-4 right-4 bg-white/40 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center">
                        <span className={`material-symbols-outlined filled ${story.iconColor}`}>{story.icon}</span>
                      </div>
                      <h3 className="text-xl font-extrabold text-on-surface mb-1">{story.title}</h3>
                      <p className="text-sm text-on-surface-variant">{story.desc}</p>
                    </div>))}
            </div>

            <div className="bg-surface-container-low rounded-2xl p-6">
              <label className="block text-sm font-bold text-violet-600 mb-2">Or describe your own story:</label>
              <div className="flex gap-2">
                <input className="flex-1 bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-violet-500 text-on-surface" placeholder="A robot discovers a hidden underwater city..." value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCustomSpark()} />
                <button onClick={handleCustomSpark} disabled={isStreaming || !customPrompt.trim()} className="bg-violet-600 text-white px-6 rounded-lg font-bold hover:opacity-90 disabled:opacity-40">
                  Create
                </button>
              </div>
            </div>
          </section>

          {/* Right: Script */}
          <section className="bg-surface-container-lowest rounded-2xl shadow-xl p-8 flex flex-col min-h-[500px]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Generated Script</h2>
                {script && <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">{script.scenes?.length || 0} scenes</p>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4">
              {!streamedText && !script && !isStreaming ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-30">movie</span>
                  <p className="text-lg font-bold">Pick a story to generate the script</p>
                </div>
              ) : isStreaming && !script ? (
                <pre className="whitespace-pre-wrap text-sm text-on-surface font-mono leading-relaxed">{streamedText}<span className="animate-pulse">|</span></pre>
              ) : script ? (
                <div className="space-y-6">
                  <div className="bg-violet-50 p-4 rounded-xl">
                    <p className="text-xs font-black text-violet-600 uppercase tracking-widest mb-1">Synopsis</p>
                    <p className="text-on-surface font-medium">{script.synopsis}</p>
                  </div>
                  {script.scenes?.map((scene, i) => (
                    <div key={i} className="border-l-4 border-violet-200 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black text-xs">{scene.id}</span>
                        <h4 className="font-bold text-on-surface">{scene.title}</h4>
                        <span className="text-xs text-on-surface-variant ml-auto">{scene.durationEstimate}s</span>
                      </div>
                      <p className="text-sm text-on-surface mb-1 italic">&ldquo;{scene.narration}&rdquo;</p>
                      <p className="text-xs text-on-surface-variant">{scene.visualDescription}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-8 pt-8 border-t border-surface-container-high flex gap-4">
              <button onClick={() => { if (selectedStory >= 0) generateScript(stories[selectedStory].title); else if (customPrompt) generateScript("", customPrompt); }} disabled={isStreaming || (!script && !streamedText)} className="flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest disabled:opacity-40">
                <span className={`material-symbols-outlined ${isStreaming ? "animate-spin" : ""}`}>autorenew</span>
                Regenerate
              </button>
              <button onClick={handleProceed} disabled={!script || isStreaming} className="flex-[1.5] py-4 rounded-2xl font-extrabold flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-violet-400 text-white shadow-xl disabled:opacity-40">
                Proceed to Storyboard
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
