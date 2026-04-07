import { stepImages } from "@/lib/automation";
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
    await stepImages(jobId);

    // Chain: dispatch videos+render on Railway (no timeout)
    const renderUrl = process.env.RENDER_SERVICE_URL;
    const baseUrl = getBaseUrl(request);
    const secret = process.env.AUTOMATION_SECRET!;
    const videosTarget = renderUrl ? `${renderUrl}/videos` : `${baseUrl}/api/automation/step/videos`;
    after(async () => {
      await fetch(videosTarget, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-automation-secret": secret },
        body: JSON.stringify({ jobId }),
      }).catch(() => {});
    });

    return NextResponse.json({ step: "images", done: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "images failed" },
      { status: 500 },
    );
  }
}
