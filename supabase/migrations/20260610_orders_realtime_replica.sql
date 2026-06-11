-- Ensure Supabase Realtime sends full row payloads on order updates
-- (required for reliable postgres_changes delivery to customer tracking)

ALTER TABLE public.orders REPLICA IDENTITY FULL;
