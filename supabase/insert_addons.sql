INSERT INTO public.system_settings (id, key, value, category, is_public, description, is_active)
VALUES (
  gen_random_uuid(),
  'custom_plan_addons',
  '[
    {
      "id": "multi-outlet",
      "name": "Multi-Outlet Sync",
      "description": "Centralized control for chains and franchises.",
      "iconStr": "Building2",
      "basePrice": 5000,
      "unit": "outlet",
      "minUnit": 2
    },
    {
      "id": "whatsapp-bundle",
      "name": "WhatsApp Pro Bundle",
      "description": "10,000 automated messages per month.",
      "iconStr": "MessageSquare",
      "basePrice": 3500,
      "unit": "bundle",
      "minUnit": 1
    },
    {
      "id": "ai-analytics",
      "name": "AI Smart Insights",
      "description": "Predictive analytics and smart inventory alerts.",
      "iconStr": "Brain",
      "basePrice": 2000,
      "unit": "fixed"
    },
    {
      "id": "custom-domain",
      "name": "White-Label Domain",
      "description": "Use your own domain for menu and ordering.",
      "iconStr": "Globe",
      "basePrice": 1000,
      "unit": "fixed"
    },
    {
      "id": "audit-trails",
      "name": "Security Audit Trails",
      "description": "Full logs of every action taken by staff.",
      "iconStr": "ShieldCheck",
      "basePrice": 1500,
      "unit": "fixed"
    },
    {
      "id": "dedicated-csm",
      "name": "Dedicated Support",
      "description": "A dedicated manager for your restaurant group.",
      "iconStr": "Headphones",
      "basePrice": 5000,
      "unit": "fixed"
    },
    {
      "id": "kds-floor",
      "name": "Digital KDS & Floor Plan",
      "description": "Visual table management and kitchen display.",
      "iconStr": "Layers",
      "basePrice": 1500,
      "unit": "fixed"
    }
  ]'::jsonb,
  'pricing',
  true,
  'Configurable add-ons for the Custom Enterprise Plan Builder',
  true
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
