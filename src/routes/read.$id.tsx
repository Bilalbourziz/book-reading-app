import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Bookmark as BookmarkIcon, Plus, X, BookOpen, Settings, Type } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReadingSettings, ReadingSettingsPanel, getReaderThemeStyles, getReaderFontFamily } from "@/components/reading-settings";

export const Route = createFileRoute("/read/$id")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("books")
      .select("id,title,author,content_url,source")
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { book: data };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Reading: ${loaderData.book.title} — Lumen` : "Reader — Lumen" },
      { name: "description", content: loaderData ? `Read ${loaderData.book.title} by ${loaderData.book.author} on Lumen.` : "" },
      { name: "robots", content: "index, follow" },
      ...(loaderData ? [{ property: "og:title", content: `Reading: ${loaderData.book.title} — Lumen` }] : []),
      ...(loaderData ? [{ property: "og:description", content: `Read ${loaderData.book.title} by ${loaderData.book.author} on Lumen.` }] : []),
    ],
  }),
  notFoundComponent: () => <div className="p-12 text-center">Book not found.</div>,
  errorComponent: ({ error }) => <div className="p-12 text-center text-muted-foreground">{error.message}</div>,
  component: Reader,
});

function Reader() {
  const { book } = Route.useLoaderData();
  const { user } = useSession();
  const qc = useQueryClient();
  const { settings, updateSettings } = useReadingSettings();
  const [sidebar, setSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [note, setNote] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"bookmarks" | "progress">("bookmarks");
  const lastSavedPageRef = useRef<number | null>(null);
  const pageRef = useRef(page);
  pageRef.current = page;
  const isInitializedRef = useRef(false);

  const { data: bookmarks = [] } = useQuery({
    queryKey: ["bookmarks", book.id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user!.id)
        .eq("book_id", book.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: currentProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["reading-progress", book.id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_progress")
        .select("last_page, updated_at")
        .eq("user_id", user!.id)
        .eq("book_id", book.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!user || progressLoading) return;
    if (currentProgress?.last_page) {
      setPage(currentProgress.last_page);
      lastSavedPageRef.current = currentProgress.last_page;
      isInitializedRef.current = true;
      return;
    }

    supabase
      .from("reading_progress")
      .upsert({
        user_id: user.id,
        book_id: book.id,
        last_page: 1,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }: { error: any }) => {
        if (!error) {
          qc.invalidateQueries({ queryKey: ["reading-progress", book.id, user.id] });
          lastSavedPageRef.current = 1;
          isInitializedRef.current = true;
        }
      });
  }, [currentProgress?.last_page, progressLoading, user, book.id, qc]);

  const addBookmark = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to save bookmarks");
      const { error } = await supabase
        .from("bookmarks")
        .insert({ user_id: user.id, book_id: book.id, page, note: note || null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks", book.id] });
      setNote("");
      toast.success(`Bookmarked page ${page}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeBookmark = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookmarks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks", book.id] }),
  });

  const updateProgress = useMutation({
    mutationFn: async (pageToSave: number) => {
      if (!user) throw new Error("Sign in to save reading progress");
      const { error } = await supabase.from("reading_progress").upsert({
        user_id: user.id,
        book_id: book.id,
        last_page: pageToSave,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: (_, pageToSave) => {
      lastSavedPageRef.current = pageToSave;
      qc.invalidateQueries({ queryKey: ["reading-progress", book.id, user?.id] });
      toast.success(`Progress saved at page ${pageToSave}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPdf = book.source === "pdf" || book.content_url?.toLowerCase().includes(".pdf");

  // Redirect PDF books directly to the PDF URL in the same page
  useEffect(() => {
    if (isPdf && book.content_url) {
      window.location.href = book.content_url;
    }
  }, [isPdf, book.content_url]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case "arrowleft":
        e.preventDefault();
        setPage((p) => Math.max(1, p - 1));
        break;
      case "arrowright":
        e.preventDefault();
        setPage((p) => p + 1);
        break;
      case "b":
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setSidebar(true);
          setSidebarTab("bookmarks");
        }
        break;
        case "s":
        if (!e.metaKey && !e.ctrlKey && user) {
          e.preventDefault();
          updateProgress.mutate(page);
        }
        break;
      case "escape":
        if (showSettings) {
          e.preventDefault();
          setShowSettings(false);
        }
        break;
    }
  }, [user, showSettings, updateProgress]);

  // Auto-save progress when page changes
  useEffect(() => {
    if (!user || progressLoading || !isInitializedRef.current) return;
    if (page === lastSavedPageRef.current) return;
    
    const timer = setTimeout(() => {
      updateProgress.mutate(page);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [page, user, progressLoading, updateProgress]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const themeStyles = getReaderThemeStyles(settings.theme);
  const fontFamily = getReaderFontFamily(settings.fontFamily);

  return (
    <div className={`fixed inset-0 flex flex-col ${themeStyles} transition-colors duration-300`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-background/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <Link to="/book/$id" params={{ id: book.id }} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition group">
            <ArrowLeft className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" /> 
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <div className="text-sm truncate max-w-[200px] sm:max-w-md">
            <span className="font-medium">{book.title}</span>
            <span className="text-muted-foreground hidden sm:inline"> — {book.author}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="relative"
          >
            <Settings className="h-4 w-4 mr-1.5" /> 
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <Button 
            size="sm" 
            variant={sidebar ? "secondary" : "ghost"} 
            onClick={() => setSidebar((s) => !s)}
            className="relative"
          >
            <BookmarkIcon className="h-4 w-4 mr-1.5" /> 
            <span className="hidden sm:inline">Bookmarks</span>
            {bookmarks.length > 0 && (
              <span className="ml-1.5 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {bookmarks.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex min-h-0">
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {isPdf ? (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center max-w-md px-6">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
                <h2 className="text-xl font-semibold mb-2">PDF Book</h2>
                <p className="text-muted-foreground text-sm mb-8">
                  This book is a PDF file. Open it in a new tab to read it.
                </p>
                <a
                  href={book.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 shadow-glow transition-all"
                >
                  Open PDF in new tab
                </a>
              </div>
            </div>
          ) : (
            <div 
              className="w-full h-full overflow-auto p-8 md:p-12"
              style={{ 
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                fontFamily: fontFamily,
              }}
            >
              <iframe
                src={book.content_url}
                title={book.title}
                className="w-full bg-transparent"
                sandbox="allow-same-origin allow-scripts allow-popups"
                style={{ 
                  filter: settings.theme === "dark" ? "invert(0.9) hue-rotate(180deg)" : "none",
                }}
              />
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <aside className="w-80 border-l border-border/40 bg-background/95 backdrop-blur-xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <span className="text-sm font-medium">Reading Settings</span>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowSettings(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ReadingSettingsPanel 
                settings={settings} 
                onSettingsChange={updateSettings} 
              />
            </div>
            <div className="p-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                <strong>Shortcuts:</strong> ← → navigate, B bookmarks, S save progress, Esc close
              </p>
            </div>
          </aside>
        )}

        {/* Sidebar */}
        {sidebar && (
          <aside className="w-80 border-l border-border/40 bg-background/95 backdrop-blur-xl flex flex-col animate-slide-in-right">
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSidebarTab("bookmarks")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    sidebarTab === "bookmarks" 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Bookmarks
                </button>
                <button
                  onClick={() => setSidebarTab("progress")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    sidebarTab === "progress" 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Progress
                </button>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSidebar(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {sidebarTab === "bookmarks" && (
                <>
                  {!user && (
                    <div className="text-center py-8">
                      <BookmarkIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        <Link to="/auth" className="text-primary underline hover:no-underline">Sign in</Link> to save bookmarks.
                      </p>
                    </div>
                  )}
                  {user && (
                    <>
                      {/* Add bookmark form */}
                      <div className="glass rounded-xl p-3 mb-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New bookmark</p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min={1}
                            value={page}
                            onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
                            placeholder="Page"
                            className="w-20 h-8 text-sm"
                          />
                          <Textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Optional note…"
                            rows={2}
                            className="flex-1 text-sm min-h-[60px]"
                          />
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-primary to-accent" 
                          onClick={() => addBookmark.mutate()} 
                          disabled={addBookmark.isPending}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> 
                          {addBookmark.isPending ? "Saving…" : "Save bookmark"}
                        </Button>
                      </div>

                      {/* Bookmarks list */}
                      <div className="space-y-2">
                        {bookmarks.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">No bookmarks yet.</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Add your first one above.</p>
                          </div>
                        )}
                        {bookmarks.map((b: any) => (
                          <div 
                            key={b.id} 
                            className="p-3 rounded-lg bg-card/60 border border-border/60 hover:bg-card/80 transition group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Page {b.page}</span>
                              <button
                                onClick={() => removeBookmark.mutate(b.id)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {b.note && (
                              <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">{b.note}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/40 mt-1.5">
                              {new Date(b.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {sidebarTab === "progress" && (
                <>
                  {!user && (
                    <div className="text-center py-8">
                      <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        <Link to="/auth" className="text-primary underline hover:no-underline">Sign in</Link> to track reading progress.
                      </p>
                    </div>
                  )}

                  {user && (
                    <div className="space-y-4">
                      <div className="glass rounded-xl p-3 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current progress</p>
                        <div className="space-y-2">
                          <label htmlFor="progress-page" className="text-xs text-muted-foreground">Last page read</label>
                          <Input
                            id="progress-page"
                            type="number"
                            min={1}
                            value={page}
                            onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
                            className="h-9"
                          />
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-primary to-accent"
                          onClick={() => updateProgress.mutate(page)}
                          disabled={updateProgress.isPending}
                        >
                          {updateProgress.isPending ? "Saving..." : "Save progress"}
                        </Button>
                      </div>

                      <div className="rounded-lg bg-card/60 border border-border/60 p-3">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-primary/70" />
                          <div>
                            <p className="text-sm font-medium">Page {currentProgress?.last_page ?? page}</p>
                            <p className="text-xs text-muted-foreground">
                              {currentProgress?.updated_at
                                ? `Updated ${new Date(currentProgress.updated_at).toLocaleDateString()}`
                                : "Started today"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Link to="/library" className="block">
                        <Button variant="outline" size="sm" className="w-full">
                          View library progress
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Progress bar at bottom */}
      <div className="h-0.5 bg-border/30">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          style={{ width: `${Math.min(100, Math.max(4, page))}%` }}
        />
      </div>
    </div>
  );
}
