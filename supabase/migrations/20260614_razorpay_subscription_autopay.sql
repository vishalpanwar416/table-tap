-- Razorpay subscription autopay: mandate tokens, checkout orders, renewal tracking.

-- ---------------------------------------------------------------------------
-- 1. Subscription autopay columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_token_id TEXT,
  ADD COLUMN IF NOT EXISTS autopay_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS autopay_method TEXT,
  ADD COLUMN IF NOT EXISTS mandate_max_amount_paise INTEGER,
  ADD COLUMN IF NOT EXISTS last_charge_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_charge_error TEXT,
  ADD COLUMN IF NOT EXISTS pending_renewal_order_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_autopay_status_check'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_autopay_status_check
      CHECK (autopay_status IN ('none', 'pending', 'active', 'failed', 'cancelled'));
  END IF;
END $$;

COMMENT ON COLUMN public.subscriptions.razorpay_token_id IS 'Razorpay recurring mandate token (not payment id)';
COMMENT ON COLUMN public.subscriptions.autopay_status IS 'none|pending|active|failed|cancelled';

-- Migrate legacy misuse: payment ids stored as tokens are cleared (owners must re-authorize mandate)
UPDATE public.subscriptions
SET
  razorpay_token_id = NULL,
  autopay_status = CASE
    WHEN auto_renew = true AND razorpay_token_id IS NULL THEN 'none'
    WHEN auto_renew = false THEN 'cancelled'
    ELSE autopay_status
  END
WHERE razorpay_token_id IS NOT NULL
  AND razorpay_token_id LIKE 'pay_%';

-- ---------------------------------------------------------------------------
-- 2. Checkout / renewal order audit table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_customer_id TEXT,
  razorpay_payment_id TEXT,
  amount_paise INTEGER NOT NULL,
  gst_paise INTEGER NOT NULL,
  total_paise INTEGER NOT NULL,
  plan_name TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  payment_method TEXT,
  enable_autopay BOOLEAN NOT NULL DEFAULT false,
  checkout_type TEXT NOT NULL DEFAULT 'initial'
    CHECK (checkout_type IN ('initial', 'renewal', 'recurring_charge')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed')),
  notes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sub_payment_orders_restaurant
  ON public.subscription_payment_orders (restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_payment_orders_status
  ON public.subscription_payment_orders (status, created_at DESC);

ALTER TABLE public.subscription_payment_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscription_payment_orders_admin_all ON public.subscription_payment_orders;
CREATE POLICY subscription_payment_orders_admin_all
ON public.subscription_payment_orders FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS subscription_payment_orders_staff_read ON public.subscription_payment_orders;
CREATE POLICY subscription_payment_orders_staff_read
ON public.subscription_payment_orders FOR SELECT
USING (public.can_manage_restaurant(restaurant_id));

-- Writes only via service role / edge functions (no client insert policy).

-- ---------------------------------------------------------------------------
-- 3. Extend toggle RPC to maintain autopay_status
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.toggle_subscription_auto_renew(uuid, boolean);

CREATE OR REPLACE FUNCTION public.toggle_subscription_auto_renew(
  p_subscription_id uuid,
  p_auto_renew boolean
)
RETURNS TABLE (id uuid, auto_renew boolean, autopay_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_restaurant_id uuid;
  v_plan text;
  v_status text;
  v_new_autopay_status text;
BEGIN
  SELECT s.restaurant_id, s.plan_name, s.status
  INTO v_restaurant_id, v_plan, v_status
  FROM public.subscriptions s
  WHERE s.id = p_subscription_id;

  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  IF NOT public.can_manage_restaurant(v_restaurant_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  v_new_autopay_status := CASE
    WHEN p_auto_renew AND EXISTS (
      SELECT 1 FROM public.subscriptions s2
      WHERE s2.id = p_subscription_id AND s2.razorpay_token_id IS NOT NULL
    ) THEN 'active'
    WHEN p_auto_renew THEN 'none'
    ELSE 'cancelled'
  END;

  RETURN QUERY
  UPDATE public.subscriptions
  SET
    auto_renew = p_auto_renew,
    autopay_status = v_new_autopay_status,
    updated_at = now()
  WHERE public.subscriptions.id = p_subscription_id
  RETURNING public.subscriptions.id, public.subscriptions.auto_renew, public.subscriptions.autopay_status;

  INSERT INTO public.subscription_history (
    subscription_id, restaurant_id, action,
    old_plan, new_plan, old_status, new_status, notes
  ) VALUES (
    p_subscription_id, v_restaurant_id, 'renewed',
    v_plan, v_plan, v_status, v_status,
    CASE WHEN p_auto_renew THEN 'Auto-renewal enabled' ELSE 'Auto-renewal disabled' END
  );
END;
$function$;

-- ---------------------------------------------------------------------------
-- 4. Index for renewal cron queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_subscriptions_autopay_renewal
  ON public.subscriptions (next_payment_date)
  WHERE auto_renew = true
    AND autopay_status = 'active'
    AND razorpay_token_id IS NOT NULL
    AND status IN ('active', 'grace_period');

-- ---------------------------------------------------------------------------
-- 5. Cron (pg_cron): schedule daily renewal processing
-- Set SUBSCRIPTION_CRON_SECRET in Supabase Edge Function secrets, then enable:
-- Dashboard → Integrations → Cron → or run once:
--
-- SELECT cron.schedule(
--   'process-subscription-renewals',
--   '30 2 * * *',
--   $$SELECT net.http_post(
--     url := '<SUPABASE_URL>/functions/v1/process-subscription-renewals',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
--       'x-cron-secret', '<SUBSCRIPTION_CRON_SECRET>'
--     ),
--     body := '{}'::jsonb
--   )$$
-- );
-- ---------------------------------------------------------------------------
