import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-6 w-6 md:h-7 md:w-7",
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, value: number) => {
    if (!readonly && onRatingChange && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onRatingChange(value);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5 md:gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(value)}
            onKeyDown={(e) => handleKeyDown(e, value)}
            className={cn(
              "relative transition-all p-0.5 md:p-1",
              !readonly && "hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded",
              readonly && "cursor-default"
            )}
            aria-label={`${value} star${value !== 1 ? "s" : ""}`}
            aria-checked={value <= rating}
            role="radio"
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                value <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
      {showValue && rating > 0 && (
        <span className="ml-1 text-xs md:text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StarRatingInput({ value, onChange, size = "md", className }: StarRatingInputProps) {
  return (
    <StarRating
      rating={value}
      onRatingChange={onChange}
      size={size}
      className={className}
    />
  );
}