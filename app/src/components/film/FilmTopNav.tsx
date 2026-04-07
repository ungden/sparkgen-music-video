"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  { label: "Idea", href: "idea" },
  { label: "Storyboard", href: "storyboard" },
  { label: "Animation", href: "animation" },
  { label: "Editor", href: "editor" },
];

export default function FilmTopNav({ projectId }: { projectId?: string }) {
  const pathname = usePathname();
  const isProjectPage = pathname.includes("/film/") && projectId;

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-20 flex justify-between items-center px-4 md:px-8 z-30 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/film" className="text-2xl font-black text-violet-600 tracking-tight">
          Film Studio
        </Link>
        {isProjectPage && (
          <nav className="hidden md:flex items-center gap-6 font-bold text-base">
            {steps.map((step) => {
              const href = `/film/${projectId}/${step.href}`;
              const active = pathname.includes(`/${step.href}`);
              return (
                <Link key={step.href} href={href} className={`transition-opacity ${active ? "text-violet-600 border-b-4 border-amber-400 pb-1" : "text-slate-500 hover:text-violet-500"}`}>
                  {step.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
