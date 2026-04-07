import { stepRender } from "@/lib/automation";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest) {
  const secret = process.env.AUTOMATION_SECRET;
  return secret && request.headers.get("x-automation-secret") === secret;
}

export const runtime = "nodejs";
export const maxDuration = 800;

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await request.json();
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  try {
    const result = await stepRender(jobId);
    return NextResponse.json({ step: "render", done: true, ...result });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "render failed" },
      { status: 500 },
    );
  }
}
