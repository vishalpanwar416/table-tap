-- Pet Pooja integration mapping table
CREATE TABLE IF NOT EXISTS public.petpooja_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    petpooja_rest_id TEXT NOT NULL,
    app_key TEXT NOT NULL,
    app_secret TEXT NOT NULL,
    access_token TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    store_open BOOLEAN NOT NULL DEFAULT true,
    last_menu_sync_at TIMESTAMPTZ,
    last_order_pushed_at TIMESTAMPTZ,
    orders_pushed_today INTEGER NOT NULL DEFAULT 0,
    orders_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id),
    UNIQUE(petpooja_rest_id)
);

-- Pet Pooja item ID mapping (petpooja itemid <-> table-tap food_item_id)
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

-- Order push logs for debugging
CREATE TABLE IF NOT EXISTS public.petpooja_order_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES public.petpooja_integrations(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    petpooja_order_id TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('push', 'callback')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    request_payload JSONB,
    response_payload JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_petpooja_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER petpooja_integrations_updated_at
    BEFORE UPDATE ON public.petpooja_integrations
    FOR EACH ROW EXECUTE FUNCTION update_petpooja_updated_at();

CREATE TRIGGER petpooja_item_mappings_updated_at
    BEFORE UPDATE ON public.petpooja_item_mappings
    FOR EACH ROW EXECUTE FUNCTION update_petpooja_updated_at();

-- Reset daily order counter at midnight (managed by application logic)
-- orders_date tracks which date the count belongs to

-- RLS: only admins can manage integrations
ALTER TABLE public.petpooja_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petpooja_item_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petpooja_order_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage petpooja_integrations"
    ON public.petpooja_integrations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.staff
            WHERE staff.user_id = auth.uid()
            AND staff.role = 'admin'
            AND staff.is_active = true
        )
    );

CREATE POLICY "Admins manage petpooja_item_mappings"
    ON public.petpooja_item_mappings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.staff
            WHERE staff.user_id = auth.uid()
            AND staff.role = 'admin'
            AND staff.is_active = true
        )
    );

CREATE POLICY "Admins manage petpooja_order_logs"
    ON public.petpooja_order_logs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.staff
            WHERE staff.user_id = auth.uid()
            AND staff.role = 'admin'
            AND staff.is_active = true
        )
    );

-- Service role bypass for edge functions
CREATE POLICY "Service role bypass petpooja_integrations"
    ON public.petpooja_integrations FOR ALL TO service_role USING (true);

CREATE POLICY "Service role bypass petpooja_item_mappings"
    ON public.petpooja_item_mappings FOR ALL TO service_role USING (true);

CREATE POLICY "Service role bypass petpooja_order_logs"
    ON public.petpooja_order_logs FOR ALL TO service_role USING (true);
