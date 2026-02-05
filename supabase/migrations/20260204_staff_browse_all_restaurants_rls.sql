-- Staff/manager/admin can browse ALL active restaurants on the selection page (not just their own)
DROP POLICY IF EXISTS restaurants_staff_browse_all_active ON public.restaurants;
CREATE POLICY restaurants_staff_browse_all_active
ON public.restaurants FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.restaurant_id = restaurants.id
      AND s.status IN ('active', 'grace_period')
  )
  AND EXISTS (
    SELECT 1
    FROM public.restaurant_staff rs
    WHERE rs.user_id = auth.uid()
      AND rs.connected = true
  )
);

-- Staff/manager/admin can read subscription status for all active/grace_period (for selection page join)
DROP POLICY IF EXISTS subscriptions_staff_browse_active ON public.subscriptions;
CREATE POLICY subscriptions_staff_browse_active
ON public.subscriptions FOR SELECT
USING (
  status IN ('active', 'grace_period')
  AND EXISTS (
    SELECT 1
    FROM public.restaurant_staff rs
    WHERE rs.user_id = auth.uid()
      AND rs.connected = true
  )
);
