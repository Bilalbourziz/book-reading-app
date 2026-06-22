import { supabase } from "@/integrations/supabase/client";

const BOOKS_BUCKET = "books";
const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50 MB

export async function uploadBookPdf(file: File, title: string): Promise<string> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please select a PDF file.");
  }
  if (file.size > MAX_PDF_SIZE) {
    throw new Error("PDF must be smaller than 50 MB.");
  }

  // ✅ UUID — safe for Arabic and any Unicode title
  const path = `pdfs/${crypto.randomUUID()}.pdf`;

  const { error } = await supabase.storage
    .from(BOOKS_BUCKET)
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BOOKS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadBookCover(file: File, title: string): Promise<string> {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Cover must be JPG, PNG, or WebP.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Cover image must be smaller than 5 MB.");
  }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";

  // ✅ UUID — safe for Arabic and any Unicode title
  const path = `covers/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BOOKS_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BOOKS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function isPdfUrl(url: string): boolean {
  return url.toLowerCase().includes(".pdf");
}