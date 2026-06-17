import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-hook";
import { BookOpen, Grid3x3, List, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "My Library — γραπτός" }] }),
  component: Library,
});

type SortOption = "recent" | "title" | "author" | "year";
type ViewMode = "grid" | "list";

function Library() {
  const { user } = useSession();
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["library", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("book:books(id,title,author,cover_url,year)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => r.book).filter(Boolean);
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_progress")
        .select("last_page, updated_at, book:books(id,title,author,cover_url,year)")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const sortedFavorites = useMemo(() => {
    const sorted = [...favorites];
    switch (sortBy) {
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "author":
        return sorted.sort((a, b) => a.author.localeCompare(b.author));
      case "year":
        return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
      case "recent":
      default:
        return sorted;
    }
  }, [favorites, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-1 md:mb-2" style={{ fontFamily: "Playfair Display, serif" }}>My Library</h1>
        <p className="text-sm md:text-base text-muted-foreground">Your saved books and recent reads.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-full sm:w-[140px] bg-background/50 text-sm">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Added</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="author">Author</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border border-border/60 rounded-lg overflow-hidden w-full sm:w-auto">
          <Button
            variant="ghost"
            size="icon"
            className={`flex-1 sm:flex-none h-9 w-9 sm:w-9 rounded-none ${viewMode === "grid" ? "bg-primary/10" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`flex-1 sm:flex-none h-9 w-9 sm:w-9 rounded-none ${viewMode === "list" ? "bg-primary/10" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {progress.length > 0 && (
        <section className="mb-10 md:mb-14">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Continue reading</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-5">
            {progress.map((p: any) => p.book && (
              <Link key={p.book.id} to="/read/$id" params={{ id: p.book.id }} className="group">
                <div className="aspect-[2/3] rounded-md overflow-hidden bg-secondary ring-1 ring-border/60 group-hover:ring-primary/60 transition shadow-cinematic">
                  {p.book.cover_url && <img src={p.book.cover_url} alt={p.book.title} className="w-full h-full object-cover" />}
                </div>
                <p className="text-xs md:text-sm mt-2 line-clamp-2">{p.book.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Favorites</h2>
        {isLoading && <p className="text-muted-foreground text-sm md:text-base">Loading…</p>}
        {!isLoading && favorites.length === 0 && (
          <div className="text-center py-12 md:py-16 border border-dashed border-border rounded-lg">
            <BookOpen className="h-8 w-8 md:h-10 md:w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm md:text-base text-muted-foreground mb-4">No favorites yet.</p>
            <Link to="/" className="text-sm md:text-base text-primary underline">Browse the catalog</Link>
          </div>
        )}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {sortedFavorites.map((b: any) => (
              <Link key={b.id} to="/book/$id" params={{ id: b.id }} className="group">
                <div className="aspect-[2/3] rounded-md overflow-hidden bg-secondary ring-1 ring-border/60 group-hover:ring-primary/60 transition shadow-cinematic">
                  {b.cover_url && <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />}
                </div>
                <p className="text-sm font-medium mt-2 line-clamp-2">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.author}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedFavorites.map((b: any) => (
              <Link
                key={b.id}
                to="/book/$id"
                params={{ id: b.id }}
                className="flex items-center gap-4 p-3 rounded-lg bg-card/60 border border-border/60 hover:bg-card/80 hover:border-primary/40 transition group"
              >
                <div className="w-16 h-24 rounded overflow-hidden bg-secondary ring-1 ring-border/60 shrink-0">
                  {b.cover_url && <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.author}</p>
                  {b.year && <p className="text-xs text-muted-foreground/60 mt-1">{b.year}</p>}
                </div>
                <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}