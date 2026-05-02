-- Fix profile_role for users who have admin access via the admin panel
-- but whose profiles row was never updated from the default 'customer'.
--
-- This targets users whose email matches a known admin account.
-- Safe to run multiple times (idempotent).

UPDATE public.profiles
SET profile_role = 'admin'
WHERE email = 'vishalpanwar416@gmail.com'
  AND (profile_role IS NULL OR profile_role = 'customer');
