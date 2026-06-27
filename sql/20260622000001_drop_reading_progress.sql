-- Drop reading_progress table and related objects
DROP TABLE IF EXISTS public.reading_progress CASCADE;

-- Drop any related functions
DROP FUNCTION IF EXISTS public.update_reading_progress_updated_at() CASCADE;