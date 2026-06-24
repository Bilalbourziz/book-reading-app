import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://lumen-book.click";

export const Route = createFileRoute("/sitemap-xml")({
  loader: async () => {
    // Fetch all books from DB to include in sitemap
    const { data: books } = await supabase
      .from("books")
      .select("id, updated_at")
      .order("title");

    return { books: books ?? [] };
  },
  head: () => ({
    meta: [{ title: "Sitemap — Lumen" }],
  }),
  component: () => {
    const { books } = Route.useLoaderData();

    const staticEntries = [
      { path: "/", changefreq: "daily", priority: "1.0" },
      { path: "/auth", changefreq: "monthly", priority: "0.3" },
    ];

    const bookEntries = books.map((b: { id: string; updated_at: string | null }) => ({
      path: `/book/${b.id}`,
      lastmod: b.updated_at ?? undefined,
      changefreq: "weekly",
      priority: "0.8",
    }));

    const allEntries = [...staticEntries, ...bookEntries];

    const urls = allEntries.map((e) => {
      const lastmod = (e as any).lastmod ? `\n    <lastmod>${(e as any).lastmod}</lastmod>` : "";
      return `  <url>\n    <loc>${BASE_URL}${e.path}</loc>${lastmod}\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

    // Return XML response
    return (
      <div>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {xml}
        </pre>
      </div>
    );
  },
});