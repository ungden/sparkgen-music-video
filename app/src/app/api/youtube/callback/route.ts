import { NextResponse } from "next/server";
import { handleYouTubeCallback } from "@/lib/youtube";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${url.origin}/dashboard/settings?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${url.origin}/dashboard/settings?error=no_code`);
  }

  try {
    await handleYouTubeCallback(code);
    return NextResponse.redirect(`${url.origin}/dashboard/settings?success=youtube_connected`);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(`${url.origin}/dashboard/settings?error=${errorMessage}`);
  }
}
