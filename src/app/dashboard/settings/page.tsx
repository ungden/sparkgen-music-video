import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaySquare, Link as LinkIcon, Settings2, Unlink } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

// Server action to toggle auto upload
async function toggleAutoUpload(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const isAuto = formData.get("auto_upload") === "on";
  await supabase.from("integration_settings").update({ auto_upload: isAuto }).eq("provider", "youtube");
  revalidatePath("/dashboard/settings");
}

async function disconnectYouTube() {
  "use server";
  const supabase = await createClient();
  await supabase.from("integration_settings").update({
    is_connected: false,
    access_token: null,
    refresh_token: null,
    channel_id: null,
    channel_name: null
  }).eq("provider", "youtube");
  revalidatePath("/dashboard/settings");
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: yt } = await supabase.from("integration_settings").select("*").eq("provider", "youtube").single();

  const isConnected = yt?.is_connected;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings2 className="w-8 h-8 text-primary" />
          Settings & Integrations
        </h1>
        <p className="text-muted-foreground mt-1">Manage external accounts and system automation preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* YouTube Integration */}
        <Card className={`border-border shadow-sm overflow-hidden ${isConnected ? 'ring-1 ring-primary/20' : ''}`}>
          <div className="h-2 w-full bg-gradient-to-r from-red-500 to-rose-600" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-50 p-2.5 rounded-xl">
                  <PlaySquare className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">YouTube Integration</CardTitle>
                  <CardDescription className="mt-1">Connect your channel to publish AI videos instantly.</CardDescription>
                </div>
              </div>
              <Badge variant={isConnected ? "default" : "outline"} className={isConnected ? "bg-emerald-500" : ""}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-4 border-t bg-muted/20">
            {isConnected ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-xl border shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Connected Channel</p>
                    <p className="text-lg font-black text-foreground">{yt.channel_name || "Unknown Channel"}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{yt.channel_id}</p>
                  </div>
                  <form action={disconnectYouTube}>
                    <button className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                      <Unlink className="w-4 h-4" /> Disconnect
                    </button>
                  </form>
                </div>

                <div className="p-4 bg-white rounded-xl border shadow-sm">
                  <form action={toggleAutoUpload} className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-foreground">Auto-Publish New Videos</h4>
                      <p className="text-sm text-muted-foreground mt-1">If enabled, the automation pipeline will immediately upload finished videos to this YouTube channel as Unlisted.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="hidden" name="auto_upload" value={yt.auto_upload ? "off" : "on"} />
                      <button
                        type="submit"
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${yt.auto_upload ? 'bg-primary' : 'bg-muted-foreground'}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${yt.auto_upload ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <PlaySquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">No YouTube Channel Connected</h3>
                <p className="text-muted-foreground text-sm max-w-md mb-6">
                  You need to authenticate with Google to grant SparkGen permission to upload videos to your YouTube channel.
                </p>
                <a
                  href="/api/youtube/connect"
                  className="bg-red-600 text-white font-bold px-6 py-3 rounded-full hover:bg-red-700 hover:scale-105 transition-all shadow-md flex items-center gap-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  Connect with Google
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
