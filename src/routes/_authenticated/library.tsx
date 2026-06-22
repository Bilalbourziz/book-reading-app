import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-hook";
import { BookOpen, Grid3x3, List, ArrowUpDown, BookMarked, Trash2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "My Library — Lumen" }] }),
  component: Library,
});

type SortOption = "recent" | "title" | "author" | "year";
type ViewMode = "grid" | "list";

function Library() {
  const { user } = useSession();
  const qc = useQueryClient();
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

  // Fetch user's submitted books (approved)
  const { data: myBooks = [] } = useQuery({
    queryKey: ["my-books", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_submissions")
        .select("id,title,author,cover_url,year,status")
        .eq("user_id", user!.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch user's bookmarks to show which books are bookmarked
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["bookmarks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("book_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((b: any) => b.book_id);
    },
  });

  // Bookmark (Read Later) mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const { error } = await supabase.from("bookmarks").insert({
        book_id: bookId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library", user?.id] });
      toast.success("Added to Read Later");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("book_id", bookId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library", user?.id] });
      toast.success("Removed from Read Later");
    },
    onError: (e: Error) => toast.error(e.message),
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

  const handleBookmarkToggle = (bookId: string, isBookmarked: boolean) => {
    if (isBookmarked) {
      removeBookmarkMutation.mutate(bookId);
    } else {
      bookmarkMutation.mutate(bookId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>My Library</h1>
          <p className="text-muted-foreground">Your saved books and recent reads.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[140px] bg-background/50">
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
          <div className="flex border border-border/60 rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-none ${viewMode === "grid" ? "bg-primary/10" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-none ${viewMode === "list" ? "bg-primary/10" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {progress.length > 0 && (
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Continue reading</h2>
            <span className="text-xs text-muted-foreground ml-auto">{progress.length} book{progress.length !== 1 ? "s" : ""} in progress</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
            {progress.map((p: any) => p.book && (
              <Link key={p.book.id} to="/read/$id" params={{ id: p.book.id }} className="group">
                <div className="aspect-[2/3] rounded-md overflow-hidden bg-secondary ring-1 ring-border/60 group-hover:ring-primary/60 transition shadow-cinematic relative">
                  {p.book.cover_url && <img src={p.book.cover_url} alt={p.book.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />}
                  {!p.book.cover_url && (
                    <div className="w-full h-full grid place-items-center text-muted-foreground p-4">
                      <BookOpen className="h-8 w-8 mb-2 opacity-40 mx-auto" />
                      <p className="text-xs text-center">{p.book.title}</p>
                    </div>
                  )}
                  {/* Page badge */}
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-white/10 shadow-sm">
                    <BookOpen className="h-2.5 w-2.5" />
                    <span>p. {p.last_page}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                      style={{ width: `${Math.min(100, (p.last_page || 1))}%` }}
                    />
                  </div>
                </div>
                <div className="mt-2.5">
                  <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">{p.book.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.book.author}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    Updated {new Date(p.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {myBooks.length > 0 && (
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <BookMarked className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold tracking-tight">My Books</h2>
            <span className="text-xs text-muted-foreground ml-auto">{myBooks.length} book{myBooks.length !== 1 ? "s" : ""} submitted</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {myBooks.map((book: any) => {
              const isBookmarked = bookmarks.includes(book.id);
              return (
                <div key={book.id} className="group relative">
                  <Link to="/book/$id" params={{ id: book.id }} className="block">
                    <div className="aspect-[2/3] rounded-md overflow-hidden bg-secondary ring-1 ring-border/60 group-hover:ring-primary/60 transition shadow-cinematic relative">
                      {book.cover_url && <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />}
                      {!book.cover_url && (
                        <div className="w-full h-full grid place-items-center text-muted-foreground p-4">
                          <BookOpen className="h-8 w-8 mb-2 opacity-40 mx-auto" />
                          <p className="text-xs text-center">{book.title}</p>
                        </div>
                      )}
                      {/* Bookmark button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleBookmarkToggle(book.id, isBookmarked);
                        }}
                        className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100"
                      >
                        <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-accent text-accent" : ""}`} />
                      </button>
                    </div>
                    <p className="text-sm font-medium mt-2 line-clamp-2 group-hover:text-primary transition-colors">{book.title}</p>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Favorites</h2>
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {!isLoading && favorites.length === 0 && (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No favorites yet.</p>
            <Link to="/" className="text-primary underline">Browse the catalog</Link>
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