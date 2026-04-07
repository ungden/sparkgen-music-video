"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  { label: "Idea", href: "idea" },
  { label: "Storyboard", href: "storyboard" },
  { label: "Animation", href: "animation" },
  { label: "Editor", href: "editor" },
];

export default function RockTopNav({ projectId }: { projectId?: string }) {
  const pathname = usePathname();
  const isProjectPage = pathname.includes("/rock/") && projectId;

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-20 flex justify-between items-center px-4 md:px-8 z-30 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/rock" className="text-2xl font-black text-red-700 tracking-tight">
          Rock Legends
        </Link>
        {isProjectPage && (
          <nav className="hidden md:flex items-center gap-6 font-bold text-base">
            {steps.map((step) => {
              const href = `/rock/${projectId}/${step.href}`;
              const active = pathname.includes(`/${step.href}`);
              return (
                <Link key={step.href} href={href} className={`transition-opacity ${active ? "text-red-700 border-b-4 border-amber-400 pb-1" : "text-slate-500 hover:text-red-600"}`}>
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
