-- ─────────────────────────────────────────────────────────────────────────────
-- Prevent privilege escalation via self-service profile_role changes.
--
-- The `profiles_update_own` RLS policy allows a user to UPDATE their own row
-- (USING / WITH CHECK = id = auth.uid()). That check guards the row's identity
-- but NOT individual columns, so any authenticated user could run:
--
--     supabase.from('profiles').update({ profile_role: 'admin' }).eq('id', myId)
--
-- and promote themselves. is_admin() / is_platform_admin() read profiles, so a
-- forged role would then satisfy every server-side RLS policy too. Locking down
-- the client-side route guards (AdminOnlyWrapper / OwnerOnlyWrapper) is not
-- enough — the database must enforce this.
--
-- RLS WITH CHECK cannot compare OLD vs NEW, so column immutability is enforced
-- with a BEFORE UPDATE trigger instead.
--
-- Allowed to change profile_role:
--   • platform admins (public.is_admin())                — admin panel role mgmt
--   • server-side / service_role / migrations (auth.uid() IS NULL) — trusted
-- Blocked: every other authenticated user changing their own role.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.guard_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() IS NULL  → service_role / SQL migrations / server-side: trusted.
  -- is_admin()          → platform admin managing roles via the admin panel.
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF NEW.profile_role IS DISTINCT FROM OLD.profile_role THEN
      RAISE EXCEPTION
        'Changing profile_role is not permitted (attempted % -> %)',
        OLD.profile_role, NEW.profile_role
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_role_change ON public.profiles;
CREATE TRIGGER trg_guard_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_role_change();
