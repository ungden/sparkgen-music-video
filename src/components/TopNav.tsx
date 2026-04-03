"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/context/ProjectContext";
import { useState } from "react";

const steps = [
  { label: "Idea", href: "idea" },
  { label: "Storyboard", href: "storyboard" },
  { label: "Animation", href: "animation" },
  { label: "Editor", href: "editor" },
];

export default function TopNav({ projectId }: { projectId?: string }) {
  const pathname = usePathname();
  const isProjectPage = pathname.includes("/project/");
  const { updateProject } = useProject();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = () => {
    if (projectId) {
      updateProject(projectId, {});
      showToast("Draft saved!");
    }
  };

  const handleExport = () => {
    showToast("Export coming soon!");
  };

  return (
    <>
      <header className="fixed top-0 right-0 left-0 md:left-64 h-20 flex justify-between items-center px-4 md:px-8 z-30 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-black text-blue-600 tracking-tight">
            Magic Music Video Maker
          </Link>
          {isProjectPage && (
            <nav className="hidden md:flex items-center gap-6 font-bold text-base">
              {steps.map((step) => {
                const href = projectId
                  ? `/project/${projectId}/${step.href}`
                  : "#";
                const active = pathname.includes(`/${step.href}`);
                return (
                  <Link
                    key={step.href}
                    href={href}
                    className={`transition-opacity ${
                      active
                        ? "text-blue-600 border-b-4 border-yellow-400 pb-1"
                        : "text-slate-500 hover:text-blue-500"
                    }`}
                  >
                    {step.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            aria-label="Notifications"
            onClick={() => showToast("No new notifications")}
            className="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity"
          >
            notifications
          </button>
          <button
            aria-label="Help"
            onClick={() => showToast("Help center coming soon!")}
            className="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity"
          >
            help_outline
          </button>
          {isProjectPage && (
            <div className="flex gap-2 pl-4 border-l border-outline-variant/30">
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-full font-bold text-sm bg-surface-container-high text-on-surface-variant hover:opacity-80 transition-opacity"
              >
                Save Draft
              </button>
              <button
                onClick={handleExport}
                className="px-5 py-2 rounded-full font-bold text-sm bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-sm active:translate-y-0.5 duration-200"
              >
                Export Video
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-24 right-8 z-50 bg-on-surface text-surface px-5 py-3 rounded-xl shadow-xl font-bold text-sm animate-bounce">
          {toast}
        </div>
      )}
    </>
  );
}
