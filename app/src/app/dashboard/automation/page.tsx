import { createClient } from "@/lib/supabase/server";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Clock, CheckCircle2, AlertTriangle, PlayCircle } from "lucide-react";
import { TriggerParallelButton } from "./TriggerParallelButton";
import { AutomationFilter } from "./AutomationFilter";
import { formatDistanceToNow } from "date-fns";

// Ensure this page always fetches fresh data on load/refresh
export const dynamic = "force-dynamic";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

export default async function AutomationQueuePage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const params = await searchParams;
  const filter = params.filter || "all";
  const supabase = await createClient();

  let jobsQuery = supabase
    .from("automation_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter === "today") {
    jobsQuery = jobsQuery.gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
  } else if (filter === "week") {
    jobsQuery = jobsQuery.gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());
  } else if (filter === "running") {
    jobsQuery = jobsQuery.in("status", ["running", "queued"]);
  } else if (filter === "done") {
    jobsQuery = jobsQuery.eq("status", "done");
  } else if (filter === "error") {
    jobsQuery = jobsQuery.eq("status", "error");
  }

  const [
    { data: jobs, error },
    { data: stats }
  ] = await Promise.all([
    jobsQuery,
    supabase
      .from("automation_jobs")
      .select("status, estimated_cost")
  ]);

  if (error) {
    console.error("Failed to load automation jobs", error);
  }

  const jobsList = jobs || [];

  // Calculate stats
  const queuedCount = stats?.filter(s => s.status === "queued").length || 0;
  const runningCount = stats?.filter(s => s.status === "running").length || 0;
  const doneCount = stats?.filter(s => s.status === "done").length || 0;
  const errorCount = stats?.filter(s => s.status === "error").length || 0;
  const totalCost = stats?.reduce((acc, curr) => acc + (curr.estimated_cost || 0), 0) || 0;

  function getStatusBadge(status: string) {
    switch (status) {
      case "queued":
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700">Queued</Badge>;
      case "running":
        return <Badge className="bg-blue-500 hover:bg-blue-600 animate-pulse">Running</Badge>;
      case "done":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Done</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Auto refresh component triggers router.refresh() every 5 seconds to keep queue up to date */}
      <AutoRefresh intervalMs={5000} />

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Activity className="w-8 h-8 text-primary" />
          Automation Queue
        </h1>
        <p className="text-muted-foreground mt-1">Real-time status of background AI video generation tasks.</p>
        <div className="mt-3 flex items-center gap-3">
          <TriggerParallelButton />
          <AutomationFilter current={filter} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-sm border-border">
          <CardContent className="p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-semibold">Queued</span>
            </div>
            <span className="text-2xl font-black">{queuedCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border border-l-4 border-l-blue-500">
          <CardContent className="p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <PlayCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Running</span>
            </div>
            <span className="text-2xl font-black">{runningCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border border-l-4 border-l-emerald-500">
          <CardContent className="p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-semibold">Completed</span>
            </div>
            <span className="text-2xl font-black">{doneCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border border-l-4 border-l-rose-500">
          <CardContent className="p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-rose-500 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-semibold">Failed</span>
            </div>
            <span className="text-2xl font-black">{errorCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border border-l-4 border-l-amber-500 bg-amber-50/30">
          <CardContent className="p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <span className="material-symbols-outlined text-sm">payments</span>
              <span className="text-sm font-semibold">Total Cost</span>
            </div>
            <span className="text-2xl font-black text-amber-700">${totalCost.toFixed(2)}</span>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>Live view of the last 50 automation tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {jobsList.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
              No automation jobs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-semibold rounded-tl-lg">Task / Prompt</th>
                    <th className="px-4 py-3 font-semibold">Genre</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Timing</th>
                    <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobsList.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{job.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-sm" title={job.prompt}>
                          {job.prompt}
                        </div>
                        {job.error && (
                          <div className="text-xs text-rose-500 mt-1 max-w-sm truncate" title={job.error}>
                            Error: {job.error}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {job.genre ?? job.category_slug}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {job.completed_at && job.started_at ? (
                          <>
                            <div className="text-emerald-600 font-semibold">
                              {formatDuration(Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000))}
                            </div>
                            <div className="text-[10px] mt-0.5">
                              {new Date(job.completed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </>
                        ) : job.started_at ? (
                          <>
                            <div>Started {formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}</div>
                            <div className="text-[10px] text-blue-500 mt-0.5">{job.current_step || "prep"}</div>
                          </>
                        ) : (
                          <div>Queued</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {job.estimated_cost > 0 ? `$${job.estimated_cost.toFixed(3)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
