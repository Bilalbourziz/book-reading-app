import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Bookmark, Heart, Users, Star, FileText } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getAdminDashboardStats, getAdminFavoritedBooks } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Lumen" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats, isError: statsError, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => getAdminDashboardStats(),
  });

  const { data: recentBooks = [] } = useQuery({
    queryKey: ["admin-recent-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, language, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: topCategories = [] } = useQuery({
    queryKey: ["admin-top-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("categories");
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const book of data ?? []) {
        for (const category of book.categories ?? []) {
          counts.set(category, (counts.get(category) || 0) + 1);
        }
      }

      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({ name, count }));
    },
  });

  const { data: topFavoritedBooks = [] } = useQuery({
    queryKey: ["admin-top-favorited"],
    queryFn: () => getAdminFavoritedBooks(),
  });

  const maxFavCount = topFavoritedBooks.length > 0 ? topFavoritedBooks[0].count : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Overview of your library and users.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Books" value={getStatValue(stats?.books, statsLoading, statsError)} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Users" value={getStatValue(stats?.users, statsLoading, statsError)} />
        <StatCard icon={<Heart className="h-5 w-5" />} label="Favorites" value={getStatValue(stats?.favorites, statsLoading, statsError)} />
        <StatCard icon={<Bookmark className="h-5 w-5" />} label="Bookmarks" value={getStatValue(stats?.bookmarks, statsLoading, statsError)} />
      </div>

      {topFavoritedBooks.length > 0 && (
        <Card className="p-6 bg-card/60 backdrop-blur border-border/60">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Most Favorited Books</h3>
            <span className="text-xs text-muted-foreground ml-auto">Based on user favorites</span>
          </div>
          <div className="space-y-3">
            {topFavoritedBooks.map((book, idx) => (
              <div key={book.title} className="flex items-center gap-4">
                <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">
                  #{idx + 1}
                </span>
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-8 h-12 rounded object-cover ring-1 ring-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-12 rounded bg-secondary shrink-0 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="h-6 rounded-full bg-gradient-to-r from-primary/40 to-accent/40"
                    style={{ width: `${Math.max((book.count / maxFavCount) * 120, 20)}px` }}
                  />
                  <span className="text-xs font-semibold w-6 text-right">{book.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/60 backdrop-blur border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Books</h3>
            <Link to="/admin/books">
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </Link>
          </div>
          {recentBooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No books yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentBooks.map((book: { id: string; title: string; author: string; language: string }) => (
                <li key={book.id} className="flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{book.title}</p>
                    <p className="text-muted-foreground truncate">{book.author}</p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-secondary/50 text-xs uppercase">
                    {book.language || "en"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6 bg-card/60 backdrop-blur border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Top Categories</h3>
            <Link to="/admin/books">
              <Button variant="outline" size="sm">
                Add Book
              </Button>
            </Link>
          </div>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topCategories.map(({ name, count }) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm"
                >
                  {name}
                  <span className="text-xs text-muted-foreground">({count})</span>
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/admin/books">
          <Card className="p-6 bg-card/60 backdrop-blur border-border/60 hover:bg-card/80 transition cursor-pointer h-full">
            <BookOpen className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Manage Books</h3>
            <p className="text-sm text-muted-foreground">Add, edit, or remove books from the catalog.</p>
          </Card>
        </Link>
        <Link to="/admin/users">
          <Card className="p-6 bg-card/60 backdrop-blur border-border/60 hover:bg-card/80 transition cursor-pointer h-full">
            <Users className="h-6 w-6 text-accent mb-3" />
            <h3 className="font-semibold mb-1">Manage Users</h3>
            <p className="text-sm text-muted-foreground">View user profiles, activity, and accounts.</p>
          </Card>
        </Link>
        <Link to="/admin/submissions">
          <Card className="p-6 bg-card/60 backdrop-blur border-border/60 hover:bg-card/80 transition cursor-pointer h-full">
            <FileText className="h-6 w-6 text-green-500 mb-3" />
            <h3 className="font-semibold mb-1">Submissions</h3>
            <p className="text-sm text-muted-foreground">Review and approve user book submissions.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function getStatValue(value: number | undefined, isLoading: boolean, isError: boolean) {
  if (isLoading) return "...";
  if (isError) return "!";
  return value ?? 0;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card className="p-5 bg-card/60 backdrop-blur border-border/60">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-primary/50">{icon}</div>
      </div>
    </Card>
  );
}
