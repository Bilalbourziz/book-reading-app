import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Eye, Key, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAdminUser, getAdminUserStats, updateAdminUserPassword } from "@/lib/api/admin.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users Management — Admin" }] }),
  component: AdminUsers,
});

type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

type FavoriteBook = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  year: number | null;
  count: number;
};

type BookmarkEntry = {
  id: string;
  note: string | null;
  page: number;
  title: string;
  author: string;
};

type ReadingEntry = {
  title: string;
  author: string;
  cover_url: string | null;
  last_page: number;
  updated_at: string;
};

const EMAIL_UNAVAILABLE = "Email unavailable";

function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const { data: users = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const rpcUsers = await supabase.rpc("list_admin_users");

      if (!rpcUsers.error) {
        return (rpcUsers.data ?? []).map((user) => ({
          id: user.id,
          email: user.email || EMAIL_UNAVAILABLE,
          display_name: user.display_name,
          created_at: user.created_at || "",
        }));
      }

      const withEmail = await supabase
        .from("profiles")
        .select("id, email, display_name, created_at")
        .order("created_at", { ascending: false });

      if (!withEmail.error) {
        return (withEmail.data ?? []).map((profile) => ({
          id: profile.id,
          email: profile.email || EMAIL_UNAVAILABLE,
          display_name: profile.display_name,
          created_at: profile.created_at || "",
        }));
      }

      if (!withEmail.error.message.toLowerCase().includes("email")) {
        throw withEmail.error;
      }

      const withoutEmail = await supabase
        .from("profiles")
        .select("id, display_name, created_at")
        .order("created_at", { ascending: false });

      if (withoutEmail.error) throw withoutEmail.error;

      return (withoutEmail.data ?? []).map((profile) => ({
        id: profile.id,
        email: EMAIL_UNAVAILABLE,
        display_name: profile.display_name,
        created_at: profile.created_at || "",
      }));
    },
  });

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.display_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Users</h2>
        <p className="text-muted-foreground text-sm">View and manage registered users.</p>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email, name, or user ID..."
            className="pl-10"
          />
        </div>
        {users.some((user) => user.email === EMAIL_UNAVAILABLE) && (
          <p className="text-xs text-muted-foreground">
            Showing profile records because the admin users SQL function is not installed yet.
          </p>
        )}
        {!isLoading && !isError && users.length <= 1 && (
          <p className="text-xs text-muted-foreground">
            Only {users.length} user is visible. Run the admin users SQL migration in Supabase to read all Auth users.
          </p>
        )}
      </div>

      <Card className="bg-card/60 backdrop-blur border-border/60 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading users...</div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="font-medium text-destructive mb-2">Could not load users.</p>
            <p className="text-sm text-muted-foreground mb-4">{(error as Error).message}</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-2">No users found.</p>
            <p className="text-xs text-muted-foreground">
              If Supabase Auth has more users, run the profiles/admin visibility SQL migration so they appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/40 bg-background/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Display Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border/20 hover:bg-background/50 transition">
                    <td className="px-6 py-4 text-sm font-medium">
                      {user.email === EMAIL_UNAVAILABLE ? (
                        <span className="font-mono text-xs text-muted-foreground">{user.id}</span>
                      ) : (
                        user.email
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.display_name || "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user.email !== EMAIL_UNAVAILABLE && (
                          <DeleteUserButton userId={user.id} onSuccess={() => refetch()} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={() => {
            refetch();
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

function UserDetailsModal({
  user,
  onClose,
  onUpdated,
}: {
  user: UserProfile;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["user-stats", user.id],
    queryFn: async () => {
      const result = await getAdminUserStats(user.id);
      return {
        favorites: result.favorites,
        progress: result.progress,
        bookmarks: result.bookmarks,
        favoriteBooks: result.favoriteBooks as Array<{ id: string; title: string; author: string; cover_url: string | null; year: number | null }>,
        readingBooks: result.readingBooks as ReadingEntry[],
        bookmarkEntries: result.bookmarkEntries as BookmarkEntry[],
      };
    },
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Display name updated");
      onUpdated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePassword = useMutation({
    mutationFn: async () => {
      await updateAdminUserPassword(user.id, newPassword);
    },
    onSuccess: () => {
      toast.success("Password updated");
      setNewPassword("");
      setShowPasswordForm(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-12 pb-12 px-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-lg bg-card/90 backdrop-blur border-border/60">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">User Details</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className={user.email === EMAIL_UNAVAILABLE ? "font-mono text-xs" : "font-medium"}>
                {user.email === EMAIL_UNAVAILABLE ? user.id : user.email}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-display-name">Display Name</Label>
              <Input
                id="user-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
              />
              <Button
                onClick={() => updateProfile.mutate()}
                disabled={!displayName.trim() || updateProfile.isPending}
                size="sm"
                className="bg-gradient-to-r from-primary to-accent"
              >
                {updateProfile.isPending ? "Saving..." : "Save Display Name"}
              </Button>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="font-medium">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
              </p>
            </div>

            {stats && (
              <>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="rounded-lg bg-secondary/30 p-3 text-center">
                    <p className="text-lg font-bold">{stats.favorites}</p>
                    <p className="text-xs text-muted-foreground">Favorites</p>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3 text-center">
                    <p className="text-lg font-bold">{stats.progress}</p>
                    <p className="text-xs text-muted-foreground">Reading</p>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3 text-center">
                    <p className="text-lg font-bold">{stats.bookmarks}</p>
                    <p className="text-xs text-muted-foreground">Bookmarks</p>
                  </div>
                </div>

                {/* Favorite books list */}
                {stats.favoriteBooks.length > 0 && (
                  <div className="pt-2 border-t border-border/20">
                    <p className="text-sm font-semibold mb-3 mt-2">{stats.favorites} Favorite Books</p>
                    <div className="space-y-2">
                      {stats.favoriteBooks.map((book) => (
                        <Link
                          key={book.id}
                          to="/book/$id"
                          params={{ id: book.id }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition"
                        >
                          {book.cover_url ? (
                            <img src={book.cover_url} alt={book.title} className="w-10 h-14 rounded object-cover ring-1 ring-white/10 shrink-0" />
                          ) : (
                            <div className="w-10 h-14 rounded bg-secondary shrink-0 flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{book.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Currently Reading list */}
                {stats.readingBooks.length > 0 && (
                  <div className="pt-2 border-t border-border/20">
                    <p className="text-sm font-semibold mb-3 mt-2">{stats.progress} Books Reading</p>
                    <div className="space-y-3">
                      {stats.readingBooks.map((book, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20">
                          {book.cover_url ? (
                            <img src={book.cover_url} alt={book.title} className="w-10 h-14 rounded object-cover ring-1 ring-white/10 shrink-0" />
                          ) : (
                            <div className="w-10 h-14 rounded bg-secondary shrink-0 flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{book.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                            <p className="text-xs text-primary mt-1">
                              Page {book.last_page}{book.updated_at ? ` · ${new Date(book.updated_at).toLocaleDateString()}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bookmarks list */}
                {stats.bookmarkEntries.length > 0 && (
                  <div className="pt-2 border-t border-border/20">
                    <p className="text-sm font-semibold mb-3 mt-2">{stats.bookmarks} Bookmarks</p>
                    <div className="space-y-2">
                      {stats.bookmarkEntries.map((bm) => (
                        <div key={bm.id} className="p-3 rounded-lg bg-secondary/15">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">{bm.title}</p>
                            <span className="text-xs text-primary shrink-0 ml-2">Page {bm.page}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{bm.author}</p>
                          {bm.note && (
                            <p className="text-xs text-muted-foreground/70 mt-1 italic line-clamp-2">"{bm.note}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="border-t border-border/40 pt-4">
              <h3 className="text-sm font-semibold mb-3">Password</h3>
              <button
                type="button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
              >
                <Key className="h-4 w-4" />
                {showPasswordForm ? "Cancel password change" : "Change password"}
              </button>

              {showPasswordForm && (
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                  <Button
                    onClick={() => updatePassword.mutate()}
                    disabled={newPassword.length < 6 || updatePassword.isPending}
                    size="sm"
                    className="w-full bg-gradient-to-r from-primary to-accent"
                  >
                    {updatePassword.isPending ? "Updating..." : "Set New Password"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border/40">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function DeleteUserButton({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const deleteUser = useMutation({
    mutationFn: async () => {
      await deleteAdminUser(userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User deleted");
      onSuccess();
      setConfirming(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (confirming) {
    return (
      <div className="flex gap-1">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteUser.mutate()}
          disabled={deleteUser.isPending}
        >
          Confirm
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setConfirming(true)}
      className="text-destructive hover:text-destructive/80"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
