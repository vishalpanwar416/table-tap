-- Make admin helper functions SECURITY DEFINER so they can always read
-- the profiles table regardless of the caller's RLS context.
-- Without SECURITY DEFINER, these functions ran as the calling user and
-- could fail silently if the profiles table had any RLS stacking issue,
-- causing is_platform_admin() to return false for legitimate admins.

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.profile_role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT profile_role
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND profile_role = 'admin'
  );
END;
$$;
