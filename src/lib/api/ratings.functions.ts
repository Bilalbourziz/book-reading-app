import { supabase } from "@/integrations/supabase/client";

export type Rating = {
  id: string;
  book_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  book_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    email?: string;
    display_name?: string;
  };
};

export type BookRatingStats = {
  averageRating: number;
  ratingCount: number;
  userRating: number | null;
};

export async function getBookRatingStats(bookId: string, userId?: string): Promise<BookRatingStats> {
  const [ratingsResult, userRatingResult] = await Promise.all([
    supabase
      .from("ratings")
      .select("rating")
      .eq("book_id", bookId),
    
    userId ? supabase
      .from("ratings")
      .select("rating")
      .eq("book_id", bookId)
      .eq("user_id", userId)
      .maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const ratings = ratingsResult.data ?? [];
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratings.length 
    : 0;
  const userRating = userRatingResult.data?.rating ?? null;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    ratingCount: ratings.length,
    userRating,
  };
}

export async function getBookReviews(bookId: string, limit = 20, offset = 0): Promise<Review[]> {
  console.log("Fetching reviews for book:", bookId);
  
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      book_id,
      user_id,
      content,
      created_at,
      updated_at,
      profiles:profiles!reviews_user_id_fkey (
        email,
        display_name
      )
    `)
    .eq("book_id", bookId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching reviews:", error);
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }
  
  console.log("Reviews fetched:", data?.length ?? 0);
  return (data ?? []) as Review[];
}

export async function createOrUpdateRating(bookId: string, userId: string, rating: number): Promise<void> {
  const { error } = await supabase
    .from("ratings")
    .upsert(
      { book_id: bookId, user_id: userId, rating },
      { onConflict: "book_id,user_id" }
    );

  if (error) throw error;
}

export async function deleteRating(bookId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("ratings")
    .delete()
    .eq("book_id", bookId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function createReview(bookId: string, userId: string, content: string): Promise<Review> {
  console.log("Attempting to create review:", { bookId, userId, content: content.substring(0, 50) });
  
  const { data, error } = await supabase
    .from("reviews")
    .insert({ book_id: bookId, user_id: userId, content })
    .select()
    .single();

  if (error) {
    console.error("Error creating review:", error);
    throw new Error(`Failed to create review: ${error.message}`);
  }
  
  console.log("Review created successfully:", data);
  return data as Review;
}

export async function updateReview(reviewId: string, userId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteReview(reviewId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function getTopRatedBooks(limit = 10): Promise<(Rating & { book: any })[]> {
  const { data, error } = await supabase
    .from("ratings")
    .select(`
      book_id,
      rating,
      book:books!ratings_book_id_fkey (
        id,
        title,
        author,
        cover_url
      )
    `)
    .order("rating", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as (Rating & { book: any })[];
}