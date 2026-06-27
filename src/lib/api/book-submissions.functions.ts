import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/admin";

export type BookSubmission = {
  id: string;
  user_id: string;
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
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function createBookSubmission(data: {
  title: string;
  author: string;
  description?: string;
  cover_url?: string;
  content_url: string;
  year?: number;
  language?: string;
  categories?: string[];
  source?: string;
  userId: string;
}) {
  // Get the authenticated user from the server — don't trust client-supplied userId
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    throw new Error("You must be signed in to submit a book.");
  }

  if (!data.userId) {
    throw new Error("User ID is required. Please sign in and try again.");
  }

  // Verify the authenticated user matches the claimed userId
  if (authUser.id !== data.userId) {
    throw new Error("User ID mismatch. Please sign in again.");
  }

  // Prepare the submission data
  const submissionData = {
    user_id: authUser.id,
    title: data.title,
    author: data.author,
    description: data.description || null,
    cover_url: data.cover_url || null,
    content_url: data.content_url,
    year: data.year || null,
    language: data.language || "en",
    categories: data.categories || [],
    source: data.source || "link",
  };

  const { data: submission, error } = await supabase
    .from("book_submissions")
    .insert(submissionData)
    .select()
    .single();

  if (error) {
    console.error("Error creating submission:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    if (error.code === "42501") {
      throw new Error("Permission denied. Please make sure you're signed in correctly.");
    }
    throw new Error(error.message || "Failed to submit book. Please try again.");
  }
  
  return submission;
}

export async function getUserSubmissions(userId: string) {
  if (!userId) throw new Error("User ID is required");

  const { data, error } = await supabase
    .from("book_submissions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllSubmissions() {
  const { data, error } = await supabase
    .from("book_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching submissions:", error);
    throw error;
  }
  return data || [];
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: "approved" | "rejected",
  adminNotes?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in");

  // Verify the user is an admin
  if (!isAdmin(user.email)) {
    throw new Error("Only admins can approve or reject submissions.");
  }

  const { data, error } = await supabase
    .from("book_submissions")
    .update({
      status,
      admin_notes: adminNotes || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function approveSubmission(submissionId: string, adminNotes?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in");
  if (!isAdmin(user.email)) {
    throw new Error("Only admins can approve submissions.");
  }

  // First, get the submission data
  const { data: submission, error: fetchError } = await supabase
    .from("book_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (fetchError) throw fetchError;
  if (!submission) throw new Error("Submission not found");

  // Insert the book into the books table
  const { error: insertError } = await supabase.from("books").insert({
    title: submission.title,
    author: submission.author,
    description: submission.description,
    cover_url: submission.cover_url,
    content_url: submission.content_url,
    year: submission.year,
    language: submission.language,
    categories: submission.categories,
    source: submission.source,
  });

  if (insertError) {
    console.error("Error inserting book:", insertError);
    throw new Error("Failed to add book to library: " + insertError.message);
  }

  // Update the submission status to approved
  return updateSubmissionStatus(submissionId, "approved", adminNotes);
}

export async function rejectSubmission(submissionId: string, adminNotes?: string) {
  return updateSubmissionStatus(submissionId, "rejected", adminNotes);
}

export async function deleteSubmission(submissionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in");

  const { error } = await supabase
    .from("book_submissions")
    .delete()
    .eq("id", submissionId)
    .eq("user_id", user.id);

  if (error) throw error;
}