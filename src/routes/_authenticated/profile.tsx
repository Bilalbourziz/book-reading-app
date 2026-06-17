import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-hook";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { LogOut, User, Shield } from "lucide-react";
import { ReadingStats } from "@/components/reading-stats";
import { isAdmin } from "@/lib/admin";
import { ensureUserProfile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Lumen" }] }),
  component: Profile,
});

function Profile() {
  const { user, session } = useSession();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");

  const userIsAdmin = isAdmin(user?.email);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      await ensureUserProfile(user!);
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data?.display_name) setDisplayName(data.display_name);
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate({ to: "/auth" });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
          Your Profile
        </h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <ReadingStats />

      <Card className="p-6 mb-6 bg-card/60 backdrop-blur border-border/60">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-lg font-semibold">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="mt-1"
            />
          </div>

          <Button
            onClick={() => updateProfile.mutate()}
            disabled={updateProfile.isPending}
            className="w-full bg-gradient-to-r from-primary to-accent"
          >
            {updateProfile.isPending ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </Card>

      {userIsAdmin && (
        <Card className="p-6 mb-6 bg-primary/10 border-primary/30">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Admin Panel</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Manage books, users, and site settings.</p>
          <Link to="/admin" className="inline-block w-full">
            <Button className="w-full bg-gradient-to-r from-primary to-accent">
              Go to Admin Dashboard
            </Button>
          </Link>
        </Card>
      )}

      <Card className="p-6 bg-destructive/10 border-destructive/30">
        <h3 className="font-semibold mb-3">Danger Zone</h3>
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" /> Log Out
        </Button>
      </Card>
    </div>
  );
}
