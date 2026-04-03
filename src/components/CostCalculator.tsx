"use client";

import { useState } from "react";
import {
  calculateProjectCost,
  CostOptions,
  DEFAULT_OPTIONS,
  VeoVersion,
  VeoSpeed,
  VeoResolution,
  LyriaTier,
  ImageModel,
  getVeoPrice,
  PRICING,
} from "@/lib/pricing";

function OptionChips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-1.5">
        {label}
      </label>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => !opt.disabled && onChange(opt.value)}
            disabled={opt.disabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              value === opt.value
                ? "bg-primary text-white shadow-sm"
                : opt.disabled
                ? "bg-surface-container text-outline opacity-40 cursor-not-allowed"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CostCalculator({
  actualScenes = 5,
}: {
  actualScenes?: number;
}) {
  const [opts, setOpts] = useState<CostOptions>({
    ...DEFAULT_OPTIONS,
    numScenes: actualScenes,
  });
  const [showDetail, setShowDetail] = useState(false);

  const update = (patch: Partial<CostOptions>) => {
    const next = { ...opts, ...patch };
    // Validate Veo combo exists
    if (getVeoPrice(next.veoVersion, next.veoSpeed, next.veoResolution) === null) {
      // Fall back to 720p if selected resolution not available
      if (getVeoPrice(next.veoVersion, next.veoSpeed, "720p") !== null) {
        next.veoResolution = "720p";
      } else if (getVeoPrice(next.veoVersion, "standard", next.veoResolution) !== null) {
        next.veoSpeed = "standard";
      }
    }
    setOpts(next);
  };

  const { items, totalCost, totalVideoDuration } = calculateProjectCost(opts);

  // Check which Veo combos are available
  const is4kAvailable = getVeoPrice(opts.veoVersion, opts.veoSpeed, "4k") !== null;
  const isFastAvailable = getVeoPrice(opts.veoVersion, "fast", opts.veoResolution) !== null;

  const steps = [
    { label: "Step 1: Idea & Lyrics", icon: "lightbulb", color: "text-primary", bg: "bg-primary", items: items.filter((i) => i.step === "Step 1") },
    { label: "Step 2: Storyboard & Images", icon: "image", color: "text-secondary", bg: "bg-secondary", items: items.filter((i) => i.step === "Step 2") },
    { label: "Step 3: Animation & Music", icon: "movie", color: "text-tertiary", bg: "bg-tertiary", items: items.filter((i) => i.step === "Step 3") },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dim p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">payments</span>
            <h3 className="font-black text-lg">Cost Estimate</h3>
          </div>
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
          >
            {showDetail ? "Collapse" : "Expand"}
          </button>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-4xl font-black">${totalCost.toFixed(2)}</span>
          <span className="text-white/60 text-sm font-bold">USD</span>
        </div>
        <p className="text-white/70 text-xs mt-1">
          {opts.numScenes} scenes x {opts.videoDuration}s = {totalVideoDuration}s total &bull; {opts.veoResolution} &bull; Veo {opts.veoVersion} {opts.veoSpeed}
        </p>
      </div>

      {showDetail && (
        <div className="p-5 space-y-5">
          {/* === VIDEO OPTIONS === */}
          <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-black text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">movie</span>
              Video Options
            </h4>

            {/* Scenes + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-1.5">
                  Scenes
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => update({ numScenes: Math.max(1, opts.numScenes - 1) })}
                    className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="text-lg font-black text-on-surface w-6 text-center">{opts.numScenes}</span>
                  <button
                    onClick={() => update({ numScenes: Math.min(10, opts.numScenes + 1) })}
                    className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
              <OptionChips
                label="Clip Duration"
                value={String(opts.videoDuration) as "4" | "6" | "8"}
                options={[
                  { value: "4", label: "4s" },
                  { value: "6", label: "6s" },
                  { value: "8", label: "8s" },
                ]}
                onChange={(v) => update({ videoDuration: Number(v) })}
              />
            </div>

            {/* Veo Version */}
            <OptionChips<VeoVersion>
              label="Veo Model"
              value={opts.veoVersion}
              options={[
                { value: "3.1", label: "Veo 3.1" },
                { value: "3", label: "Veo 3" },
                { value: "2", label: "Veo 2" },
              ]}
              onChange={(v) => update({ veoVersion: v })}
            />

            {/* Resolution */}
            <OptionChips<VeoResolution>
              label="Resolution"
              value={opts.veoResolution}
              options={[
                { value: "720p", label: "720p" },
                { value: "1080p", label: "1080p" },
                { value: "4k", label: "4K", disabled: !is4kAvailable },
              ]}
              onChange={(v) => update({ veoResolution: v })}
            />

            {/* Speed */}
            <OptionChips<VeoSpeed>
              label="Speed / Quality"
              value={opts.veoSpeed}
              options={[
                { value: "fast", label: `Fast ($${getVeoPrice(opts.veoVersion, "fast", opts.veoResolution)?.toFixed(2) || "?"}/s)`, disabled: !isFastAvailable },
                { value: "standard", label: `Standard ($${getVeoPrice(opts.veoVersion, "standard", opts.veoResolution)?.toFixed(2) || "?"}/s)` },
              ]}
              onChange={(v) => update({ veoSpeed: v })}
            />
          </div>

          {/* === IMAGE OPTIONS === */}
          <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-black text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-secondary">image</span>
              Image Model
            </h4>
            <OptionChips<ImageModel>
              label="Model"
              value={opts.imageModel}
              options={[
                { value: "imagen-4-fast", label: `Imagen Fast ($0.02)` },
                { value: "imagen-4-standard", label: `Imagen Std ($0.04)` },
                { value: "imagen-4-ultra", label: `Imagen Ultra ($0.06)` },
                { value: "gemini-3.1-flash-image-preview", label: `Gemini Flash (~$0.04)` },
              ]}
              onChange={(v) => update({ imageModel: v })}
            />
          </div>

          {/* === MUSIC OPTIONS === */}
          <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-black text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-tertiary">music_note</span>
              Music Model
            </h4>
            <OptionChips<LyriaTier>
              label="Lyria Tier"
              value={opts.lyriaTier}
              options={[
                { value: "clip", label: "Clip ~30s ($0.04)" },
                { value: "pro", label: "Pro ~2min ($0.08)" },
              ]}
              onChange={(v) => update({ lyriaTier: v })}
            />
          </div>

          {/* === COST BREAKDOWN === */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-widest">
              Breakdown
            </h4>
            {steps.map((step) => {
              const stepTotal = step.items.reduce((s, i) => s + i.totalCost, 0);
              return (
                <div key={step.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined text-sm ${step.color}`}>{step.icon}</span>
                    <span className="text-xs font-bold text-on-surface">{step.label}</span>
                    <span className="ml-auto text-xs font-black text-on-surface">${stepTotal.toFixed(4)}</span>
                  </div>
                  <div className="space-y-1 ml-6">
                    {step.items.map((item, j) => (
                      <div key={j} className="flex items-center justify-between text-[11px]">
                        <span className="text-on-surface-variant">
                          {item.description}
                          {item.quantity > 1 && <span className="text-outline"> x{item.quantity}</span>}
                          <span className="text-outline-variant ml-1">({item.model})</span>
                        </span>
                        <span className="text-on-surface-variant font-mono">${item.totalCost.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="border-t border-surface-container-high pt-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-on-surface">Total</span>
              <span className="text-2xl font-black text-primary">${totalCost.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1">
              = {totalVideoDuration}s video @ {opts.veoResolution} &bull; {opts.numScenes} AI images &bull; {opts.lyriaTier === "pro" ? "~2min" : "~30s"} soundtrack
            </p>
          </div>

          {/* Cost Distribution Bar */}
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">
              Cost Distribution
            </p>
            <div className="h-4 rounded-full overflow-hidden flex">
              {steps.map((step, i) => {
                const stepTotal = step.items.reduce((s, item) => s + item.totalCost, 0);
                const pct = totalCost > 0 ? (stepTotal / totalCost) * 100 : 33;
                return (
                  <div
                    key={i}
                    className={`${step.bg} transition-all duration-300`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                    title={`${step.label}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              {steps.map((step, i) => {
                const stepTotal = step.items.reduce((s, item) => s + item.totalCost, 0);
                const pct = totalCost > 0 ? (stepTotal / totalCost) * 100 : 33;
                return (
                  <div key={i} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${step.bg}`} />
                    <span className="text-[9px] text-on-surface-variant font-bold">
                      {step.label.split(":")[0]} {pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Compare */}
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">
              Quick Compare
            </p>
            <div className="space-y-2 text-xs">
              {[
                { label: "Budget (5 scenes, 4s, 720p Fast)", opts: { numScenes: 5, videoDuration: 4, veoVersion: "3.1" as VeoVersion, veoSpeed: "fast" as VeoSpeed, veoResolution: "720p" as VeoResolution, lyriaTier: "clip" as LyriaTier, imageModel: "imagen-4-fast" as ImageModel } },
                { label: "Standard (5 scenes, 6s, 1080p Std)", opts: { numScenes: 5, videoDuration: 6, veoVersion: "3.1" as VeoVersion, veoSpeed: "standard" as VeoSpeed, veoResolution: "1080p" as VeoResolution, lyriaTier: "clip" as LyriaTier, imageModel: "imagen-4-standard" as ImageModel } },
                { label: "Premium (8 scenes, 8s, 4K Std, Pro)", opts: { numScenes: 8, videoDuration: 8, veoVersion: "3.1" as VeoVersion, veoSpeed: "standard" as VeoSpeed, veoResolution: "4k" as VeoResolution, lyriaTier: "pro" as LyriaTier, imageModel: "imagen-4-ultra" as ImageModel } },
              ].map((preset) => {
                const { totalCost: presetCost } = calculateProjectCost(preset.opts);
                return (
                  <button
                    key={preset.label}
                    onClick={() => setOpts(preset.opts)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-container transition-colors text-left"
                  >
                    <span className="text-on-surface-variant">{preset.label}</span>
                    <span className="font-black text-on-surface">${presetCost.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
