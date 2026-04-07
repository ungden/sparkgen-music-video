import { NextResponse } from "next/server";
import { getYouTubeAuthUrl } from "@/lib/youtube";

export async function GET() {
  const url = getYouTubeAuthUrl();
  return NextResponse.redirect(url);
}
