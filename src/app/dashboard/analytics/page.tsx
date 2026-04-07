import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Top songs by play count
  const { data: topSongs } = await supabase
    .from("songs")
    .select("id, title, artist, play_count, difficulty_level, is_published, categories(name)")
    .eq("is_published", true)
    .order("play_count", { ascending: false })
    .limit(10);

  // Genre/category stats
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true);

  const genreStats = await Promise.all(
    (categories ?? []).map(async (cat: { id: string; name: string }) => {
      const { count } = await supabase
        .from("songs")
        .select("*", { count: "exact", head: true })
        .eq("category_id", cat.id)
        .eq("is_published", true);
      const { data: plays } = await supabase
        .from("songs")
        .select("play_count")
        .eq("category_id", cat.id)
        .eq("is_published", true);
      const totalPlays = (plays ?? []).reduce(
        (sum: number, s: { play_count: number | null }) => sum + (s.play_count ?? 0),
        0
      );
      return { ...cat, songCount: count ?? 0, totalPlays };
    })
  );

  // Overall stats
  const { data: allSongs } = await supabase
    .from("songs")
    .select("play_count")
    .eq("is_published", true);
  const totalPlays = (allSongs ?? []).reduce(
    (sum: number, s: { play_count: number | null }) => sum + (s.play_count ?? 0),
    0
  );

  const { count: totalListens } = await supabase
    .from("listening_history")
    .select("*", { count: "exact", head: true });

  const { count: totalFavorites } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Play Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalPlays.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Listening Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalListens ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalFavorites ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Songs */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Top Songs by Play Count</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead className="text-right">Plays</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(topSongs ?? []).map((song: any, i: number) => (
                <TableRow key={song.id}>
                  <TableCell className="font-bold text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{song.title}</TableCell>
                  <TableCell>{song.artist ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(song.categories as { name: string })?.name ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(song.play_count ?? 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Genre Popularity */}
      <Card>
        <CardHeader>
          <CardTitle>Genre Popularity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Genre</TableHead>
                <TableHead className="text-right">Songs</TableHead>
                <TableHead className="text-right">Total Plays</TableHead>
                <TableHead className="text-right">Avg Plays/Song</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {genreStats
                .sort((a, b) => b.totalPlays - a.totalPlays)
                .map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-right">{cat.songCount}</TableCell>
                    <TableCell className="text-right font-mono">
                      {cat.totalPlays.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {cat.songCount > 0
                        ? Math.round(cat.totalPlays / cat.songCount).toLocaleString()
                        : 0}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
