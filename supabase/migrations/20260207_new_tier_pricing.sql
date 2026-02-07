-- Migration to update subscription plans to the new 2026 pricing and feature sets
-- Lite: ₹899, Standard: ₹1,199, Pro: ₹1,699, Enterprise: ₹29,999+
-- Keeps Demo plan intact.

DO $$
DECLARE
    new_plans JSONB := '[
      {
        "key": "lite",
        "name": "Lite",
        "base_price": 899,
        "features": [
          "QR ordering & Digital menu",
          "Order dashboard & Tables",
          "10 staff seats",
          "Email billing/receipts",
          "Basic sales/traffic analytics",
          "WhatsApp pay-as-you-go (₹1/msg)",
          "Email support (weekdays)",
          "Self-serve onboarding"
        ],
        "is_active": true
      },
      {
        "key": "standard",
        "name": "Standard",
        "base_price": 1199,
        "features": [
          "Everything in Lite",
          "Inventory & costing (Recipes, stock alerts)",
          "Product mix & daypart analytics",
          "300 WhatsApp msgs/mo included",
          "25 staff seats & Role-based access",
          "Basic aggregator status toggle",
          "Email/In-app support (7 days)",
          "30-min guided onboarding call"
        ],
        "is_active": true
      },
      {
        "key": "pro",
        "name": "Pro",
        "base_price": 1699,
        "features": [
          "Everything in Standard",
          "800 WhatsApp msgs/mo included",
          "AI forecasting & smart alerts",
          "Full aggregator sync & relay",
          "Floor plan + KDS (Captain/Counter)",
          "Mini-site + order link (Custom domain)",
          "50 staff seats & Audit logs",
          "Priority performance support (SLA)",
          "Done-for-you menu setup & training"
        ],
        "is_active": true
      },
      {
        "key": "custom",
        "name": "Enterprise",
        "base_price": 29999,
        "features": [
          "Bespoke Multi-outlet controls",
          "Custom WhatsApp bundles (10k-50k)",
          "Dedicated DB / Project isolation",
          "Custom AI & ERP integrations",
          "SSO & Security audit trails",
          "Dedicated CSM & Priority SLA",
          "Starting ₹29,999 - ₹59,999/mo",
          "Full migration & onboarding support"
        ],
        "is_active": true
      },
      {
        "key": "demo",
        "name": "Demo",
        "base_price": 0,
        "features": [
          "Limited access",
          "For testing only",
          "Non-billable"
        ],
        "is_active": true
      }
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

    -- Update billing cycles for the 2 months free annual offer
    -- Assuming a billing_cycles table exists with key ''yearly''
    UPDATE public.billing_cycles
    SET discount_percentage = 16.67, -- ~2 months free (2/12 = 16.67%)
        updated_at = NOW()
    WHERE key = ''yearly'';

END $$;
