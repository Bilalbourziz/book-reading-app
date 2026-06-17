import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, FileText, ImagePlus, Plus, Search, Trash2, Upload, X, BookOpen, Filter } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { uploadBookCover, uploadBookPdf } from "@/lib/upload-book";
import { createAdminBook, updateAdminBook, deleteAdminBook } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/books")({
  head: () => ({ meta: [{ title: "Books Management — Admin" }] }),
  component: AdminBooks,
});

type Book = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  content_url: string;
  year: number | null;
  language: string;
  categories: string[];
  source?: string | null;
};

function AdminBooks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id,title,author,description,cover_url,content_url,year,language,categories,source")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Book[];
    },
  });

  const languages = useMemo(
    () => [...new Set(books.map((book) => book.language).filter(Boolean))].sort(),
    [books],
  );

  const categories = useMemo(
    () => [...new Set(books.flatMap((book) => book.categories ?? []).filter(Boolean))].sort(),
    [books],
  );

  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return books.filter((book) => {
      const type = getBookType(book);
      const matchesSearch =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query);
      const matchesLanguage = languageFilter === "all" || book.language === languageFilter;
      const matchesCategory =
        categoryFilter === "all" || (book.categories ?? []).includes(categoryFilter);
      const matchesType = typeFilter === "all" || type === typeFilter;

      return matchesSearch && matchesLanguage && matchesCategory && matchesType;
    });
  }, [books, categoryFilter, languageFilter, searchQuery, typeFilter]);

  const hasFilters =
    !!searchQuery.trim() ||
    languageFilter !== "all" ||
    categoryFilter !== "all" ||
    typeFilter !== "all";

  function resetFilters() {
    setSearchQuery("");
    setLanguageFilter("all");
    setCategoryFilter("all");
    setTypeFilter("all");
  }

  function openCreateForm() {
    setEditingBook(null);
    setShowForm(true);
  }

  function openEditForm(book: Book) {
    setEditingBook(book);
    setShowForm(true);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1 tracking-tight">Books</h2>
          <p className="text-muted-foreground text-sm">{books.length} book{books.length !== 1 ? "s" : ""} in catalog</p>
        </div>
        <Button onClick={openCreateForm} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> Add Book
        </Button>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or author..."
              className="pl-10 bg-background/50 border-border/60"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[480px]">
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger aria-label="Filter by language" className="bg-background/50">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {languages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger aria-label="Filter by category" className="bg-background/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger aria-label="Filter by type" className="bg-background/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button variant="outline" onClick={resetFilters} className="shrink-0 lg:self-end">
              <X className="h-4 w-4 mr-2" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card/60 backdrop-blur border-border/60 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary/30 border-t-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading books...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">No books found</p>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters.</p>
            {hasFilters && <Button variant="outline" onClick={resetFilters}>Clear filters</Button>}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 bg-background/30">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Author</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Language</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Categories</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Year</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr 
                    key={book.id} 
                    className="border-b border-border/10 hover:bg-background/30 transition-colors"
                  >
                    <td className="px-5 py-4 text-sm font-medium">{book.title}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{book.author}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className="px-2.5 py-1 rounded-full bg-secondary/80 text-xs font-medium uppercase tracking-wide">
                        {book.language}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground max-w-[200px] truncate hidden md:table-cell">
                      {(book.categories ?? []).join(", ") || <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        getBookType(book) === "pdf" 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {getBookType(book).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell">{book.year || <span className="text-muted-foreground/40">—</span>}</td>
                    <td className="px-5 py-4 text-sm text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEditForm(book)} className="hover:bg-primary/10">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <DeleteBookButton bookId={book.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12 px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-full overflow-y-auto scrollbar-none">
            <BookForm
              key={editingBook?.id ?? "new"}
              initialBook={editingBook}
              onClose={() => {
                setShowForm(false);
                setEditingBook(null);
              }}
              onSuccess={() => {
                setShowForm(false);
                setEditingBook(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function getBookType(book: Pick<Book, "content_url" | "source">) {
  return book.source === "pdf" ? "pdf" : "link";
}

function BookForm({
  onClose,
  onSuccess,
  initialBook,
}: {
  onClose: () => void;
  onSuccess: () => void;
  initialBook?: Book | null;
}) {
  const qc = useQueryClient();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialBook?.title || "");
  const [author, setAuthor] = useState(initialBook?.author || "");
  const [description, setDescription] = useState(initialBook?.description || "");
  const [coverUrl, setCoverUrl] = useState(initialBook?.cover_url || "");
  const [contentUrl, setContentUrl] = useState(initialBook?.content_url || "");
  const [year, setYear] = useState(initialBook?.year?.toString() || "");
  const [language, setLanguage] = useState(initialBook?.language || "en");
  const [categories, setCategories] = useState((initialBook?.categories ?? []).join(", "));
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState("");

  useEffect(() => {
    setTitle(initialBook?.title || "");
    setAuthor(initialBook?.author || "");
    setDescription(initialBook?.description || "");
    setCoverUrl(initialBook?.cover_url || "");
    setContentUrl(initialBook?.content_url || "");
    setYear(initialBook?.year?.toString() || "");
    setLanguage(initialBook?.language || "en");
    setCategories((initialBook?.categories ?? []).join(", "));
    setPdfFile(null);
    setCoverFile(null);
  }, [initialBook]);

  const saveBook = useMutation({
    mutationFn: async () => {
      let finalContentUrl = contentUrl.trim();
      let finalCoverUrl = coverUrl.trim() || null;
      let source = initialBook?.source || "pdf";

      if (pdfFile) {
        setUploadStep("Uploading PDF...");
        finalContentUrl = await uploadBookPdf(pdfFile, title.trim() || "book");
        source = "pdf";
      }

      if (coverFile) {
        setUploadStep("Uploading cover...");
        finalCoverUrl = await uploadBookCover(coverFile, title.trim() || "book");
      }

      if (!finalContentUrl) {
        throw new Error("Please upload a PDF or provide a content URL.");
      }

      setUploadStep("Saving book...");

      const payload = {
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || undefined,
        cover_url: finalCoverUrl ?? undefined,
        content_url: finalContentUrl,
        language,
        year: year ? parseInt(year, 10) : null,
        categories: categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        source: pdfFile ? "pdf" : source,
      };

      if (initialBook?.id) {
        await updateAdminBook({ data: { ...payload, id: initialBook.id } });
      } else {
        await createAdminBook({ data: payload });
      }
    },
    onSuccess: () => {
      setUploadStep("");
      qc.invalidateQueries({ queryKey: ["admin-books"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(initialBook ? "Book updated!" : "Book added!");
      onSuccess();
    },
    onError: (e: Error) => {
      setUploadStep("");
      toast.error(formatBookError(e));
    },
  });

  const hasContent = !!pdfFile || !!contentUrl.trim() || !!initialBook?.content_url;
  const isValid = title.trim() && author.trim() && hasContent;

  return (
    <Card className="p-6 bg-card/90 backdrop-blur-xl border-border/60 shadow-elevated animate-fade-in-scale">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold tracking-tight">{initialBook ? "Edit Book" : "Add New Book"}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" className="bg-background/50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author" className="text-sm font-medium">Author *</Label>
          <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" className="bg-background/50" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description" className="text-sm font-medium">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
            rows={3}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className="text-sm font-medium">PDF file *</Label>
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
            ) : initialBook?.content_url ? (
              <p className="text-sm text-muted-foreground">
                Current: <span className="text-foreground font-medium">{initialBook.content_url.split("/").pop()}</span>
                <br />
                <span className="text-xs text-muted-foreground/60">Click to replace with a new PDF</span>
              </p>
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
          <Label className="text-sm font-medium">Cover image</Label>
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
          <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="1813" className="bg-background/50" />
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
            placeholder="Romance, Classic, Fantasy (comma-separated)"
            className="bg-background/50"
          />
        </div>
      </div>
      
      <div className="flex gap-3 pt-6">
        <Button
          onClick={() => saveBook.mutate()}
          disabled={!isValid || saveBook.isPending}
          className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all"
        >
          {saveBook.isPending
            ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> {uploadStep || "Saving..."}</span>
            : initialBook
              ? "Update Book"
              : "Upload & Add Book"}
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1" disabled={saveBook.isPending}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

function DeleteBookButton({ bookId }: { bookId: string }) {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const deleteBook = useMutation({
    mutationFn: async () => {
      await deleteAdminBook({ data: { bookId } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-books"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Book deleted");
      setConfirming(false);
    },
    onError: (e: Error) => toast.error(formatBookError(e)),
  });

  if (confirming) {
    return (
      <div className="flex gap-1">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteBook.mutate()}
          disabled={deleteBook.isPending}
          className="h-8"
        >
          Confirm
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)} className="h-8">
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
      className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

function formatBookError(error: Error): string {
  const message = error.message.toLowerCase();
  if (
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("42501") ||
    message.includes("new row violates")
  ) {
    return "Permission denied. Run the admin SQL migrations in Supabase and add your email to admin_emails.";
  }
  if (message.includes("bucket") || message.includes("storage")) {
    return `Storage error: ${error.message}. Run supabase/migrations/20260613130000_books_storage.sql in Supabase SQL Editor.`;
  }
  return error.message;
}