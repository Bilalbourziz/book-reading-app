import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { assertAdmin } from "../admin.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

function getServerEnvValue(name: string) {
  return process.env[name]?.trim().replace(/^["']|["']$/g, "");
}

function hasSupabaseAdminKey() {
  return Boolean(getServerEnvValue("SUPABASE_SERVICE_ROLE_KEY"));
}

async function getSupabaseAdminClient() {
  if (!hasSupabaseAdminKey()) {
    throw new Error(
      "This admin action requires SUPABASE_SERVICE_ROLE_KEY on the server. Use the Supabase Settings > API Keys secret key.",
    );
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertAdmin(context.claims.email as string | undefined);

    if (!hasSupabaseAdminKey()) {
      const { data: profiles, error } = await context.supabase
        .from("profiles")
        .select("id, email, display_name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (profiles ?? []).map((profile) => ({
        id: profile.id,
        email: profile.email || "Email unavailable",
        display_name: profile.display_name,
        created_at: profile.created_at || "",
      }));
    }

    const supabaseAdmin = await getSupabaseAdminClient();

    const [{ data: authData, error: authError }, { data: profiles, error: profileError }] =
      await Promise.all([
        supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
        supabaseAdmin.from("profiles").select("id, email, display_name, created_at").order("created_at", { ascending: false }),
      ]);

    if (authError) throw authError;
    if (profileError) throw profileError;

    return authData.users
      .map((authUser) => {
        const profile = profiles?.find((p) => p.id === authUser.id);
        return {
          id: authUser.id,
          email: authUser.email || "No email",
          display_name: profile?.display_name || null,
          created_at: authUser.created_at || profile?.created_at || "",
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    assertAdmin(context.claims.email as string | undefined);

    const supabaseAdmin = await getSupabaseAdminClient();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { success: true };
  });

export const updateAdminUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      userId: z.string().uuid(),
      display_name: z.string().min(1).max(100),
    }),
  )
  .handler(async ({ context, data }) => {
    assertAdmin(context.claims.email as string | undefined);

    const client = hasSupabaseAdminKey() ? await getSupabaseAdminClient() : context.supabase;
    const { error } = await client
      .from("profiles")
      .update({ display_name: data.display_name })
      .eq("id", data.userId);
    if (error) throw error;
    return { success: true };
  });

export const updateAdminUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      userId: z.string().uuid(),
      password: z.string().min(6, "Password must be at least 6 characters"),
    }),
  )
  .handler(async ({ context, data }) => {
    assertAdmin(context.claims.email as string | undefined);

    const supabaseAdmin = await getSupabaseAdminClient();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) {
      if (/invalid api key/i.test(error.message)) {
        throw new Error(
          "Supabase rejected the admin API key. Put the server secret key from Settings > API Keys > Secret keys in SUPABASE_SERVICE_ROLE_KEY, then restart the dev server.",
        );
      }
      throw error;
    }
    return { success: true };
  });

export const createAdminBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(bookInputSchema)
  .handler(async ({ context, data }) => {
    assertAdmin(context.claims.email as string | undefined);

    const { error } = await context.supabase.from("books").insert({
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
  });

export const updateAdminBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(bookInputSchema.extend({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    assertAdmin(context.claims.email as string | undefined);

    const { id, ...book } = data;
    const { error } = await context.supabase.from("books").update(book).eq("id", id);
    if (error) throw error;
    return { success: true };
  });

export const deleteAdminBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ bookId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    assertAdmin(context.claims.email as string | undefined);

    const { error } = await context.supabase.from("books").delete().eq("id", data.bookId);
    if (error) throw error;
    return { success: true };
  });

export const getAdminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertAdmin(context.claims.email as string | undefined);

    const client = hasSupabaseAdminKey() ? await getSupabaseAdminClient() : context.supabase;

    const [books, users, favorites, bookmarks, progress] = await Promise.all([
      client.from("books").select("*", { count: "exact", head: true }),
      client.from("profiles").select("*", { count: "exact", head: true }),
      client.from("favorites").select("*", { count: "exact", head: true }),
      client.from("bookmarks").select("*", { count: "exact", head: true }),
      client.from("reading_progress").select("*", { count: "exact", head: true }),
    ]);

    return {
      books: books.count || 0,
      users: users.count || 0,
      favorites: favorites.count || 0,
      bookmarks: bookmarks.count || 0,
      progress: progress.count || 0,
    };
  });

export const getAdminFavoritedBooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertAdmin(context.claims.email as string | undefined);

    const client = hasSupabaseAdminKey() ? await getSupabaseAdminClient() : context.supabase;

    const { data, error } = await client
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
  });

export const getAdminProgressOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertAdmin(context.claims.email as string | undefined);

    const client = hasSupabaseAdminKey() ? await getSupabaseAdminClient() : context.supabase;

    const { data, error, count } = await client
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
  });

export const getAdminUserStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    assertAdmin(context.claims.email as string | undefined);

    const client = hasSupabaseAdminKey() ? await getSupabaseAdminClient() : context.supabase;

    const [favoritesCount, progressCount, bookmarksCount] = await Promise.all([
      client.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", data.userId),
      client.from("reading_progress").select("*", { count: "exact", head: true }).eq("user_id", data.userId),
      client.from("bookmarks").select("*", { count: "exact", head: true }).eq("user_id", data.userId),
    ]);

    const [favoriteBooks, readingBooks, bookmarkEntries] = await Promise.all([
      client
        .from("favorites")
        .select("book_id, book:books(id, title, author, cover_url, year)")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(10),
      client
        .from("reading_progress")
        .select("book_id, last_page, updated_at, book:books(id, title, author, cover_url)")
        .eq("user_id", data.userId)
        .order("updated_at", { ascending: false })
        .limit(10),
      client
        .from("bookmarks")
        .select("id, book_id, page, note, book:books(id, title, author)")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
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
  });
