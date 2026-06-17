import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-hook";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/star-rating";
import { toast } from "sonner";
import { MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  getBookRatingStats,
  getBookReviews,
  createOrUpdateRating,
  createReview,
  updateReview,
  deleteReview,
} from "@/lib/api/ratings.functions";
import type { Review } from "@/lib/api/ratings.functions";

interface ReviewsSectionProps {
  bookId: string;
  className?: string;
}

export function ReviewsSection({ bookId, className }: ReviewsSectionProps) {
  const { user } = useSession();
  const qc = useQueryClient();
  const [newReview, setNewReview] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["rating-stats", bookId, user?.id],
    queryFn: () => getBookRatingStats(bookId, user?.id),
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", bookId],
    queryFn: () => getBookReviews(bookId),
  });

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (!user) throw new Error("Please sign in to rate");
      await createOrUpdateRating(bookId, user.id, rating);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rating-stats", bookId] });
      qc.invalidateQueries({ queryKey: ["reviews", bookId] });
      toast.success("Rating saved!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reviewMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Please sign in to write a review");
      await createReview(bookId, user.id, content);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", bookId] });
      setNewReview("");
      toast.success("Review posted!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, content }: { reviewId: string; content: string }) => {
      if (!user) throw new Error("Please sign in");
      await updateReview(reviewId, user.id, content);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", bookId] });
      setEditingReviewId(null);
      setEditingContent("");
      toast.success("Review updated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) throw new Error("Please sign in");
      await deleteReview(reviewId, user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", bookId] });
      toast.success("Review deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleRate = (rating: number) => {
    setUserRating(rating);
    rateMutation.mutate(rating);
  };

  const handleSubmitReview = () => {
    if (!newReview.trim()) {
      toast.error("Please write a review");
      return;
    }
    reviewMutation.mutate(newReview);
  };

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditingContent(review.content);
  };

  const handleSaveEdit = (reviewId: string) => {
    if (!editingContent.trim()) {
      toast.error("Review cannot be empty");
      return;
    }
    updateReviewMutation.mutate({ reviewId, content: editingContent });
  };

  const handleDeleteReview = (reviewId: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  const getUserName = (review: Review) => {
    return review.profiles?.full_name || review.profiles?.email?.split("@")[0] || "Anonymous";
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Rating Summary */}
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Ratings & Reviews</h3>
            {stats && stats.ratingCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {stats.ratingCount} review{stats.ratingCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {stats && stats.averageRating > 0 && (
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <StarRating rating={stats.averageRating} readonly size="sm" />
            </div>
          )}
        </div>

        {/* User Rating */}
        {user && (
          <div className="pt-4 border-t border-border/40">
            <p className="text-sm font-medium mb-2">Your Rating</p>
            <StarRating
              rating={userRating || stats?.userRating || 0}
              onRatingChange={handleRate}
              size="lg"
            />
          </div>
        )}

        {!user && (
          <p className="text-sm text-muted-foreground">
            <a href="/auth" className="text-primary underline hover:no-underline">Sign in</a> to rate and review this book.
          </p>
        )}
      </div>

      {/* Write Review */}
      {user && (
        <div className="glass rounded-xl p-6 space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Write a Review
          </h4>
          <Textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Share your thoughts about this book..."
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitReview}
              disabled={!newReview.trim() || reviewMutation.isPending}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {reviewMutation.isPending ? "Posting..." : "Post Review"}
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-8">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground mt-2">Loading reviews...</p>
          </div>
        )}

        {!isLoading && reviews.length === 0 && (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No reviews yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Be the first to share your thoughts!</p>
          </div>
        )}

        {reviews.map((review) => (
          <div key={review.id} className="glass rounded-lg p-5 space-y-3">
            {editingReviewId === review.id ? (
              <>
                <Textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingReviewId(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(review.id)}
                    disabled={updateReviewMutation.isPending}
                    className="bg-gradient-to-r from-primary to-accent"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="text-xs font-semibold">
                        {getUserName(review).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{getUserName(review)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {review.updated_at !== review.created_at && " (edited)"}
                      </p>
                    </div>
                  </div>
                  {user && user.id === review.user_id && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditReview(review)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {review.content}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}