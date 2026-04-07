import { enqueueDailyAutomationJobs } from "@/lib/automation";
import { NextRequest, NextResponse } from "next/server";

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
    const count = Number(body.count || 10);
    const inserted = await enqueueDailyAutomationJobs(count);
    return NextResponse.json({ queued: inserted });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to enqueue jobs" },
      { status: 500 }
    );
  }
}
