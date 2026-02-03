-- Create a table for dynamic system settings (Landing Page + Admin Keys)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('landing_page', 'payment', 'email', 'general', 'legal')),
    is_public BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Public can read ONLY public settings (e.g. Landing page content)
DROP POLICY IF EXISTS "Public can read public settings" ON public.system_settings;
CREATE POLICY "Public can read public settings" 
ON public.system_settings FOR SELECT 
TO anon, authenticated 
USING (is_public = true);

-- 2. Admins can do everything
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings" 
ON public.system_settings FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.profile_role = 'admin'
    )
);

-- Initial Data Seeding

-- 1. Landing Page: Hero Section
INSERT INTO public.system_settings (key, value, category, is_public, description)
VALUES 
(
    'landing_hero', 
    '{
        "title": "Manage Your Restaurant Smarter", 
        "subtitle": "The all-in-one QR menu and ordering system.", 
        "cta_text": "Approve Now",
        "image_url": "/hero-dashboard.png"
    }'::jsonb, 
    'landing_page', 
    true, 
    'Main Hero Section Content'
) ON CONFLICT (key) DO NOTHING;

-- 2. External Links (Socials)
INSERT INTO public.system_settings (key, value, category, is_public, description)
VALUES 
(
    'social_links', 
    '{
        "facebook": "https://facebook.com/tabletap", 
        "instagram": "https://instagram.com/tabletap",
        "twitter": "https://x.com/tabletap"
    }'::jsonb, 
    'landing_page', 
    true, 
    'Social Media Links'
) ON CONFLICT (key) DO NOTHING;

-- 3. Admin Keys (Private)
INSERT INTO public.system_settings (key, value, category, is_public, description)
VALUES 
(
    'razorpay_keys', 
    '{"key_id": "YOUR_KEY_ID", "key_secret": "YOUR_KEY_SECRET"}'::jsonb, 
    'payment', 
    false, 
    'Razorpay API Configuration'
),
(
    'resend_config', 
    '{"api_key": "re_V9dLPZBZ_K76NRB5ywN3eJMeFuqqCUHTR", "from_email": "onboarding@resend.dev"}'::jsonb, 
    'email', 
    false, 
    'Resend (Email Service) API Configuration'
) ON CONFLICT (key) DO NOTHING;
