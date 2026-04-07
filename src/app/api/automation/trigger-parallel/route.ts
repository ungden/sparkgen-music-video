import { enqueueDailyAutomationJobs } from "@/lib/automation";
import { createAdminClient } from "@/lib/supabase/admin";
import { after, NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest) {
  const secret = process.env.AUTOMATION_SECRET;
  return secret && request.headers.get("x-automation-secret") === secret;
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const count = Number(body.count ?? 0);
    const concurrency = Math.min(Number(body.concurrency || 3), 21);

    // Only enqueue new jobs if count > 0
    let queued = 0;
    if (count > 0) {
      queued = await enqueueDailyAutomationJobs(count);
    }

    // Send all queued job IDs to Railway in one shot — Railway handles queue + concurrency
    const supabase = createAdminClient();
    const { data: jobs } = await supabase
      .from("automation_jobs")
      .select("id")
      .eq("status", "queued")
      .order("created_at", { ascending: true });

    const jobIds = (jobs ?? []).map((j: { id: string }) => j.id);

    const renderUrl = process.env.RENDER_SERVICE_URL;
    const secret = process.env.AUTOMATION_SECRET!;

    if (renderUrl && jobIds.length > 0) {
      after(async () => {
        try {
          await fetch(`${renderUrl}/enqueue`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-automation-secret": secret },
            body: JSON.stringify({ jobIds }),
          });
          console.log(`[trigger] Sent ${jobIds.length} jobs to Railway`);
        } catch (e) {
          console.error("[trigger] Failed to send to Railway:", e);
        }
      });
    }

    return NextResponse.json({
      queued: queued + jobIds.length,
      sent: jobIds.length,
      target: "railway",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to trigger" },
      { status: 500 },
    );
  }
}
