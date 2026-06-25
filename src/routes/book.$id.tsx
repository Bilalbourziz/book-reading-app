import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-hook";
import { Button } from "@/components/ui/button";
import { Heart, BookOpen, ArrowLeft, Share2, Calendar, BookMarked } from "lucide-react";
import { toast } from "sonner";
import { ReviewsSection } from "@/components/reviews-section";

export const Route = createFileRoute("/book/$id")({
  loader: async ({ params }) => {
    const { data, error } = await supabase.from("books").select("*").eq("id", params.id).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { book: data };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.book.title} — Lumen` },
            { name: "description", content: loaderData.book.description ?? `Read ${loaderData.book.title} by ${loaderData.book.author} on Lumen.` },
            { name: "author", content: loaderData.book.author },
            { property: "og:title", content: loaderData.book.title },
            { property: "og:description", content: loaderData.book.description ?? `Read ${loaderData.book.title} by ${loaderData.book.author} on Lumen.` },
            { property: "og:type", content: "book" },
            { property: "og:url", content: `https://lumen-book.click/book/${loaderData.book.id}` },
            ...(loaderData.book.cover_url ? [
              { property: "og:image", content: loaderData.book.cover_url },
              { property: "og:image:alt", content: loaderData.book.title },
            ] : []),
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:title", content: loaderData.book.title },
            { name: "twitter:description", content: loaderData.book.description ?? `Read ${loaderData.book.title} by ${loaderData.book.author} on Lumen.` },
            ...(loaderData.book.cover_url ? [{ name: "twitter:image", content: loaderData.book.cover_url }] : []),
          ],
          links: [
            { rel: "canonical", href: `https://lumen-book.click/book/${loaderData.book.id}` },
          ],
          scripts: [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Book",
                "name": loaderData.book.title,
                "author": {
                  "@type": "Person",
                  "name": loaderData.book.author,
                },
                ...(loaderData.book.description ? { "description": loaderData.book.description } : {}),
                ...(loaderData.book.year ? { "datePublished": loaderData.book.year.toString() } : {}),
                ...(loaderData.book.cover_url ? { "image": loaderData.book.cover_url } : {}),
                "url": `https://lumen-book.click/book/${loaderData.book.id}`,
              }),
            },
          ],
        }
      : { 
          meta: [{ title: "Book — Lumen" }],
          links: [{ rel: "canonical", href: "https://lumen-book.click" }],
        },
  notFoundComponent: () => (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
        <BookMarked className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-semibold mb-2">Book not found</h1>
      <p className="text-muted-foreground text-sm mb-6">This book may have been removed or doesn't exist.</p>
      <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to library
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold mb-2">Couldn't load this book</h1>
      <p className="text-muted-foreground text-sm mb-6">{error.message}</p>
      <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to library
      </Link>
    </div>
  ),
  component: BookPage,
});

function BookPage() {
  const { book } = Route.useLoaderData();
  const { user } = useSession();
  const qc = useQueryClient();

  const { data: fav } = useQuery({
    queryKey: ["favorite", book.id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("book_id")
        .eq("user_id", user!.id)
        .eq("book_id", book.id)
        .maybeSingle();
      return !!data;
    },
  });

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to save favorites");
      if (fav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("book_id", book.id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, book_id: book.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorite", book.id] });
      qc.invalidateQueries({ queryKey: ["library"] });
      toast.success(fav ? "Removed from library" : "Saved to your library");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="relative min-h-screen">
      {/* Background blur */}
      {book.cover_url && (
        <div className="absolute inset-0 h-[520px] overflow-hidden -z-10">
          <img src={book.cover_url} aria-hidden alt="" className="w-full h-full object-cover blur-3xl opacity-30 scale-110" />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        </div>
      )}
      
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-24 animate-fade-in">
        {/* Back link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition mb-10 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" /> 
          Back to library
        </Link>
        
        <div className="grid md:grid-cols-[280px_1fr] gap-10 lg:gap-16">
          {/* Cover */}
          <div className="order-2 md:order-1">
            {book.cover_url ? (
              <div className="relative animate-fade-in-scale">
                <div className="absolute -inset-3 bg-gradient-to-br from-primary/15 to-accent/15 rounded-2xl blur-xl" />
                <img 
                  src={book.cover_url} 
                  alt={book.title} 
                  className="w-full rounded-xl shadow-cinematic ring-1 ring-white/10 relative" 
                />
              </div>
            ) : (
              <div className="aspect-[2/3] rounded-xl bg-gradient-to-br from-card to-secondary flex items-center justify-center ring-1 ring-border/60">
                <BookOpen className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="order-1 md:order-2 flex flex-col justify-center">
            {/* Meta badge */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {book.year && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {book.year}
                </span>
              )}
              {(book.categories ?? []).slice(0, 3).map((c: string) => (
                <span 
                  key={c} 
                  className="text-xs px-2.5 py-1 rounded-full bg-secondary/80 text-secondary-foreground border border-border/40"
                >
                  {c}
                </span>
              ))}
            </div>

            <h1 
              className="text-4xl md:text-5xl font-bold leading-tight mb-3 tracking-tight"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {book.title}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6">
              by <span className="text-foreground/90">{book.author}</span>
            </p>

            {/* Categories full list */}
            {(book.categories ?? []).length > 3 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {(book.categories ?? []).slice(3).map((c: string) => (
                  <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/40">
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {book.description && (
              <p className="text-foreground/75 leading-relaxed mb-8 max-w-prose text-[15px]">
                {book.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {book.source === "pdf" || book.content_url?.toLowerCase().includes(".pdf") ? (
                <a href={book.content_url}>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-glow hover:shadow-glow hover:opacity-90 transition-all group"
                  >
                    <BookOpen className="h-4 w-4 mr-2" /> 
                    Read now
                  </Button>
                </a>
              ) : (
              <Link to="/read/$id" params={{ id: book.id }}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-glow hover:shadow-glow hover:opacity-90 transition-all group"
                >
                  <BookOpen className="h-4 w-4 mr-2" /> 
                  Read now
                </Button>
              </Link>
              )}
              <Button 
                size="lg" 
                variant="secondary" 
                onClick={() => toggleFav.mutate()} 
                disabled={toggleFav.isPending}
                className={`backdrop-blur-sm bg-white/5 hover:bg-white/10 border-white/10 transition-all ${
                  fav ? "border-destructive/30 bg-destructive/10" : ""
                }`}
              >
                <Heart className={`h-4 w-4 mr-2 transition-all ${
                  fav ? "fill-destructive text-destructive scale-110" : ""
                }`} />
                {fav ? "In your library" : "Add to library"}
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <ReviewsSection bookId={book.id} />
        </div>
      </div>
    </div>
  );
}
