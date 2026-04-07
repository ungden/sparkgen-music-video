"use server";

import { enqueueDailyAutomationJobs } from "@/lib/automation";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";

const MAX_CONCURRENCY = 7;

export async function triggerParallelBatch(count: number = 21) {
  const queued = await enqueueDailyAutomationJobs(count);

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: jobs } = await supabase
    .from("automation_jobs")
    .select("id")
    .eq("status", "queued")
    .eq("run_date", today)
    .order("slot_index", { ascending: true });

  const allJobIds = (jobs ?? []).map((j: { id: string }) => j.id);
  const batchJobIds = allJobIds.slice(0, MAX_CONCURRENCY);

  const headersList = await headers();
  const proto = headersList.get("x-forwarded-proto") || "https";
  const host = headersList.get("host") || "localhost:3000";
  const baseUrl = `${proto}://${host}`;
  const secret = process.env.AUTOMATION_SECRET!;

  for (const jobId of batchJobIds) {
    fetch(`${baseUrl}/api/automation/step/prep`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-automation-secret": secret },
      body: JSON.stringify({ jobId }),
    }).catch(() => {});
  }

  return { queued, triggered: batchJobIds.length, remaining: allJobIds.length - batchJobIds.length, jobIds: allJobIds };
}
