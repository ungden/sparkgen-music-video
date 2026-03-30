"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { icon: "home", label: "Home", href: "/dashboard", disabled: false },
  { icon: "movie_filter", label: "Projects", href: "/dashboard", disabled: false },
  { icon: "auto_awesome", label: "Assets", href: "#", disabled: true },
  { icon: "folder_open", label: "Library", href: "#", disabled: true },
  { icon: "settings", label: "Settings", href: "#", disabled: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex flex-col py-8 h-screen w-64 rounded-r-[3rem] overflow-hidden bg-blue-50 shadow-xl shadow-blue-900/5">
      <div className="px-8 mb-10">
        <h1 className="text-xl font-black text-blue-700 tracking-tight">
          SparkGen AI
        </h1>
        <p className="text-xs text-on-surface-variant font-bold opacity-70">
          Creative Studio
        </p>
      </div>

      <nav className="flex-grow space-y-2">
        {navItems.map((item) =>
          item.disabled ? (
            <span
              key={item.label}
              className="flex items-center gap-3 px-4 py-3 mx-4 text-slate-400 cursor-not-allowed opacity-50"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </span>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 mx-4 transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-blue-600 text-white rounded-full"
                  : "text-slate-500 hover:text-blue-600 hover:bg-blue-100"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        )}
      </nav>

      <div className="px-4 mt-auto space-y-2">
        <div className="bg-blue-100/50 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-primary-container">person</span>
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="font-bold truncate text-on-surface text-sm">{displayName}</p>
            <p className="text-[10px] text-on-surface-variant truncate">{user?.email || ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
