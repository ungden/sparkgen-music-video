"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

export function SongsFilter({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("filter");
    } else {
      params.set("filter", value);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            current === f.value
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
