-- Ensure admins can manage subscription plans and billing cycles via the app UI
-- Safe to re-run (drops/recreates policies).

-- helper expression reused in policies
-- no need to create a function; use inline EXISTS to avoid extra objects

-- subscription_plans
DO $$
BEGIN
    -- Enable RLS if not already
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'subscription_plans'
          AND rowsecurity = true
    ) THEN
        EXECUTE 'ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY';
    END IF;

    -- Drop existing manage/select policies to keep this idempotent
    DROP POLICY IF EXISTS subscription_plans_select_all ON public.subscription_plans;
    DROP POLICY IF EXISTS subscription_plans_manage_admin ON public.subscription_plans;

    -- Everyone (auth) can read plans
    CREATE POLICY subscription_plans_select_all
    ON public.subscription_plans
    FOR SELECT
    USING (true);

    -- Only admins (profiles.profile_role = 'admin') can insert/update/delete
    CREATE POLICY subscription_plans_manage_admin
    ON public.subscription_plans
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.profile_role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.profile_role = 'admin'
        )
    );
END$$;

-- billing_cycles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'billing_cycles'
          AND rowsecurity = true
    ) THEN
        EXECUTE 'ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY';
    END IF;

    DROP POLICY IF EXISTS billing_cycles_select_all ON public.billing_cycles;
    DROP POLICY IF EXISTS billing_cycles_manage_admin ON public.billing_cycles;

    CREATE POLICY billing_cycles_select_all
    ON public.billing_cycles
    FOR SELECT
    USING (true);

    CREATE POLICY billing_cycles_manage_admin
    ON public.billing_cycles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.profile_role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.profile_role = 'admin'
        )
    );
END$$;

