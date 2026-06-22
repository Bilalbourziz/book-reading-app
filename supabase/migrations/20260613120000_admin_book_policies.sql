-- Admin emails: add your login email here to manage books
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email TEXT PRIMARY KEY
);

INSERT INTO public.admin_emails (email) VALUES ('admin@example.com')
ON CONFLICT DO NOTHING;

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read admin emails"
  ON public.admin_emails FOR SELECT TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_emails ae
    WHERE lower(ae.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY "admins insert books"
  ON public.books FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admins update books"
  ON public.books FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admins delete books"
  ON public.books FOR DELETE TO authenticated
  USING (public.is_admin());
