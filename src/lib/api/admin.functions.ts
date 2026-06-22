import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

const bookInputSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  description: z.string().optional(),
  cover_url: z.string().optional(),
  content_url: z.string().min(1),
  language: z.string().default("en"),
  year: z.number().nullable().optional(),
  categories: z.array(z.string()).default([]),
  source: z.string().default("manual"),
  external_id: z.string().optional(),
});

export async function listAdminUsers() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (profiles ?? []).map((profile: any) => ({
    id: profile.id,
    email: "See profile",
    display_name: profile.display_name,
    created_at: profile.created_at || "",
  }));
}

export async function deleteAdminUser(userId: string) {
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw error;
  return { success: true };
}

export async function updateAdminUserProfile(userId: string, display_name: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ display_name })
    .eq("id", userId);
  if (error) throw error;
  return { success: true };
}

export async function updateAdminUserPassword(_userId: string, _password: string) {
  throw new Error(
    "Password management is not available in SPA mode. Use the Supabase dashboard."
  );
}

export async function createAdminBook(data: z.infer<typeof bookInputSchema>) {
  const { error } = await supabase.from("books").insert({
    title: data.title,
    author: data.author,
    description: data.description || null,
    cover_url: data.cover_url || null,
    content_url: data.content_url,
    language: data.language,
    year: data.year ?? null,
    categories: data.categories,
    source: data.source,
    external_id: data.external_id || null,
  });
  if (error) throw error;
  return { success: true };
}

export async function updateAdminBook(bookId: string, data: z.infer<typeof bookInputSchema>) {
  const { error } = await supabase.from("books").update(data).eq("id", bookId);
  if (error) throw error;
  return { success: true };
}

export async function deleteAdminBook(bookId: string) {
  const { error } = await supabase.from("books").delete().eq("id", bookId);
  if (error) throw error;
  return { success: true };
}

export async function getAdminDashboardStats() {
  const [books, users, favorites, bookmarks, progress] = await Promise.all([
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("favorites").select("*", { count: "exact", head: true }),
    supabase.from("bookmarks").select("*", { count: "exact", head: true }),
    supabase.from("reading_progress").select("*", { count: "exact", head: true }),
  ]);

  return {
    books: books.count || 0,
    users: users.count || 0,
    favorites: favorites.count || 0,
    bookmarks: bookmarks.count || 0,
    progress: progress.count || 0,
  };
}

export async function getAdminFavoritedBooks() {
  const { data, error } = await supabase
    .from("favorites")
    .select("book:books(id, title, author, cover_url)");

  if (error) throw error;

  const counts = new Map<string, { title: string; author: string; cover_url: string | null; count: number }>();
  for (const row of data ?? []) {
    const book = (row as any).book;
    if (!book) continue;
    const existing = counts.get(book.id);
    if (existing) {
      existing.count++;
    } else {
      counts.set(book.id, { title: book.title, author: book.author, cover_url: book.cover_url, count: 1 });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export async function getAdminProgressOverview() {
  const { data, error, count } = await supabase
    .from("reading_progress")
    .select("user_id, book_id, last_page, updated_at, book:books(id, title, author, cover_url)", {
      count: "exact",
    })
    .order("updated_at", { ascending: false })
    .limit(8);

  if (error) throw error;

  const userIds = new Set<string>();
  const bookIds = new Set<string>();

  for (const row of data ?? []) {
    userIds.add(row.user_id);
    bookIds.add(row.book_id);
  }

  return {
    total: count ?? data?.length ?? 0,
    readers: userIds.size,
    books: bookIds.size,
    recent: (data ?? [])
      .map((row: any) => {
        const book = row.book;
        if (!book) return null;
        return {
          bookId: book.id,
          title: book.title,
          author: book.author,
          coverUrl: book.cover_url,
          lastPage: row.last_page,
          updatedAt: row.updated_at,
        };
      })
      .filter(Boolean),
  };
}

export async function getAdminUserStats(userId: string) {
  const [favoritesCount, progressCount, bookmarksCount] = await Promise.all([
    supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("reading_progress").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("bookmarks").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const [favoriteBooks, readingBooks, bookmarkEntries] = await Promise.all([
    supabase
      .from("favorites")
      .select("book_id, book:books(id, title, author, cover_url, year)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("reading_progress")
      .select("book_id, last_page, updated_at, book:books(id, title, author, cover_url)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("bookmarks")
      .select("id, book_id, page, note, book:books(id, title, author)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  return {
    favorites: favoritesCount.count || 0,
    progress: progressCount.count || 0,
    bookmarks: bookmarksCount.count || 0,
    favoriteBooks: (favoriteBooks.data ?? []).map((r: any) => r.book).filter(Boolean),
    readingBooks: (readingBooks.data ?? []).map((r: any) => {
      const book = r.book;
      if (!book) return null;
      return { title: book.title, author: book.author, cover_url: book.cover_url, last_page: r.last_page, updated_at: r.updated_at };
    }).filter(Boolean),
    bookmarkEntries: (bookmarkEntries.data ?? []).map((r: any) => {
      const book = r.book;
      if (!book) return null;
      return { id: r.id, page: r.page, note: r.note, title: book.title, author: book.author };
    }).filter(Boolean),
  };
}