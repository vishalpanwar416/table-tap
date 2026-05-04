-- Payment integrity fixes
-- 1. Prevent duplicate orders for the same Razorpay payment
-- 2. Persist failed payment-order mismatches so recovery survives browser close

-- ── 1. Unique constraint on razorpay_payment_id ─────────────────────────────
-- Allow NULL (cash/UPI orders have no payment_id) but enforce uniqueness for
-- actual Razorpay payment IDs. DIRECT-* and UPI-* prefixes used for
-- non-Razorpay flows are also allowed to repeat as they are synthetic.

ALTER TABLE orders
  ADD CONSTRAINT orders_razorpay_payment_id_unique
  UNIQUE (razorpay_payment_id);

-- ── 2. failed_payment_orders — durable recovery table ───────────────────────
-- Stores payment-success / order-creation-failure events so customers can
-- recover even after closing the browser tab.

CREATE TABLE IF NOT EXISTS failed_payment_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_payment_id TEXT NOT NULL,
  razorpay_order_id   TEXT,
  razorpay_signature  TEXT,
  restaurant_id       UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name       TEXT,
  customer_email      TEXT,
  customer_phone      TEXT,
  table_number        TEXT,
  items               JSONB,
  amount              NUMERIC(10, 2),
  payment_method      TEXT,
  special_instructions TEXT,
  error_message       TEXT,
  status              TEXT NOT NULL DEFAULT 'pending_recovery',
  -- 'pending_recovery' | 'recovered' | 'refunded' | 'abandoned'
  recovered_order_id  UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failed_payment_orders_payment_id
  ON failed_payment_orders(razorpay_payment_id);

CREATE INDEX IF NOT EXISTS idx_failed_payment_orders_user
  ON failed_payment_orders(user_id);

CREATE INDEX IF NOT EXISTS idx_failed_payment_orders_restaurant
  ON failed_payment_orders(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_failed_payment_orders_status
  ON failed_payment_orders(status);

-- RLS: customers can only see their own failed orders
ALTER TABLE failed_payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own failed payment orders"
  ON failed_payment_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own failed payment orders"
  ON failed_payment_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own failed payment orders"
  ON failed_payment_orders FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Restaurant staff and admins can read all failed orders for their restaurant
CREATE POLICY "Staff can read restaurant failed payment orders"
  ON failed_payment_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.restaurant_id = failed_payment_orders.restaurant_id
        AND staff_members.user_id = auth.uid()
        AND staff_members.is_active = true
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_failed_payment_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_failed_payment_orders_updated_at
  BEFORE UPDATE ON failed_payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_failed_payment_orders_updated_at();
