"use client";

import RockSidebar from "@/components/rock/RockSidebar";
import RockTopNav from "@/components/rock/RockTopNav";
import { useRock } from "@/context/RockContext";
import { RockLyrics, RockThemeIdea, RockCategorySlug } from "@/types/rock";
import { getAllRockCategories, getRockCategory } from "@/lib/rock-categories";
import { ROCK_DEFAULT_IDEAS } from "@/lib/rock-default-ideas";
import { useRouter } from "next/navigation";
import { use, useState, useEffect, useCallback } from "react";

export default function RockIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentProject, setCurrentProject, updateProject } = useRock();

  const categories = getAllRockCategories();
  const [selectedCategory, setSelectedCategory] = useState<RockCategorySlug | null>(null);
  const [themes, setThemes] = useState<RockThemeIdea[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(-1);
  const [customPrompt, setCustomPrompt] = useState("");
  const [lyrics, setLyrics] = useState<RockLyrics | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setCurrentProject(id); }, [id, setCurrentProject]);

  useEffect(() => {
    if (!currentProject) return;
    if (currentProject.categorySlug && !selectedCategory) {
      setSelectedCategory(currentProject.categorySlug);
      setThemes(ROCK_DEFAULT_IDEAS.filter((t) => t.categorySlug === currentProject.categorySlug));
    }
    if (currentProject.lyrics && !lyrics) setLyrics(currentProject.lyrics);
    if (currentProject.selectedTheme && themes.length === 0) {
      setThemes([currentProject.selectedTheme]);
      setSelectedTheme(0);
    }
  }, [currentProject, lyrics, themes.length, selectedCategory]);

  const handleCategorySelect = (slug: RockCategorySlug) => {
    setSelectedCategory(slug);
    updateProject(id, { categorySlug: slug });
    const filtered = ROCK_DEFAULT_IDEAS.filter((t) => t.categorySlug === slug);
    setThemes(filtered);
    setSelectedTheme(-1);
    setLyrics(null);
    setStreamedText("");
  };

  const fetchThemes = useCallback(async () => {
    if (!selectedCategory) return;
    setIsLoadingThemes(true);
    setError(null);
    try {
      const res = await fetch("/api/rock/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorySlug: selectedCategory }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setThemes(data.ideas);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load themes");
    } finally {
      setIsLoadingThemes(false);
    }
  }, [selectedCategory]);

  const generateLyrics = async (themeTitle: string, prompt?: string) => {
    if (!selectedCategory) return;
    setIsStreaming(true);
    setStreamedText("");
    setLyrics(null);
    setError(null);
    try {
      const res = await fetch("/api/rock/generate-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeTitle, customPrompt: prompt, categorySlug: selectedCategory }),
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

      try {
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as RockLyrics;
          setLyrics(parsed);
          updateProject(id, { lyrics: parsed, status: "idea", title: themes[selectedTheme]?.title || customPrompt.slice(0, 30) || "Untitled Rock Song" });
        }
      } catch { setError("Failed to parse lyrics. Try again."); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate lyrics");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleThemeClick = (index: number) => {
    setSelectedTheme(index);
    const theme = themes[index];
    updateProject(id, { selectedTheme: theme, title: theme.title });
    generateLyrics(theme.title);
  };

  const handleCustomSpark = () => {
    if (!customPrompt.trim() || !selectedCategory) return;
    setSelectedTheme(-1);
    updateProject(id, { customPrompt, title: customPrompt.slice(0, 30) + "..." });
    generateLyrics("", customPrompt);
  };

  const handleProceed = () => {
    if (lyrics) {
      updateProject(id, { lyrics, status: "storyboard" });
      router.push(`/rock/${id}/storyboard`);
    }
  };

  const selectedCategoryConfig = selectedCategory ? getRockCategory(selectedCategory) : null;

  return (
    <>
      <RockSidebar />
      <RockTopNav projectId={id} />
      <main className="ml-0 md:ml-64 mt-20 p-4 md:p-8 min-h-[calc(100vh-5rem)]" style={{ background: "linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%)" }}>
        {/* Quick Guide */}
        {!lyrics && !currentProject?.lyrics && (
          <div className="max-w-4xl mx-auto mb-6 bg-[#2A1A1A] border border-[#8B0000]/30 rounded-2xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#D4A017] text-xl shrink-0 mt-0.5">help</span>
            <div className="text-sm text-gray-400">
              <span className="font-bold text-gray-200">How to start: </span>
              Choose a rock category below, pick a theme (or write your own), then AI will generate epic lyrics. Click &quot;Refresh&quot; for AI-generated theme ideas.
            </div>
          </div>
        )}

        {/* Category Picker */}
        <div className="max-w-5xl mx-auto mb-8">
          <h2 className="text-lg font-bold text-gray-200 mb-3">Choose a Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                  selectedCategory === cat.slug
                    ? "border-[#D4A017] shadow-lg shadow-[#D4A017]/20 scale-105"
                    : "border-gray-700 hover:border-gray-500 hover:shadow-md hover:scale-105"
                }`}
                style={{
                  background: selectedCategory === cat.slug ? `${cat.color}33` : "#1A1A1A",
                  color: selectedCategory === cat.slug ? "#D4A017" : "#999",
                }}
              >
                <span className="material-symbols-outlined text-base" style={{ color: cat.color }}>{cat.icon}</span>
                <div className="text-left">
                  <div className={selectedCategory === cat.slug ? "text-gray-100" : "text-gray-300"}>{cat.label}</div>
                  <div className="text-[10px] font-normal opacity-70 line-clamp-1">{cat.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="max-w-5xl mx-auto mb-4 px-4 py-2.5 bg-red-900/30 border border-red-800/40 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400 text-lg">warning</span>
            <p className="text-red-400 font-medium text-xs flex-1">{error}</p>
            <button onClick={() => setError(null)} className="material-symbols-outlined text-red-400 text-lg">close</button>
          </div>
        )}

        {selectedCategory && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Theme Ideas */}
            <section className="flex flex-col gap-6">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tight mb-2" style={{ color: selectedCategoryConfig?.color || "#8B0000" }}>
                    Pick a Theme
                  </h2>
                  <p className="text-gray-400 font-medium">Which legend should we write about?</p>
                </div>
                <button onClick={fetchThemes} disabled={isLoadingThemes} className="flex items-center gap-2 font-bold hover:opacity-70 disabled:opacity-40" style={{ color: "#D4A017" }}>
                  <span className={`material-symbols-outlined ${isLoadingThemes ? "animate-spin" : ""}`}>refresh</span>
                  AI Ideas
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {isLoadingThemes
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="rounded-2xl bg-[#1A1A1A] border border-gray-800 p-6 min-h-[180px] animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-gray-800 mb-auto" />
                        <div className="mt-auto space-y-2"><div className="h-5 bg-gray-800 rounded w-3/4" /><div className="h-4 bg-gray-800 rounded w-full" /></div>
                      </div>))
                  : themes.map((theme, i) => (
                      <div
                        key={i}
                        onClick={() => handleThemeClick(i)}
                        className={`group rounded-2xl cursor-pointer p-6 flex flex-col justify-end min-h-[180px] transition-all border relative overflow-hidden ${
                          selectedTheme === i
                            ? "ring-2 ring-[#D4A017] shadow-xl shadow-[#D4A017]/10 border-[#D4A017]/50"
                            : "border-gray-700 hover:shadow-lg hover:border-gray-500"
                        }`}
                        style={{ background: `linear-gradient(135deg, ${theme.color}22, #1A1A1A)` }}
                      >
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${theme.color}33` }}>
                          <span className="material-symbols-outlined filled" style={{ color: theme.iconColor }}>{theme.icon}</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-100 mb-1">{theme.title}</h3>
                        <p className="text-xs text-gray-400">{theme.desc}</p>
                      </div>))}
              </div>

              <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-6">
                <label className="block text-sm font-bold mb-2" style={{ color: "#D4A017" }}>Or describe your own theme:</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-[#0D0D0D] border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#8B0000] text-gray-200 placeholder-gray-600"
                    placeholder="A Viking berserker's last raid on a burning monastery..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomSpark()}
                  />
                  <button onClick={handleCustomSpark} disabled={isStreaming || !customPrompt.trim()} className="px-6 rounded-lg font-bold hover:opacity-90 disabled:opacity-40 text-white" style={{ background: "#8B0000" }}>
                    Create
                  </button>
                </div>
              </div>
            </section>

            {/* Right: Lyrics */}
            <section className="bg-[#111111] border border-gray-800 rounded-2xl shadow-xl p-8 flex flex-col min-h-[500px]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: "#8B0000" }}>
                  <span className="material-symbols-outlined">lyrics</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-gray-100">Generated Lyrics</h2>
                  {lyrics && <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#D4A017" }}>4 sections</p>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-4">
                {!streamedText && !lyrics && !isStreaming ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <span className="material-symbols-outlined text-6xl mb-4 opacity-30">music_note</span>
                    <p className="text-lg font-bold">Pick a theme to generate lyrics</p>
                  </div>
                ) : isStreaming && !lyrics ? (
                  <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">{streamedText}<span className="animate-pulse text-[#D4A017]">|</span></pre>
                ) : lyrics ? (
                  <div className="space-y-6">
                    {[
                      { key: "verse1", label: "Verse 1", lines: lyrics.verse1 },
                      { key: "chorus", label: "Chorus", lines: lyrics.chorus },
                      { key: "verse2", label: "Verse 2", lines: lyrics.verse2 },
                      { key: "outro", label: "Outro", lines: lyrics.outro },
                    ].map((section) => (
                      <div key={section.key} className="border-l-4 pl-4" style={{ borderColor: "#8B0000" }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#D4A017" }}>{section.label}</p>
                        {section.lines?.map((line, i) => (
                          <p key={i} className="text-gray-200 font-medium leading-relaxed">{line}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-800 flex gap-4">
                <button
                  onClick={() => { if (selectedTheme >= 0) generateLyrics(themes[selectedTheme].title); else if (customPrompt) generateLyrics("", customPrompt); }}
                  disabled={isStreaming || (!lyrics && !streamedText)}
                  className="flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 bg-[#1A1A1A] border border-gray-700 text-gray-400 hover:bg-[#222] disabled:opacity-40"
                >
                  <span className={`material-symbols-outlined ${isStreaming ? "animate-spin" : ""}`}>autorenew</span>
                  Regenerate
                </button>
                <button
                  onClick={handleProceed}
                  disabled={!lyrics || isStreaming}
                  className="flex-[1.5] py-4 rounded-2xl font-extrabold flex items-center justify-center gap-3 text-white shadow-xl disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #8B0000, #D4A017)" }}
                >
                  Proceed to Storyboard
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
