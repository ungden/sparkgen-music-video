import { processNextAutomationJob } from "@/lib/automation";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest) {
  const secret = process.env.AUTOMATION_SECRET;
  return secret && request.headers.get("x-automation-secret") === secret;
}

export const runtime = "nodejs";
export const maxDuration = 800;

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processNextAutomationJob();
    if (!result) {
      return NextResponse.json({ processed: false, message: "No queued jobs" });
    }

    return NextResponse.json({ processed: true, ...result });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process next job" },
      { status: 500 }
    );
  }
}
