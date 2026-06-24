import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-hook";
import { createBookSubmission, getUserSubmissions, deleteSubmission } from "@/lib/api/book-submissions.functions";
import { uploadBookCover, uploadBookPdf } from "@/lib/upload-book";
import { BookOpen, FileText, ImagePlus, Plus, Upload, X, User, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/submit-book")({
  head: () => ({
    meta: [
      { title: "Submit Book — Lumen" },
      { name: "description", content: "Submit a public-domain book to Lumen's digital library. Upload EPUB or PDF files." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SubmitBook,
});

type Submission = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  content_url: string;
  year: number | null;
  language: string;
  categories: string[];
  source: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

function SubmitBook() {
  const { user } = useSession();
  const qc = useQueryClient();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [year, setYear] = useState("");
  const [language, setLanguage] = useState("en");
  const [categories, setCategories] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState("");

  // Fetch user profile to get display name
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Auto-fill author name from profile
  useEffect(() => {
    if (profile?.display_name) {
      setAuthor(profile.display_name);
      setDisplayName(profile.display_name);
    } else if (user?.email) {
      setAuthor(user.email);
      setDisplayName(user.email);
    }
  }, [profile, user]);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["my-submissions", user?.id],
    queryFn: () => getUserSubmissions(user!.id),
    enabled: !!user,
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      await deleteSubmission(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-submissions"] });
      toast.success("Submission deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitBook = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error("You must be signed in to submit a book.");
      }

      let finalContentUrl = contentUrl.trim();
      let finalCoverUrl = coverUrl.trim() || null;

      if (pdfFile) {
        setUploadStep("Uploading PDF...");
        finalContentUrl = await uploadBookPdf(pdfFile, title.trim() || "book");
      }

      if (coverFile) {
        setUploadStep("Uploading cover...");
        finalCoverUrl = await uploadBookCover(coverFile, title.trim() || "book");
      }

      if (!finalContentUrl) {
        throw new Error("Please upload a PDF or provide a content URL.");
      }

      setUploadStep("Submitting for review...");

      await createBookSubmission({
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || undefined,
        cover_url: finalCoverUrl || undefined,
        content_url: finalContentUrl,
        year: year ? parseInt(year, 10) : undefined,
        language,
        categories: categories.split(",").map(c => c.trim()).filter(Boolean),
        source: pdfFile ? "pdf" : "link",
        userId: user.id,
      });
    },
    onSuccess: () => {
      setUploadStep("");
      qc.invalidateQueries({ queryKey: ["my-submissions"] });
      toast.success("Book submitted for review!");
      // Reset form
      setTitle("");
      setAuthor("");
      setDescription("");
      setCoverUrl("");
      setContentUrl("");
      setYear("");
      setLanguage("en");
      setCategories("");
      setPdfFile(null);
      setCoverFile(null);
    },
    onError: (e: Error) => {
      setUploadStep("");
      toast.error(e.message);
    },
  });

  const hasContent = !!pdfFile || !!contentUrl.trim();
  const isValid = title.trim() && author.trim() && hasContent;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "approved":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
          Submit a Book
        </h1>
        <p className="text-muted-foreground">
          Share your work with the community. All submissions are reviewed by our admin team.
        </p>
      </div>

      <Card className="p-6 bg-card/90 backdrop-blur-xl border-border/60 shadow-elevated mb-8">
        <h2 className="text-lg font-semibold mb-6">Book Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Book title"
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author" className="text-sm font-medium">Author *</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of the book"
              rows={3}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm font-medium">PDF File *</Label>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPdfFile(file);
              }}
            />
            <div
              className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
              onClick={() => pdfInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              {pdfFile ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">{pdfFile.name}</span>
                  <span className="text-muted-foreground">({(pdfFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">Click to upload a PDF (max 50 MB)</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">or use the URL field below</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="content-url" className="text-sm font-medium">Or paste content URL</Label>
            <Input
              id="content-url"
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="https://... (for HTML books or external PDF links)"
              disabled={!!pdfFile}
              className="bg-background/50"
            />
            {pdfFile && (
              <p className="text-xs text-muted-foreground">URL disabled — PDF upload will be used.</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm font-medium">Cover Image (optional)</Label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setCoverFile(file);
              }}
            />
            <div className="flex gap-3 items-center">
              <Button type="button" variant="outline" size="sm" onClick={() => coverInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4 mr-2" />
                {coverFile ? coverFile.name : "Upload cover"}
              </Button>
              <span className="text-xs text-muted-foreground">or paste URL</span>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cover-url" className="text-sm font-medium">Cover URL</Label>
            <Input
              id="cover-url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              disabled={!!coverFile}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year" className="text-sm font-medium">Year</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language" className="text-sm font-medium">Language</Label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background/50 border border-border/60 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="categories" className="text-sm font-medium">Categories</Label>
            <Input
              id="categories"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="Fiction, Romance, Fantasy (comma-separated)"
              className="bg-background/50"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <Button
            onClick={() => submitBook.mutate()}
            disabled={!isValid || submitBook.isPending}
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all"
          >
            {submitBook.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {uploadStep || "Submitting..."}
              </span>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </div>
      </Card>

      {submissions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">My Submissions</h2>
          <div className="space-y-4">
            {submissions.map((submission: Submission) => (
              <Card key={submission.id} className="p-5 bg-card/60 backdrop-blur border-border/60">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">{submission.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">by {submission.author}</p>
                    {submission.admin_notes && (
                      <div className="mt-2 p-3 rounded-lg bg-background/50 border border-border/40">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes:</p>
                        <p className="text-sm">{submission.admin_notes}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      Submitted {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                    {submission.status === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this submission?")) {
                            deleteSub.mutate(submission.id);
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}