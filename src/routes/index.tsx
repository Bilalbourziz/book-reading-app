import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Sparkles, ArrowRight, SlidersHorizontal, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/favorite-button";
import { getTopFavoritedBooks, getTotalFavoritesCount } from "@/lib/api/books.functions";

type Book = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  year: number | null;
  categories: string[];
  language?: string;
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — A cinematic digital library" },
      { name: "description", content: "Read timeless public-domain classics in a beautifully crafted reading room." },
      { property: "og:title", content: "Lumen — A cinematic digital library" },
      { property: "og:description", content: "Browse, read, and bookmark public-domain classics." },
    ],
  }),
  component: Index,
});

function Index() {
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState<string>("");
  const [genre, setGenre] = useState<string>("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id,title,author,description,cover_url,year,categories,language")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Book[];
    },
  });

  const { data: topFavorited = [] } = useQuery({
    queryKey: ["top-favorited-books"],
    queryFn: () => getTopFavoritedBooks(),
  });

  const { data: totalFavorites = 0 } = useQuery({
    queryKey: ["total-favorites-count"],
    queryFn: () => getTotalFavoritesCount(),
  });

  useEffect(() => {
    if (books.length === 0) return;
    const maxFeatured = Math.min(books.length, 10);
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % maxFeatured);
    }, 30000);
    return () => clearInterval(interval);
  }, [books.length]);

  useEffect(() => {
    const maxFeatured = Math.min(books.length, 10);
    if (featuredIndex >= maxFeatured && books.length > 0) {
      setFeaturedIndex(0);
    }
  }, [books.length, featuredIndex]);

  const filtered = useMemo(() => {
    let result = books;
    if (q.trim()) {
      const needle = q.toLowerCase();
      result = result.filter(
        (b) => b.title.toLowerCase().includes(needle) || b.author.toLowerCase().includes(needle),
      );
    }
    if (language) {
      result = result.filter((b) => b.language === language);
    }
    if (genre) {
      result = result.filter((b) => (b.categories ?? []).map((c: string) => c.toLowerCase()).includes(genre.toLowerCase()));
    }
    return result;
  }, [books, q, language, genre]);

  const featured = books[featuredIndex];
  const rails = useMemo(() => {
    const map = new Map<string, Book[]>();
    for (const b of filtered) {
      for (const c of b.categories ?? []) {
        if (!map.has(c)) map.set(c, []);
        map.get(c)!.push(b);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const hasFilters = q || language || genre;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div>
      {featured && !hasFilters && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            {featured.cover_url && (
              <img
                src={featured.cover_url}
                alt=""
                aria-hidden
                className="w-full h-full object-cover scale-110 blur-2xl opacity-40"
              />
            )}
            <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 py-4 md:py-32 grid md:grid-cols-[1fr_260px] gap-10 items-center">
            <div className="animate-fade-in text-center md:text-left" key={featured.id + "-text"}>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent mb-4">
                <Sparkles className="h-3.5 w-3.5" /> Featured tonight
              </div>
              <h1
                className="text-3xl md:text-7xl font-bold leading-[1.05] mb-4 tracking-tight"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {featured.title}
              </h1>
              <p className="text-muted-foreground text-base mb-2">
                by {featured.author}
                {featured.year && <span className="mx-2 text-muted-foreground/50">·</span>}
                {featured.year}
              </p>
              <p className="text-foreground/70 leading-relaxed mb-4 line-clamp-2 max-w-prose mx-auto md:mx-0">
                {featured.description}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                {books.length > 1 && books.slice(0, 10).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFeaturedIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === featuredIndex
                        ? "bg-accent scale-125"
                        : "bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={`Show book ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Link to="/read/$id" params={{ id: featured.id }}>
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground border-0 shadow-glow group">
                    <BookOpen className="h-4 w-4 mr-2" /> Start reading
                    <ArrowRight className="h-4 w-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Button>
                </Link>
                <Link to="/book/$id" params={{ id: featured.id }}>
                  <Button size="lg" variant="secondary" className="backdrop-blur-sm bg-white/5 hover:bg-white/10 border-white/10">
                    More info
                  </Button>
                </Link>
              </div>
            </div>
            <div className="animate-fade-in-scale w-full max-w-[220px] mx-auto" key={featured.id + "-cover"}>
              <div className="relative aspect-[2/3]">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl blur-2xl" />
                {featured.cover_url ? (
                  <img
                    src={featured.cover_url}
                    alt={featured.title}
                    className="w-full h-full rounded-lg shadow-cinematic ring-1 ring-white/10 relative object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-lg bg-secondary ring-1 ring-white/10 flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className={`max-w-7xl mx-auto px-6 ${featured && !hasFilters ? "pt-4 md:pt-10" : "pt-20"} space-y-6`}>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Search by title or author… (⌘K)'
              className="pl-11 h-12 bg-card/50 border-border/60 focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/50 text-base"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 md:hidden shrink-0 border-border/60"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden md:flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 rounded-lg bg-card/50 border border-border/60 text-sm hover:bg-card/80 transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 appearance-none"
            >
              <option value="">All Languages</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="px-3 py-2 rounded-lg bg-card/50 border border-border/60 text-sm hover:bg-card/80 transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 appearance-none"
            >
              <option value="">All Genres</option>
              <option value="Fiction">Fiction</option>
              <option value="Romance">Romance</option>
              <option value="Mystery">Mystery</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Adventure">Adventure</option>
              <option value="Gothic">Gothic</option>
              <option value="Historical">Historical</option>
              <option value="Drama">Drama</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Horror">Horror</option>
            </select>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setQ(""); setLanguage(""); setGenre(""); }}
              className="text-sm text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>

        {showMobileFilters && (
          <div className="md:hidden glass-strong rounded-xl p-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filters</span>
              <button onClick={() => setShowMobileFilters(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-3 py-2 rounded-lg bg-background/50 border border-border/60 text-sm">
                <option value="">Language</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
              <select value={genre} onChange={(e) => setGenre(e.target.value)} className="px-3 py-2 rounded-lg bg-background/50 border border-border/60 text-sm">
                <option value="">Genre</option>
                <option value="Fiction">Fiction</option>
                <option value="Romance">Romance</option>
                <option value="Mystery">Mystery</option>
                <option value="Sci-Fi">Sci-Fi</option>
              </select>
            </div>
            {hasFilters && (
              <button onClick={() => { setQ(""); setLanguage(""); setGenre(""); }} className="text-sm text-muted-foreground hover:text-foreground transition text-center w-full">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {isLoading && (
          <div className="space-y-4">
            <div className="h-7 w-48 skeleton" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-fade-in animate-delay-{i}">
                  <div className="aspect-[2/3] rounded-md skeleton" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 w-3/4 skeleton" />
                    <div className="h-3 w-1/2 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!isLoading && (q || language || genre) ? (
          <>
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-semibold mb-2 tracking-tight">
                Search results
                {q && <span className="text-muted-foreground font-normal"> for "{q}"</span>}
                {language && <span className="text-muted-foreground font-normal"> in {language === 'ar' ? 'العربية' : language === 'fr' ? 'Français' : 'English'}</span>}
                {genre && <span className="text-muted-foreground font-normal"> — {genre}</span>}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">{filtered.length} book{filtered.length !== 1 ? "s" : ""} found</p>
              <Rail books={filtered} />
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium mb-1">No books found</p>
                <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or search query.</p>
                <Button variant="outline" onClick={() => { setQ(""); setLanguage(""); setGenre(""); }}>
                  Clear all filters
                </Button>
              </div>
            )}
          </>
        ) : !isLoading ? (
          <>
            {topFavorited.length > 0 && (
              <div className="animate-fade-in-up">
                <div className="flex items-center gap-2 mb-5">
                  <Heart className="h-5 w-5 text-destructive fill-destructive animate-pulse" />
                  <h2 className="text-xl font-semibold tracking-tight">Most Favorited</h2>
                  <span className="text-xs text-muted-foreground ml-auto">{totalFavorites} total favorites</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 mb-10">
                  {topFavorited.map((b) => (
                    <BookCard key={b.id} book={b} showStats />
                  ))}
                </div>
              </div>
            )}

            {rails.map(([cat, list], idx) => (
              <div key={cat} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-semibold tracking-tight">{cat}</h2>
                  <span className="text-xs text-muted-foreground">{list.length} book{list.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {list.map((b) => (
                    <BookCard key={b.id} book={b} />
                  ))}
                </div>
              </div>
            ))}
            {filtered.length > 0 && (
              <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-semibold tracking-tight">All books</h2>
                  <span className="text-xs text-muted-foreground">{filtered.length} book{filtered.length !== 1 ? "s" : ""}</span>
                </div>
                <Rail books={filtered} />
              </div>
            )}
          </>
        ) : null}
      </section>
    </div>
  );
}

function Rail({ books }: { books: Book[] }) {
  if (!books.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
      {books.map((b) => (
        <BookCard key={b.id} book={b} />
      ))}
    </div>
  );
}

function BookCard({ book, showStats }: { book: Book & { count?: number }; showStats?: boolean }) {
  return (
    <div className="group">
      <Link to="/book/$id" params={{ id: book.id }}>
        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary ring-1 ring-border/60 group-hover:ring-primary/60 transition-all duration-500 shadow-cinematic relative card-hover">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              loading="lazy"
              className="w-full h-full object-cover transition duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-muted-foreground text-xs p-4 text-center">
              <div>
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <span className="text-xs">{book.title}</span>
              </div>
            </div>
          )}

          {showStats && typeof book.count === "number" && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ring-white/10 shadow-sm">
              <Heart className="h-3 w-3 text-destructive fill-destructive" />
              <span>{book.count}</span>
            </div>
          )}

          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-start justify-end p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none">
            <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <FavoriteButton bookId={book.id} />
            </div>
          </div>
        </div>
      </Link>
      <div className="mt-3">
        <Link to="/book/$id" params={{ id: book.id }} className="group/link">
          <p className="text-sm font-medium leading-tight line-clamp-2 group-hover/link:text-primary transition-colors">
            {book.title}
          </p>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">{book.author}</p>
      </div>
    </div>
  );
}