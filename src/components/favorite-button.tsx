import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-hook";
import { toast } from "sonner";
import { useState } from "react";

interface FavoriteButtonProps {
  bookId: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
}

export function FavoriteButton({
  bookId,
  className,
  size = "icon",
}: FavoriteButtonProps) {
  const { user } = useSession();
  const qc = useQueryClient();
  const [isFavorite, setIsFavorite] = useState(false);

  useQuery({
    queryKey: ["favorite", user?.id, bookId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("book_id")
        .eq("user_id", user!.id)
        .eq("book_id", bookId)
        .maybeSingle();

      setIsFavorite(!!data);

      return data;
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user!.id)
          .eq("book_id", bookId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({
            user_id: user!.id,
            book_id: bookId,
          });

        if (error) throw error;
      }
    },

    onSuccess: () => {
      setIsFavorite(!isFavorite);

      qc.invalidateQueries({
        queryKey: ["favorite", user?.id, bookId],
      });

      qc.invalidateQueries({
        queryKey: ["library", user?.id],
      });

      qc.invalidateQueries({
        queryKey: ["reading-stats", user?.id],
      });

      toast.success(
        isFavorite
          ? "Removed from favorites"
          : "Added to favorites"
      );
    },

    onError: () => {
      toast.error("Failed to update favorite");
    },
  });

  if (!user) return null;

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => toggleFavorite.mutate()}
      disabled={toggleFavorite.isPending}
      className={className}
      title={
        isFavorite
          ? "Remove from favorites"
          : "Add to favorites"
      }
    >
      <Heart
        className={`h-4 w-4 ${
          isFavorite
            ? "fill-destructive text-destructive"
            : "text-muted-foreground"
        }`}
      />
    </Button>
  );
}