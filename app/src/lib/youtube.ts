import { createAdminClient } from "@/lib/supabase/admin";

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/youtube/callback`;

export function getYouTubeAuthUrl(): string {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  if (!clientId) throw new Error("YOUTUBE_CLIENT_ID not set");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function handleYouTubeCallback(code: string) {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("YouTube OAuth credentials not set");

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.access_token) throw new Error("Failed to exchange code for tokens");

  // Get channel info
  const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const channelData = await channelRes.json();
  const channel = channelData.items?.[0];
  if (!channel) throw new Error("No YouTube channel found for this account");

  const supabase = createAdminClient();
  await supabase.from("integration_settings").upsert({
    provider: "youtube",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
    is_connected: true,
    channel_id: channel.id,
    channel_name: channel.snippet?.title,
    updated_at: new Date().toISOString(),
  });

  return channel.snippet?.title;
}

/**
 * Upload a video to YouTube via OAuth2 + resumable upload.
 * Returns the YouTube video ID if successful, null if not connected or disabled.
 */
export async function uploadVideoToYouTube(params: {
  videoBuffer?: Buffer;
  videoUrl?: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus?: string;
}): Promise<{ id: string } | null> {
  const supabase = createAdminClient();

  const { data: config } = await supabase
    .from("integration_settings")
    .select("*")
    .eq("provider", "youtube")
    .single();

  if (!config?.is_connected || !config?.refresh_token) {
    console.log("[youtube] Not connected, skipping upload");
    return null;
  }

  if (!config.auto_upload) {
    console.log("[youtube] Auto-upload disabled, skipping");
    return null;
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.log("[youtube] Missing YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET");
    return null;
  }

  // Refresh access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: config.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.access_token) {
    console.error("[youtube] Token refresh failed");
    return null;
  }

  await supabase.from("integration_settings").update({
    access_token: tokens.access_token,
    token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("provider", "youtube");

  // Resolve video buffer from URL if needed
  let videoBuffer = params.videoBuffer;
  if (!videoBuffer && params.videoUrl) {
    const videoRes = await fetch(params.videoUrl);
    if (!videoRes.ok) throw new Error(`Failed to fetch video from ${params.videoUrl}`);
    videoBuffer = Buffer.from(await videoRes.arrayBuffer());
  }
  if (!videoBuffer) throw new Error("No videoBuffer or videoUrl provided");

  console.log(`[youtube] Uploading "${params.title}" (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB)...`);

  // Resumable upload: initiate
  const initRes = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      "Content-Type": "application/json",
      "X-Upload-Content-Length": String(videoBuffer.length),
      "X-Upload-Content-Type": "video/mp4",
    },
    body: JSON.stringify({
      snippet: {
        title: params.title,
        description: params.description,
        tags: params.tags,
        categoryId: "10",
      },
      status: {
        privacyStatus: params.privacyStatus || "unlisted",
        selfDeclaredMadeForKids: false,
      },
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`YouTube init failed: ${initRes.status} ${err.slice(0, 200)}`);
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) throw new Error("No upload URL returned");

  // Upload video data
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: new Uint8Array(videoBuffer),
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`YouTube upload failed: ${uploadRes.status} ${err.slice(0, 200)}`);
  }

  const result = await uploadRes.json();
  console.log(`[youtube] Upload success! Video ID: ${result.id}`);
  return { id: result.id };
}
