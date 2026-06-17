import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-hook";
import { Card } from "@/components/ui/card";
import { BookOpen, Heart, Zap } from "lucide-react";

export function ReadingStats() {
  const { user } = useSession();

  const { data: stats = { favorites: 0, progress: 0, bookmarks: 0 } } = useQuery({
    queryKey: ["reading-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [favorites, progress, bookmarks] = await Promise.all([
        supabase
          .from("favorites")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id),
        supabase
          .from("reading_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id),
        supabase
          .from("bookmarks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user!.id),
      ]);

      return {
        favorites: favorites.count || 0,
        progress: progress.count || 0,
        bookmarks: bookmarks.count || 0,
      };
    },
  });

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <Card className="p-4 bg-card/60 backdrop-blur border-border/60 text-center">
        <div className="flex justify-center mb-2">
          <Heart className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-2xl font-bold">{stats.favorites}</p>
        <p className="text-xs text-muted-foreground">Favorites</p>
      </Card>

      <Card className="p-4 bg-card/60 backdrop-blur border-border/60 text-center">
        <div className="flex justify-center mb-2">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <p className="text-2xl font-bold">{stats.progress}</p>
        <p className="text-xs text-muted-foreground">Reading</p>
      </Card>

      <Card className="p-4 bg-card/60 backdrop-blur border-border/60 text-center">
        <div className="flex justify-center mb-2">
          <Zap className="h-5 w-5 text-accent" />
        </div>
        <p className="text-2xl font-bold">{stats.bookmarks}</p>
        <p className="text-xs text-muted-foreground">Bookmarks</p>
      </Card>
    </div>
  );
}
