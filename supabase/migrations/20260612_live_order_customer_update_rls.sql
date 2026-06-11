-- Allow guests and logged-in customers to append KOTs to unpaid live orders.
-- Existing customer_order_updates only permits status pending/confirmed; live orders use preparing/ready.

BEGIN;

DROP POLICY IF EXISTS live_order_customer_update ON public.orders;

CREATE POLICY live_order_customer_update
ON public.orders FOR UPDATE
USING (
  order_kind = 'live_order'
  AND payment_status = 'pending'
  AND status IN ('pending', 'preparing', 'ready')
  AND (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND customer_email IS NOT NULL)
  )
)
WITH CHECK (
  order_kind = 'live_order'
  AND payment_status = 'pending'
  AND (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND customer_email IS NOT NULL)
  )
);

COMMIT;
