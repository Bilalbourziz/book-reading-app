import { supabase } from "@/integrations/supabase/client";

export type TopBook = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  year: number | null;
  categories: string[];
  language?: string;
  count: number;
};

export async function getTotalFavoritesCount(): Promise<number> {
  const { count, error } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

export async function getTopFavoritedBooks(): Promise<TopBook[]> {
  // Fetch all favorites from the DB
  const { data: favorites, error: favError } = await supabase
    .from("favorites")
    .select("book_id");

  if (favError) throw favError;

  // Count favorites per book
  const counts = new Map<string, number>();
  for (const f of favorites ?? []) {
    counts.set(f.book_id, (counts.get(f.book_id) || 0) + 1);
  }

  // If there are no favorites at all, return empty list
  if (counts.size === 0) {
    return [];
  }

  // Sort book IDs by favorite count desc
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const bookIds = sorted.map(([id]) => id);

  // Fetch the book details for these top favorited books
  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("id, title, author, description, cover_url, year, categories, language")
    .in("id", bookIds);

  if (booksError) throw booksError;

    // Map counts back to books and sort them according to the rank
    return sorted
      .map(([id, count]): TopBook | null => {
        const book = books?.find((b) => b.id === id);
        if (!book) return null;
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          description: book.description,
          cover_url: book.cover_url,
          year: book.year,
          categories: book.categories || [],
          language: book.language || undefined,
          count,
        };
      })
      .filter((b: TopBook | null): b is TopBook => b !== null);
}
