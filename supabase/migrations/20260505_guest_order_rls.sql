-- Allow guest (unauthenticated) order inserts.
-- Previously the policy required auth.uid() IS NOT NULL, which blocked all
-- anonymous callers. Guests place orders with user_id = NULL and must supply
-- a name and phone number; the UI validates this before calling createOrder().

BEGIN;

DROP POLICY IF EXISTS orders_insert_authenticated ON public.orders;

CREATE POLICY orders_insert_allow
ON public.orders FOR INSERT
WITH CHECK (
  -- Authenticated users may always insert
  auth.uid() IS NOT NULL
  OR
  -- Guests must provide name + phone (validated client-side before this point)
  (
    user_id IS NULL
    AND customer_name IS NOT NULL AND trim(customer_name) <> ''
    AND customer_phone IS NOT NULL AND trim(customer_phone) <> ''
  )
);

COMMIT;
