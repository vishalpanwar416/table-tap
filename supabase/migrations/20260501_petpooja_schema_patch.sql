-- =====================================================================
-- Pet Pooja schema patch (2026-05-01)
--
-- Reconciles the live remote schema with what the edge functions expect.
-- The earlier 20260427_petpooja_integration.sql was only partially applied
-- to staging/dev; petpooja_item_mappings was never created and
-- petpooja_order_logs is missing four columns.
-- =====================================================================

BEGIN;

-- Create the missing item mappings table
CREATE TABLE IF NOT EXISTS public.petpooja_item_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES public.petpooja_integrations(id) ON DELETE CASCADE,
    petpooja_item_id TEXT NOT NULL,
    food_item_id UUID REFERENCES public.fooditems(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    in_stock BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(integration_id, petpooja_item_id)
);

CREATE INDEX IF NOT EXISTS idx_petpooja_item_mappings_integration
  ON public.petpooja_item_mappings (integration_id);

-- Add missing columns to order_logs. Existing 'payload' column is
-- preserved so historical rows aren't disturbed.
ALTER TABLE public.petpooja_order_logs
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS petpooja_order_id TEXT,
  ADD COLUMN IF NOT EXISTS request_payload JSONB,
  ADD COLUMN IF NOT EXISTS response_payload JSONB;

CREATE INDEX IF NOT EXISTS idx_petpooja_order_logs_lookup
  ON public.petpooja_order_logs (integration_id, petpooja_order_id);

-- Enable RLS on the new table; service role (used by edge functions) bypasses RLS.
ALTER TABLE public.petpooja_item_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS petpooja_item_mappings_staff_read ON public.petpooja_item_mappings;
CREATE POLICY petpooja_item_mappings_staff_read
ON public.petpooja_item_mappings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.petpooja_integrations pi
    JOIN public.restaurant_staff rs ON rs.restaurant_id = pi.restaurant_id
    WHERE pi.id = petpooja_item_mappings.integration_id
      AND rs.user_id = (SELECT auth.uid())
      AND rs.connected = true
  )
);

COMMIT;
