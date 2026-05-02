-- Add missing INSERT/UPDATE/DELETE policies for the subscriptions table.
-- Without these, RLS silently denied every write — which is why the
-- subscriptions table has been empty: registration approval inserts
-- were dropped without error.
--
-- Reads were already covered by:
--   subscriptions_public_read_status (active/grace_period/expired)
--   subscriptions_admin_read_all
--   subscriptions_staff_read_own
--   subscriptions_staff_browse_active

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Platform admins can fully manage subscriptions.
DROP POLICY IF EXISTS subscriptions_admin_insert ON public.subscriptions;
CREATE POLICY subscriptions_admin_insert
ON public.subscriptions FOR INSERT
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS subscriptions_admin_update ON public.subscriptions;
CREATE POLICY subscriptions_admin_update
ON public.subscriptions FOR UPDATE
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS subscriptions_admin_delete ON public.subscriptions;
CREATE POLICY subscriptions_admin_delete
ON public.subscriptions FOR DELETE
USING (public.is_platform_admin());

-- Restaurant managers/captains can manage their own restaurant's subscription
-- (e.g., self-serve plan upgrades from the owner dashboard).
DROP POLICY IF EXISTS subscriptions_staff_insert_own ON public.subscriptions;
CREATE POLICY subscriptions_staff_insert_own
ON public.subscriptions FOR INSERT
WITH CHECK (public.can_manage_restaurant(restaurant_id));

DROP POLICY IF EXISTS subscriptions_staff_update_own ON public.subscriptions;
CREATE POLICY subscriptions_staff_update_own
ON public.subscriptions FOR UPDATE
USING (public.can_manage_restaurant(restaurant_id))
WITH CHECK (public.can_manage_restaurant(restaurant_id));

-- ---------------------------------------------------------------------------
-- subscription_history: had RLS enabled but zero policies, so every write
-- (including the one fired by createSubscription and registration approval)
-- was silently denied. Mirror the subscriptions policy structure.
-- ---------------------------------------------------------------------------
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscription_history_admin_read_all ON public.subscription_history;
CREATE POLICY subscription_history_admin_read_all
ON public.subscription_history FOR SELECT
USING (public.is_platform_admin());

DROP POLICY IF EXISTS subscription_history_staff_read_own ON public.subscription_history;
CREATE POLICY subscription_history_staff_read_own
ON public.subscription_history FOR SELECT
USING (restaurant_id = public.current_restaurant_id());

DROP POLICY IF EXISTS subscription_history_admin_insert ON public.subscription_history;
CREATE POLICY subscription_history_admin_insert
ON public.subscription_history FOR INSERT
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS subscription_history_staff_insert_own ON public.subscription_history;
CREATE POLICY subscription_history_staff_insert_own
ON public.subscription_history FOR INSERT
WITH CHECK (public.can_manage_restaurant(restaurant_id));

DROP POLICY IF EXISTS subscription_history_admin_update ON public.subscription_history;
CREATE POLICY subscription_history_admin_update
ON public.subscription_history FOR UPDATE
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS subscription_history_admin_delete ON public.subscription_history;
CREATE POLICY subscription_history_admin_delete
ON public.subscription_history FOR DELETE
USING (public.is_platform_admin());
