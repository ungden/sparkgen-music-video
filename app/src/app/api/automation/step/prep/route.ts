import { stepPrep } from "@/lib/automation";
import { after, NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest) {
  const secret = process.env.AUTOMATION_SECRET;
  return secret && request.headers.get("x-automation-secret") === secret;
}

function getBaseUrl(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
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
    const result = await stepPrep(jobId);

    // Chain: dispatch next step (images)
    const baseUrl = getBaseUrl(request);
    const secret = process.env.AUTOMATION_SECRET!;
    after(async () => {
      await fetch(`${baseUrl}/api/automation/step/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-automation-secret": secret },
        body: JSON.stringify({ jobId }),
      }).catch(() => {});
    });

    return NextResponse.json({ step: "prep", done: true, ...result });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "prep failed" },
      { status: 500 },
    );
  }
}
