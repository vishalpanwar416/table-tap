-- ─────────────────────────────────────────────────────────────────────────────
-- Capture the role-provisioning triggers into version control.
--
-- These functions/triggers already exist in the production database but were
-- never committed as migrations, so a fresh environment (new Supabase project,
-- local dev, disaster recovery) rebuilt from migrations would have NO role
-- provisioning at all: every new user would be stuck as 'customer', staff would
-- never be linked, and profiles.profile_role would never be populated.
--
-- That matters for security: the admin/owner route guards (AdminOnlyWrapper /
-- OwnerOnlyWrapper) and the server-side RLS helpers (is_admin(), etc.) treat
-- profiles.profile_role as the single source of truth. If profiles is never
-- populated, legitimate admins/owners are locked out. This migration makes the
-- provisioning chain reproducible so that guarantee holds in every environment.
--
-- Idempotent (CREATE OR REPLACE + DROP/CREATE TRIGGER): a no-op against the
-- live database (definitions match) and a full setup on a fresh one. Captured
-- verbatim from production on 2026-06-10.
--
-- Chain:
--   auth.users INSERT  → handle_new_user_and_set_role : create profiles row,
--                        default user_metadata.profile_role to 'customer'
--   profiles  INSERT   → link_profile_to_staff_after_insert : adopt the role
--                        from a matching restaurant_staff row (by email/phone)
--   profiles  UPDATE   → sync_profile_role_to_staff : mirror manager/captain
--                        role changes back onto connected staff rows
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. On new auth user: create the profile and seed the default role.
CREATE OR REPLACE FUNCTION public.handle_new_user_and_set_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create a profile for the new user, ignore if it already exists
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;

  -- Add the default role to the user's metadata.
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('profile_role', 'customer')
  WHERE id = new.id;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_and_set_role();

-- 2. On new profile: link pre-created staff rows and adopt their role.
CREATE OR REPLACE FUNCTION public.link_profile_to_staff_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    staff_role_to_set TEXT;
    affected_rows INTEGER;
BEGIN
    -- Link existing unconnected staff entries to this new profile
    UPDATE public.restaurant_staff
    SET user_id = NEW.id, connected = TRUE
    WHERE user_id IS NULL
      AND connected IS NOT TRUE
      AND (
          (NEW.email IS NOT NULL AND lower(staff_email) = lower(NEW.email))
          OR
          (NEW.mobile_number IS NOT NULL AND staff_phone_number::text = NEW.mobile_number::text)
      );

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    -- Only update profile role if we actually linked some staff entries
    -- and the user doesn't already have a role set (or has customer role)
    IF affected_rows > 0 AND (NEW.profile_role IS NULL OR NEW.profile_role = 'customer') THEN
        -- Find the highest-ranking role from linked staff
        SELECT staff_role INTO staff_role_to_set
        FROM public.restaurant_staff
        WHERE user_id = NEW.id
        ORDER BY
            CASE
                WHEN staff_role = 'manager' THEN 1
                WHEN staff_role = 'captain' THEN 2
                ELSE 3
            END
        LIMIT 1;

        -- Update profile role if we found a staff role
        IF staff_role_to_set IS NOT NULL THEN
            UPDATE public.profiles
            SET profile_role = staff_role_to_set
            WHERE id = NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_insert_link_staff ON public.profiles;
CREATE TRIGGER on_profile_insert_link_staff
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_profile_to_staff_after_insert();

-- 3. On profile role change: keep connected staff rows in sync.
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only proceed if profile_role changed and it's a staff role
    IF OLD.profile_role = NEW.profile_role OR NEW.profile_role NOT IN ('manager', 'captain') THEN
        RETURN NEW;
    END IF;

    -- Update all connected staff entries for this user to match the new profile role
    -- This ensures consistency when profile role is manually updated
    UPDATE public.restaurant_staff
    SET staff_role = NEW.profile_role
    WHERE user_id = NEW.id
      AND connected = TRUE;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_update_sync_staff ON public.profiles;
CREATE TRIGGER on_profile_role_update_sync_staff
  AFTER UPDATE OF profile_role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_to_staff();
