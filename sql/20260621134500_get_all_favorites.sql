-- SECURITY DEFINER function to bypass RLS and get all favorites counts
-- This allows regular users to see the total favorites across all users
CREATE OR REPLACE FUNCTION public.get_total_favorites_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint FROM public.favorites;
$$;

CREATE OR REPLACE FUNCTION public.get_top_favorited_books(limit_count integer DEFAULT 6)
RETURNS TABLE(
  book_id uuid,
  title text,
  author text,
  cover_url text,
  description text,
  year int,
  categories text[],
  language text,
  count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.id,
    b.title,
    b.author,
    b.cover_url,
    b.description,
    b.year,
    b.categories,
    b.language,
    COUNT(f.book_id)::bigint AS count
  FROM public.favorites f
  JOIN public.books b ON b.id = f.book_id
  GROUP BY b.id, b.title, b.author, b.cover_url, b.description, b.year, b.categories, b.language
  ORDER BY count DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_total_favorites_count() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_top_favorited_books(integer) TO authenticated, anon;