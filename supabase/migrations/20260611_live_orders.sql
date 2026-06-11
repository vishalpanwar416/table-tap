-- Live orders: running tab per table with multiple KOT batches

BEGIN;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS enable_live_orders BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_kind TEXT NOT NULL DEFAULT 'order'
    CHECK (order_kind IN ('order', 'live_order')),
  ADD COLUMN IF NOT EXISTS kot_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bill_requested_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.order_kots (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  kot_number INTEGER NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'preparing', 'ready', 'served')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  printed_at TIMESTAMPTZ,
  UNIQUE (order_id, kot_number)
);

CREATE INDEX IF NOT EXISTS idx_order_kots_order_id ON public.order_kots(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_live_active
  ON public.orders(restaurant_id, table_number)
  WHERE order_kind = 'live_order'
    AND payment_status = 'pending'
    AND status NOT IN ('completed', 'rejected');

ALTER TABLE public.order_kots ENABLE ROW LEVEL SECURITY;

-- Guests and staff can read KOTs for orders they can read
CREATE POLICY order_kots_select
  ON public.order_kots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_kots.order_id
    )
  );

CREATE POLICY order_kots_insert
  ON public.order_kots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_kots.order_id
        AND o.order_kind = 'live_order'
        AND o.payment_status = 'pending'
    )
  );

-- Realtime for KOT inserts
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_kots;

COMMIT;
