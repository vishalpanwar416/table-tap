-- =====================================================================
-- Composite index audit (2026-04-29)
--
-- After inspecting the actual remote schema (Table-Tap-QR project), the
-- RLS policies on dev/staging already use the (SELECT auth.uid())
-- InitPlan pattern, so no policy rewrite is needed. The remaining win
-- is composite indexes for the hottest query paths, which are missing.
--
-- Each index is created idempotently. Schema names verified against
-- live remote (fooditems, not food_items; no invoices table).
-- =====================================================================

BEGIN;

-- Restaurant dashboard: list orders for restaurant ordered by recency.
-- Replaces the planner's choice between idx_orders_restaurant_id and
-- orders_created_at_idx (which can't both be used together).
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created
  ON public.orders (restaurant_id, created_at DESC);

-- Restaurant dashboard: filter by status (pending/preparing/ready)
-- scoped to a single restaurant.
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status
  ON public.orders (restaurant_id, status);

-- Subscription lookups: RLS and billing checks always join restaurant
-- with status (active / grace_period).
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant_status
  ON public.subscriptions (restaurant_id, status);

-- Hottest lookup in the system: every authenticated request resolves
-- the caller's restaurant via restaurant_staff. Partial index narrows
-- to active staff rows only.
CREATE INDEX IF NOT EXISTS idx_staff_user_connected
  ON public.restaurant_staff (user_id)
  WHERE connected = true;

-- customer_messages was missing a (restaurant_id, created_at) index
-- for the inbox listing.
CREATE INDEX IF NOT EXISTS idx_customer_messages_restaurant_created
  ON public.customer_messages (restaurant_id, created_at DESC);

COMMIT;

-- Refresh planner stats so new indexes are picked up immediately.
-- ANALYZE cannot run inside a transaction block.
ANALYZE public.orders;
ANALYZE public.subscriptions;
ANALYZE public.restaurant_staff;
ANALYZE public.customer_messages;
