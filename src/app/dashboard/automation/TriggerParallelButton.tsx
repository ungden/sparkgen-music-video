"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { triggerParallelBatch } from "./actions";

export function TriggerParallelButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ queued: number; triggered: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTrigger() {
    if (!confirm("This will enqueue 21 videos (3 per genre) and process them ALL in parallel. Continue?")) {
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await triggerParallelBatch(21);
      setResult({ queued: data.queued, triggered: data.triggered });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleTrigger}
        disabled={loading}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg"
      >
        <Rocket className="w-4 h-4 mr-2" />
        {loading ? "Triggering..." : "Trigger 21 Parallel Videos"}
      </Button>
      {result && (
        <span className="text-sm text-emerald-600 font-medium">
          Queued {result.queued}, triggered {result.triggered} parallel processes
        </span>
      )}
      {error && (
        <span className="text-sm text-rose-500 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
