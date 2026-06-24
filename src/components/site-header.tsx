import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, LogOut, Library as LibraryIcon, Moon, Sun, User, Shield, Menu, PenLine } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-hook";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profileAvatar } = useQuery({
    queryKey: ["profile-avatar", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data?.avatar_url ?? null;
    },
  });
  const isReader = useRouterState({ select: (s) => s.location.pathname.startsWith("/read/") });
  const [isDark, setIsDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleDarkMode() {
    const html = document.documentElement;
    html.classList.toggle("dark");
    setIsDark(!isDark);
  }

  if (isReader) return null;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header 
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled 
          ? "backdrop-blur-xl bg-background/80 border-b border-border/40 shadow-soft" 
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="Logo" className="h-16 w-16 object-contain transition-transform group-hover:scale-105" />
          <span 
            className="font-display text-2xl tracking-tight"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Lumen
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link 
            to="/" 
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition rounded-lg hover:bg-white/5" 
            activeOptions={{ exact: true }} 
            activeProps={{ className: "text-foreground bg-white/5" }}
          >
            Browse
          </Link>
          {user && (
            <>
              <Link 
                to="/library" 
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition rounded-lg hover:bg-white/5"
                activeProps={{ className: "text-foreground bg-white/5" }}
              >
                My Library
              </Link>
              <Link 
                to="/submit-book" 
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition rounded-lg hover:bg-white/5"
                activeProps={{ className: "text-foreground bg-white/5" }}
              >
                <PenLine className="h-4 w-4 inline mr-1.5" />
                Submit Book
              </Link>
            </>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground" 
            onClick={toggleDarkMode} 
            title="Toggle dark mode"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <>
              {/* Mobile library link */}
              <Link to="/library" className="md:hidden">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <LibraryIcon className="h-4 w-4" />
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full ml-1">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden shadow-glow transition-transform hover:scale-105">
                      {profileAvatar ? (
                        <img src={profileAvatar} alt="Avatar" className="h-full w-full object-cover rounded-full" />
                      ) : (
                        <User className="h-5 w-5 text-primary-foreground" />
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border/40 mb-1 truncate">
                    {user.email}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">Profile</Link>
                  </DropdownMenuItem>
                  {isAdmin(user.email) && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="h-4 w-4 mr-2" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground border-0 shadow-glow transition-all hover:shadow-glow"
              >
                Sign in
              </Button>
            </Link>
          )}

          {/* Mobile menu toggle */}
          {!user && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && !user && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl animate-fade-in">
          <div className="px-6 py-4 space-y-2">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}