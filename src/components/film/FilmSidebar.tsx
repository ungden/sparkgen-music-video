"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { icon: "movie_filter", label: "Films", href: "/film", disabled: false },
  { icon: "home", label: "Music Videos", href: "/dashboard", disabled: false },
];

export default function FilmSidebar() {
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

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 flex-col py-8 h-screen w-64 rounded-r-[3rem] overflow-hidden bg-violet-50 shadow-xl shadow-violet-900/5">
      <div className="px-8 mb-10">
        <h1 className="text-xl font-black text-violet-700 tracking-tight">SparkGen AI</h1>
        <p className="text-xs text-on-surface-variant font-bold opacity-70">Film Studio</p>
      </div>

      <nav className="flex-grow space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 mx-4 transition-all duration-200 ${
              pathname.startsWith(item.href) && item.href !== "/dashboard"
                ? "bg-violet-600 text-white rounded-full"
                : "text-slate-500 hover:text-violet-600 hover:bg-violet-100"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-4 mt-auto space-y-2">
        <div className="bg-violet-100/50 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center overflow-hidden">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-violet-700">person</span>
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="font-bold truncate text-on-surface text-sm">{displayName}</p>
            <p className="text-[10px] text-on-surface-variant truncate">{user?.email || ""}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-sm">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
