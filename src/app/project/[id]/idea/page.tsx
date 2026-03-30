"use client";

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import StreamingText, { parseLyrics } from "@/components/StreamingText";
import { useProject } from "@/context/ProjectContext";
import { ThemeIdea, Lyrics } from "@/types/project";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState, useEffect, useCallback } from "react";

export default function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentProject, setCurrentProject, updateProject } = useProject();

  const [themes, setThemes] = useState<ThemeIdea[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<number>(-1);
  const [customPrompt, setCustomPrompt] = useState("");
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentProject(id);
  }, [id, setCurrentProject]);

  // Restore saved state when project loads
  useEffect(() => {
    if (!currentProject) return;
    if (currentProject.lyrics && !lyrics) {
      setLyrics(currentProject.lyrics);
    }
    if (currentProject.selectedTheme && themes.length === 0) {
      setThemes([currentProject.selectedTheme]);
      setSelectedTheme(0);
    }
  }, [currentProject, lyrics, themes.length]);

  const fetchThemes = useCallback(async () => {
    setIsLoadingThemes(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate ideas");
      }
      const data = await res.json();
      setThemes(data.ideas);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load themes");
    } finally {
      setIsLoadingThemes(false);
    }
  }, []);

  // Auto-fetch themes on first load (only if no saved data)
  useEffect(() => {
    if (themes.length === 0 && !lyrics && !currentProject?.lyrics) {
      fetchThemes();
    }
  }, [themes.length, lyrics, currentProject?.lyrics, fetchThemes]);

  const generateLyrics = async (theme: string, prompt?: string) => {
    setIsStreaming(true);
    setStreamedText("");
    setLyrics(null);
    setError(null);

    try {
      const res = await fetch("/api/generate-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, customPrompt: prompt }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate lyrics");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream available");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamedText(fullText);
      }

      const parsed = parseLyrics(fullText);
      if (parsed) {
        setLyrics(parsed);
        updateProject(id, { lyrics: parsed, status: "idea" });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate lyrics");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleThemeClick = (index: number) => {
    setSelectedTheme(index);
    const theme = themes[index];
    updateProject(id, {
      selectedTheme: theme,
      title: theme.title + " Song",
    });
    generateLyrics(theme.title);
  };

  const handleCustomSpark = () => {
    if (!customPrompt.trim()) return;
    setSelectedTheme(-1);
    updateProject(id, {
      customPrompt,
      title: customPrompt.slice(0, 30) + "...",
    });
    generateLyrics("", customPrompt);
  };

  const handleProceed = () => {
    if (lyrics) {
      updateProject(id, { lyrics, status: "storyboard" });
      router.push(`/project/${id}/storyboard`);
    }
  };

  return (
    <>
      <Sidebar />
      <TopNav projectId={id} />
      <main className="ml-64 mt-20 p-8 min-h-[calc(100vh-5rem)]">
        {/* Progress Stepper */}
        {(() => {
          const statusStep: Record<string, number> = { idea: 1, storyboard: 2, animation: 3, editing: 4, rendering: 4, finished: 4 };
          const currentStep = statusStep[currentProject?.status || "idea"] || 1;
          const progressPct = ((currentStep - 1) / 3) * 100;
          const steps = [
            { n: 1, label: "Idea" },
            { n: 2, label: "Storyboard" },
            { n: 3, label: "Animation" },
            { n: 4, label: "Finalize" },
          ];
          return (
            <div className="max-w-4xl mx-auto mb-10">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-container-highest -translate-y-1/2 z-0" />
                <div className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                {steps.map((step) => {
                  const done = step.n < currentStep;
                  const active = step.n === currentStep;
                  return (
                    <div key={step.n} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        done ? "bg-tertiary text-white" : active ? "bg-primary text-on-primary shadow-lg" : "bg-surface-container-highest text-on-surface-variant"
                      }`}>
                        {done ? <span className="material-symbols-outlined filled text-sm">check</span> : step.n}
                      </div>
                      <span className={`text-xs font-bold ${active ? "text-primary" : done ? "text-tertiary" : "text-on-surface-variant"}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Error Banner */}
        {error && (
          <div className="mb-4 px-4 py-2.5 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-lg shrink-0">warning</span>
            <p className="text-error font-medium text-xs truncate flex-1">{error}</p>
            <button onClick={() => setError(null)} className="material-symbols-outlined text-error text-lg shrink-0 hover:opacity-70">close</button>
          </div>
        )}

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start">
          {/* Left Side: AI Themes */}
          <section className="flex flex-col gap-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black text-primary tracking-tight mb-2">Pick a Spark</h2>
                <p className="text-on-surface-variant font-medium">Which story should we tell today?</p>
              </div>
              <button
                onClick={fetchThemes}
                disabled={isLoadingThemes}
                className="flex items-center gap-2 text-primary font-bold hover:opacity-70 transition-opacity disabled:opacity-40"
              >
                <span className={`material-symbols-outlined ${isLoadingThemes ? "animate-spin" : ""}`}>refresh</span>
                Refresh Ideas
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              {isLoadingThemes
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-surface-container-low p-6 min-h-[180px] animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high mb-auto" />
                      <div className="mt-auto space-y-2">
                        <div className="h-5 bg-surface-container-high rounded w-3/4" />
                        <div className="h-4 bg-surface-container-high rounded w-full" />
                      </div>
                    </div>
                  ))
                : themes.map((theme, i) => (
                    <div
                      key={i}
                      onClick={() => handleThemeClick(i)}
                      className={`group relative overflow-hidden rounded-2xl cursor-pointer p-6 flex flex-col justify-end min-h-[180px] transition-all ${theme.color} ${selectedTheme === i ? "ring-4 ring-primary/30 shadow-xl" : "hover:shadow-lg"}`}
                    >
                      <div className="absolute top-4 right-4 bg-white/40 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center">
                        <span className={`material-symbols-outlined filled ${theme.iconColor}`}>{theme.icon}</span>
                      </div>
                      <h3 className="text-xl font-extrabold text-on-surface mb-1">{theme.title}</h3>
                      <p className="text-sm text-on-surface-variant">{theme.desc}</p>
                    </div>
                  ))}
            </div>

            <div className="bg-surface-container-low rounded-2xl p-6">
              <label className="block text-sm font-bold text-primary mb-2">Or type your own magic words:</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary text-on-surface"
                  placeholder="A robot who loves baking cookies..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomSpark()}
                />
                <button
                  onClick={handleCustomSpark}
                  disabled={isStreaming || !customPrompt.trim()}
                  className="bg-primary text-on-primary px-6 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Spark
                </button>
              </div>
            </div>
          </section>

          {/* Right Side: Generated Lyrics */}
          <section className="bg-surface-container-lowest rounded-2xl shadow-xl shadow-blue-900/5 p-8 flex flex-col relative overflow-hidden">

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Generated Lyrics</h2>
                  {selectedTheme >= 0 && themes[selectedTheme] && (
                    <p className="text-xs font-bold text-tertiary uppercase tracking-wider">
                      Theme: {themes[selectedTheme].title}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 custom-scrollbar overflow-y-auto relative z-10 pr-4">
              {!streamedText && !lyrics && !isStreaming ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-30">lyrics</span>
                  <p className="text-lg font-bold">Pick a theme to generate lyrics</p>
                  <p className="text-sm mt-2">Or type your own idea and click Spark!</p>
                </div>
              ) : isStreaming || (!lyrics && streamedText) ? (
                <StreamingText text={streamedText} isStreaming={isStreaming} />
              ) : lyrics ? (
                <div className="space-y-8 font-medium text-lg leading-relaxed text-on-surface">
                  <div>
                    <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-50">[Verse 1]</p>
                    {lyrics.verse1.map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                  <div className="bg-primary-container/10 p-6 rounded-2xl border-l-4 border-primary">
                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">[Chorus]</p>
                    {lyrics.chorus.map((line, i) => <p key={i} className="text-xl font-bold text-primary-dim">{line}</p>)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-50">[Verse 2]</p>
                    {lyrics.verse2.map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                  <div className="bg-surface-container-high/30 p-6 rounded-2xl">
                    <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-50">[Outro]</p>
                    {lyrics.outro.map((line, i) => <p key={i} className="italic text-on-surface-variant">{line}</p>)}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-8 pt-8 border-t border-surface-container-high flex flex-col sm:flex-row gap-4 relative z-10">
              <button
                onClick={() => {
                  if (selectedTheme >= 0) generateLyrics(themes[selectedTheme].title);
                  else if (customPrompt) generateLyrics("", customPrompt);
                }}
                disabled={isStreaming || (!lyrics && !streamedText)}
                className="flex-1 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-all active:scale-95 disabled:opacity-40"
              >
                <span className={`material-symbols-outlined ${isStreaming ? "animate-spin" : ""}`}>autorenew</span>
                Regenerate Lyrics
              </button>
              <button
                onClick={handleProceed}
                disabled={!lyrics || isStreaming}
                className="flex-[1.5] py-4 px-6 rounded-2xl font-extrabold flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-40"
              >
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
