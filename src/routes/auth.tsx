import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";
import { ensureProfileExistsOnce } from "@/lib/profile";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lumen" },
      { name: "description", content: "Sign in or create an account to save favorites, bookmark pages, and track your reading progress on Lumen." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Sign in — Lumen" },
      { property: "og:description", content: "Sign in or create an account to save favorites, bookmark pages, and track your reading progress." },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.user) {
      await ensureProfileExistsOnce(data.user);
    }
    toast.success("Welcome back");
    navigate({ to: "/" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.user) {
      await ensureProfileExistsOnce(data.user);
    }
    toast.success("Account created");
    navigate({ to: "/" });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent items-center justify-center shadow-glow mb-4">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>
            Step into the library
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Save favorites, bookmark pages, pick up where you left off.</p>
        </div>
        <div className="bg-card/60 backdrop-blur border border-border/60 rounded-xl p-6 shadow-cinematic">
          <Button variant="secondary" className="w-full mb-4" onClick={google}>
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
            <div className="h-px bg-border flex-1" /> or email <div className="h-px bg-border flex-1" />
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
                  {busy ? "…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3">
                <div>
                  <Label htmlFor="name">Display name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
                  {busy ? "…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
