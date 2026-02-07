-- Update subscription plans to new Lite/Standard/Pro/Custom while keeping Demo intact
-- This script is idempotent and can be rerun safely.

DO $$
DECLARE
    new_plans JSONB := '[
      {"key":"demo","name":"Demo","base_price":0,"features":["Limited access","For testing only","Non-billable"],"is_active":true},
      {"key":"lite","name":"Lite","base_price":899,"features":["QR ordering & menu","Email billing included","Basic analytics","10 staff seats","Pay-go WhatsApp billing"],"is_active":true},
      {"key":"standard","name":"Standard","base_price":1199,"features":["Inventory & costing","Product/daypart analytics","300 WhatsApp msgs included","25 staff seats","Basic aggregator toggle"],"is_active":true},
      {"key":"pro","name":"Pro","base_price":1699,"features":["AI insights & alerts","800 WhatsApp msgs included","Full aggregator sync","Floor plan & KDS","Mini-site + custom domain"],"is_active":true},
      {"key":"custom","name":"Custom","base_price":null,"features":["Custom bundles","Dedicated CSM & SLA","Bulk WhatsApp pricing","Advanced integrations","Security & compliance options"],"is_active":true}
    ]';
    rec JSONB;
BEGIN
    -- Upsert new plans
    FOR rec IN SELECT * FROM jsonb_array_elements(new_plans)
    LOOP
        INSERT INTO public.subscription_plans (key, name, base_price, features, is_active)
        VALUES (
            rec->>'key',
            rec->>'name',
            NULLIF((rec->>'base_price')::numeric, NULL),
            (rec->'features')::jsonb,
            (rec->>'is_active')::boolean
        )
        ON CONFLICT (key) DO UPDATE
            SET name = EXCLUDED.name,
                base_price = EXCLUDED.base_price,
                features = EXCLUDED.features,
                is_active = EXCLUDED.is_active,
                updated_at = NOW();
    END LOOP;

    -- Deactivate any legacy plans not in the new set (except we keep demo/custom/etc.)
    UPDATE public.subscription_plans
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE key NOT IN (SELECT rec->>'key' FROM jsonb_array_elements(new_plans) rec);
END $$;

