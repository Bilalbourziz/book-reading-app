import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, BookOpen, LogOut, Settings, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/auth-hook";
import { isAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

export function AdminShell() {
  const { user, loading } = useSession();

  const { data: hasAccess = false, isLoading: checkingAdmin } = useQuery({
    queryKey: ["admin-access", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isAdmin(user?.email)) return true;
      const { data, error } = await supabase.rpc("is_admin");
      if (error) return false;
      return !!data;
    },
  });

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading admin panel...
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-8 max-w-md text-center bg-card/60 backdrop-blur border-border/60">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don&apos;t have permission to access the admin panel.
          </p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader email={user?.email} />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AdminNav />
        <Outlet />
      </div>
    </div>
  );
}

function AdminHeader({ email }: { email?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    qc.clear();
    toast.success("Logged out");
    navigate({ to: "/auth" });
  }

  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="outline" size="sm">
              View Site
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminNav() {
  const links = [
    { to: "/admin" as const, icon: BarChart3, label: "Dashboard", exact: true },
    { to: "/admin/books" as const, icon: BookOpen, label: "Books", exact: false },
    { to: "/admin/users" as const, icon: Users, label: "Users", exact: false },
  ];

  return (
    <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
      {links.map(({ to, icon: Icon, label, exact }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact }}
          activeProps={{ className: "bg-primary/10 border-primary/40 text-foreground" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card/60 border border-border/60 hover:bg-card/80 transition whitespace-nowrap text-sm text-muted-foreground"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}
