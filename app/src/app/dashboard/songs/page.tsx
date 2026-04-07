import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SongsFilter } from "./SongsFilter";

export const dynamic = "force-dynamic";

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Elementary",
  3: "Intermediate",
  4: "Upper Int.",
  5: "Advanced",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function SongsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("songs")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });

  // Apply time filter
  const filter = params.filter || "all";
  if (filter === "today") {
    query = query.gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
  } else if (filter === "week") {
    query = query.gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());
  } else if (filter === "month") {
    query = query.gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());
  }

  const { data: songs } = await query;
  const { count: totalCount } = await supabase.from("songs").select("*", { count: "exact", head: true }).eq("is_published", true);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Songs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount ?? 0} published total{songs ? ` — showing ${songs.length}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SongsFilter current={filter} />
          <Button render={<Link href="/dashboard/songs/new" />}>
            Upload Song
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Plays</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs && songs.length > 0 ? (
              songs.map((song) => (
                <TableRow key={song.id}>
                  <TableCell>
                    <div className="font-medium">{song.title}</div>
                    <div className="text-xs text-muted-foreground">{song.artist ?? "SparkGen"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {(song.categories as { name: string } | null)?.name ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={song.is_published ? "default" : "secondary"}
                    >
                      {song.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(song.created_at)}
                    <div className="text-[10px]">
                      {new Date(song.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </TableCell>
                  <TableCell>{song.play_count}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" render={<Link href={`/dashboard/songs/${song.id}`} />}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No songs found for this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
