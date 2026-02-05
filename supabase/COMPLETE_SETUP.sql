-- ============================================================================
-- TableTap - Complete Supabase Backend Setup
-- ============================================================================
-- This file contains EVERYTHING needed to recreate the TableTap Supabase backend
-- Run this in a fresh Supabase project to get a complete replica
-- 
-- Order of execution:
-- 1. Extensions
-- 2. Tables (in dependency order)
-- 3. Helper Functions
-- 4. Triggers
-- 5. RLS Policies
-- 6. Storage Configuration
-- 7. Initial Data Seeding
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 2: TABLES (In Dependency Order)
-- ============================================================================

-- -----------------------------
-- 2.1 profiles (Auth users extend this)
-- -----------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    profile_role TEXT DEFAULT 'customer' CHECK (profile_role IN ('admin', 'manager', 'captain', 'waiter', 'cashier', 'customer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(profile_role);

-- -----------------------------
-- 2.2 restaurants
-- -----------------------------
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    cuisine_type TEXT,
    
    -- Contact Details
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    country TEXT DEFAULT 'India',
    contact_email TEXT,
    contact_phone TEXT,
    
    -- Business Details
    gst_number TEXT,
    fssai_number TEXT,
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    ai_enabled BOOLEAN DEFAULT false,
    aggregators_enabled BOOLEAN DEFAULT false,
    email_bill_enabled BOOLEAN DEFAULT true,
    whatsapp_bill_enabled BOOLEAN DEFAULT true,
    
    -- Tables Configuration (JSON array)
    tables JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_active ON public.restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON public.restaurants(city);

-- -----------------------------
-- 2.3 subscriptions
-- -----------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    
    -- Plan Details
    plan_name TEXT NOT NULL DEFAULT 'starter' CHECK (plan_name IN ('starter', 'professional', 'enterprise')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    
    -- Pricing
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    final_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'grace_period', 'expired', 'cancelled')),
    
    -- Payment
    payment_method TEXT,
    
    -- Dates
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON public.subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);

-- -----------------------------
-- 2.4 subscription_history
-- -----------------------------
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    
    -- Action Details
    action TEXT NOT NULL CHECK (action IN ('created', 'renewed', 'upgraded', 'downgraded', 'cancelled', 'expired')),
    old_plan TEXT,
    new_plan TEXT,
    
    -- Billing
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    gst_amount DECIMAL(10, 2) DEFAULT 0,
    
    -- Payment
    payment_reference TEXT,
    payment_method TEXT,
    
    -- Metadata
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_history_subscription ON public.subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_history_restaurant ON public.subscription_history(restaurant_id);

-- -----------------------------
-- 2.5 restaurant_staff
-- -----------------------------
CREATE TABLE IF NOT EXISTS public.restaurant_staff (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    
    staff_role TEXT NOT NULL CHECK (staff_role IN ('manager', 'captain', 'waiter', 'cashier')),
    connected BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_user ON public.restaurant_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_restaurant ON public.restaurant_staff(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_staff_connected ON public.restaurant_staff(connected);

-- -----------------------------
-- 2.6 food_items
-- -----------------------------
CREATE TABLE IF NOT EXISTS public.food_items (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    
    -- Item Details
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discounted_price DECIMAL(10, 2),
    
    -- Media
    image_url TEXT,
    
    -- Attributes
    is_vegetarian BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Metadata
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_items_restaurant ON public.food_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON public.food_items(category);
CREATE INDEX IF NOT EXISTS idx_food_items_available ON public.food_items(is_available);

-- -----------------------------
-- 2.7 orders
-- -----------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    
    -- Relations
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    
    -- Order Number
    order_number TEXT,
    
    -- Customer Details
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    table_number TEXT,
    
    -- Order Items (JSONB array)
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'rejected')),
    
    -- Payment
    payment_method TEXT DEFAULT 'online' CHECK (payment_method IN ('online', 'razorpay', 'cash', 'upi', 'card', 'direct')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_notes TEXT,
    payment_timestamp TIMESTAMPTZ,
    
    -- Razorpay
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    
    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    gst DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- Special Instructions
    special_instructions TEXT,
    cancel_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- -----------------------------
-- 2.8 system_settings
-- -----------------------------
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

CREATE INDEX IF NOT EXISTS idx_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_public ON public.system_settings(is_public);

-- -----------------------------
-- 2.9 invoices
-- -----------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    
    -- Invoice identification
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    
    -- Relations
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    subscription_history_id UUID REFERENCES public.subscription_history(id) ON DELETE SET NULL,
    
    -- Invoice type
    invoice_type TEXT NOT NULL DEFAULT 'subscription' CHECK (invoice_type IN ('subscription', 'renewal', 'upgrade', 'addon', 'refund', 'credit_note')),
    
    -- Amount breakdown
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    taxable_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cgst_rate DECIMAL(5, 2) DEFAULT 9.00,
    cgst_amount DECIMAL(10, 2) DEFAULT 0,
    sgst_rate DECIMAL(5, 2) DEFAULT 9.00,
    sgst_amount DECIMAL(10, 2) DEFAULT 0,
    igst_rate DECIMAL(5, 2) DEFAULT 0,
    igst_amount DECIMAL(10, 2) DEFAULT 0,
    total_tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- Currency
    currency TEXT DEFAULT 'INR',
    
    -- Payment details
    payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'refunded', 'cancelled')),
    payment_method TEXT,
    payment_reference TEXT,
    payment_date TIMESTAMPTZ,
    
    -- Line items (stored as JSON for flexibility)
    line_items JSONB DEFAULT '[]'::jsonb,
    
    -- Customer snapshot (in case restaurant details change)
    customer_snapshot JSONB,
    
    -- Company details snapshot
    company_snapshot JSONB,
    
    -- Additional info
    notes TEXT,
    terms TEXT,
    
    -- Email tracking
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    email_sent_to TEXT,
    
    -- PDF storage (optional - can store URL to cloud storage)
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Voiding
    is_void BOOLEAN DEFAULT false,
    voided_at TIMESTAMPTZ,
    void_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_invoices_restaurant ON public.invoices(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(payment_status);

-- ============================================================================
-- SECTION 3: HELPER FUNCTIONS
-- ============================================================================

-- -----------------------------
-- 3.1 Check if user is platform admin
-- -----------------------------
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.profile_role = 'admin'
  );
$$;

-- -----------------------------
-- 3.2 Get current user's restaurant ID
-- -----------------------------
CREATE OR REPLACE FUNCTION public.current_restaurant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT rs.restaurant_id
  FROM public.restaurant_staff rs
  WHERE rs.user_id = auth.uid()
    AND rs.connected = true
  LIMIT 1;
$$;

-- -----------------------------
-- 3.3 Check if user can manage restaurant
-- -----------------------------
CREATE OR REPLACE FUNCTION public.can_manage_restaurant(rid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.restaurant_staff rs
      WHERE rs.user_id = auth.uid()
        AND rs.connected = true
        AND rs.restaurant_id = rid
        AND rs.staff_role IN ('manager','captain')
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.profile_role IN ('manager','captain')
    );
$$;

-- -----------------------------
-- 3.4 Generate invoice number
-- -----------------------------
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    seq_val INTEGER;
    year_month TEXT;
BEGIN
    SELECT nextval('invoice_number_seq') INTO seq_val;
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    RETURN 'TT-' || year_month || '-' || LPAD(seq_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- -----------------------------
-- 3.5 Update timestamp function
-- -----------------------------
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 4: TRIGGERS
-- ============================================================================

-- -----------------------------
-- 4.1 Auto-update timestamps
-- -----------------------------
DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_restaurants_modtime ON public.restaurants;
CREATE TRIGGER update_restaurants_modtime
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_subscriptions_modtime ON public.subscriptions;
CREATE TRIGGER update_subscriptions_modtime
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_staff_modtime ON public.restaurant_staff;
CREATE TRIGGER update_staff_modtime
    BEFORE UPDATE ON public.restaurant_staff
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_food_items_modtime ON public.food_items;
CREATE TRIGGER update_food_items_modtime
    BEFORE UPDATE ON public.food_items
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_orders_modtime ON public.orders;
CREATE TRIGGER update_orders_modtime
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- -----------------------------
-- 4.2 Block payment_status updates
-- -----------------------------
CREATE OR REPLACE FUNCTION public.block_payment_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.payment_status IS DISTINCT FROM OLD.payment_status)
     AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not allowed to change payment_status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_payment_status_update ON public.orders;
CREATE TRIGGER trg_block_payment_status_update
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.block_payment_status_update();

-- -----------------------------
-- 4.3 Auto-create invoice on subscription payment
-- -----------------------------
CREATE OR REPLACE FUNCTION create_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    inv_number TEXT;
    restaurant_data JSONB;
    company_data JSONB;
    sub_data RECORD;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.amount_paid > 0 THEN
        inv_number := generate_invoice_number();
        
        SELECT jsonb_build_object(
            'name', r.name,
            'address', r.address,
            'city', r.city,
            'state', r.state,
            'pincode', r.pincode,
            'email', r.contact_email,
            'phone', r.contact_phone,
            'gstin', r.gst_number
        ) INTO restaurant_data
        FROM public.restaurants r
        WHERE r.id = NEW.restaurant_id;
        
        SELECT value INTO company_data
        FROM public.system_settings
        WHERE key = 'company_details';
        
        SELECT * INTO sub_data
        FROM public.subscriptions
        WHERE id = NEW.subscription_id;
        
        INSERT INTO public.invoices (
            invoice_number,
            invoice_date,
            due_date,
            restaurant_id,
            subscription_id,
            subscription_history_id,
            invoice_type,
            subtotal,
            taxable_amount,
            cgst_amount,
            sgst_amount,
            total_tax,
            total_amount,
            payment_status,
            payment_method,
            payment_reference,
            payment_date,
            line_items,
            customer_snapshot,
            company_snapshot,
            created_by
        ) VALUES (
            inv_number,
            NOW(),
            NOW(),
            NEW.restaurant_id,
            NEW.subscription_id,
            NEW.id,
            CASE 
                WHEN NEW.action = 'renewed' THEN 'renewal'
                WHEN NEW.action = 'upgraded' THEN 'upgrade'
                ELSE 'subscription'
            END,
            COALESCE(NEW.amount_paid, 0) - COALESCE(NEW.gst_amount, 0),
            COALESCE(NEW.amount_paid, 0) - COALESCE(NEW.gst_amount, 0),
            COALESCE(NEW.gst_amount, 0) / 2,
            COALESCE(NEW.gst_amount, 0) / 2,
            COALESCE(NEW.gst_amount, 0),
            COALESCE(NEW.amount_paid, 0),
            'paid',
            COALESCE(sub_data.payment_method, 'online'),
            NEW.payment_reference,
            NOW(),
            jsonb_build_array(
                jsonb_build_object(
                    'name', 'TableTap ' || INITCAP(COALESCE(NEW.new_plan, sub_data.plan_name, 'Professional')),
                    'description', INITCAP(COALESCE(sub_data.billing_cycle, 'Monthly')) || ' Subscription',
                    'quantity', 1,
                    'unit_price', COALESCE(NEW.amount_paid, 0) - COALESCE(NEW.gst_amount, 0),
                    'tax_rate', 18
                )
            ),
            restaurant_data,
            company_data,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_invoice_on_payment ON public.subscription_history;
CREATE TRIGGER trigger_create_invoice_on_payment
    AFTER INSERT ON public.subscription_history
    FOR EACH ROW
    EXECUTE FUNCTION create_invoice_on_payment();

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- -----------------------------
-- 5.1 Enable RLS on all tables
-- -----------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- -----------------------------
-- 5.2 profiles policies
-- -----------------------------
DROP POLICY IF EXISTS profiles_read_own ON public.profiles;
CREATE POLICY profiles_read_own
ON public.profiles FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_admin_read_all ON public.profiles;
CREATE POLICY profiles_admin_read_all
ON public.profiles FOR SELECT
USING (public.is_platform_admin());

-- -----------------------------
-- 5.3 restaurants policies
-- -----------------------------
DROP POLICY IF EXISTS restaurants_public_read_active ON public.restaurants;
CREATE POLICY restaurants_public_read_active
ON public.restaurants FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.restaurant_id = restaurants.id
      AND s.status IN ('active', 'grace_period')
  )
);

DROP POLICY IF EXISTS restaurants_admin_read_all ON public.restaurants;
CREATE POLICY restaurants_admin_read_all
ON public.restaurants FOR SELECT
USING (public.is_platform_admin());

DROP POLICY IF EXISTS restaurants_staff_read_own ON public.restaurants;
CREATE POLICY restaurants_staff_read_own
ON public.restaurants FOR SELECT
USING (id = public.current_restaurant_id());

-- Staff/manager/admin can browse ALL active restaurants on the selection page (not just their own)
DROP POLICY IF EXISTS restaurants_staff_browse_all_active ON public.restaurants;
CREATE POLICY restaurants_staff_browse_all_active
ON public.restaurants FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.restaurant_id = restaurants.id
      AND s.status IN ('active', 'grace_period')
  )
  AND EXISTS (
    SELECT 1
    FROM public.restaurant_staff rs
    WHERE rs.user_id = auth.uid()
      AND rs.connected = true
  )
);

DROP POLICY IF EXISTS restaurants_manage_update ON public.restaurants;
CREATE POLICY restaurants_manage_update
ON public.restaurants FOR UPDATE
USING (public.can_manage_restaurant(id))
WITH CHECK (public.can_manage_restaurant(id));

DROP POLICY IF EXISTS restaurants_admin_insert ON public.restaurants;
CREATE POLICY restaurants_admin_insert
ON public.restaurants FOR INSERT
WITH CHECK (public.is_platform_admin());

-- -----------------------------
-- 5.4 subscriptions policies
-- -----------------------------
DROP POLICY IF EXISTS subscriptions_public_read_status ON public.subscriptions;
CREATE POLICY subscriptions_public_read_status
ON public.subscriptions FOR SELECT
USING (status IN ('active', 'grace_period'));

DROP POLICY IF EXISTS subscriptions_admin_read_all ON public.subscriptions;
CREATE POLICY subscriptions_admin_read_all
ON public.subscriptions FOR SELECT
USING (public.is_platform_admin());

DROP POLICY IF EXISTS subscriptions_staff_read_own ON public.subscriptions;
CREATE POLICY subscriptions_staff_read_own
ON public.subscriptions FOR SELECT
USING (restaurant_id = public.current_restaurant_id());

-- Staff/manager/admin can read subscription status for all active/grace_period (for selection page join)
DROP POLICY IF EXISTS subscriptions_staff_browse_active ON public.subscriptions;
CREATE POLICY subscriptions_staff_browse_active
ON public.subscriptions FOR SELECT
USING (
  status IN ('active', 'grace_period')
  AND EXISTS (
    SELECT 1
    FROM public.restaurant_staff rs
    WHERE rs.user_id = auth.uid()
      AND rs.connected = true
  )
);

-- -----------------------------
-- 5.5 restaurant_staff policies
-- -----------------------------
DROP POLICY IF EXISTS staff_admin_read_all ON public.restaurant_staff;
CREATE POLICY staff_admin_read_all
ON public.restaurant_staff FOR SELECT
USING (public.is_platform_admin());

DROP POLICY IF EXISTS staff_read_own_restaurant ON public.restaurant_staff;
CREATE POLICY staff_read_own_restaurant
ON public.restaurant_staff FOR SELECT
USING (restaurant_id = public.current_restaurant_id());

DROP POLICY IF EXISTS staff_manage_insert ON public.restaurant_staff;
CREATE POLICY staff_manage_insert
ON public.restaurant_staff FOR INSERT
WITH CHECK (public.can_manage_restaurant(restaurant_id));

DROP POLICY IF EXISTS staff_manage_update ON public.restaurant_staff;
CREATE POLICY staff_manage_update
ON public.restaurant_staff FOR UPDATE
USING (public.can_manage_restaurant(restaurant_id))
WITH CHECK (public.can_manage_restaurant(restaurant_id));

DROP POLICY IF EXISTS staff_manage_delete ON public.restaurant_staff;
CREATE POLICY staff_manage_delete
ON public.restaurant_staff FOR DELETE
USING (public.can_manage_restaurant(restaurant_id));

-- -----------------------------
-- 5.6 food_items policies
-- -----------------------------
DROP POLICY IF EXISTS food_items_public_read ON public.food_items;
CREATE POLICY food_items_public_read
ON public.food_items FOR SELECT
USING (is_available = true);

DROP POLICY IF EXISTS food_items_staff_manage ON public.food_items;
CREATE POLICY food_items_staff_manage
ON public.food_items FOR ALL
USING (restaurant_id = public.current_restaurant_id());

DROP POLICY IF EXISTS food_items_admin_all ON public.food_items;
CREATE POLICY food_items_admin_all
ON public.food_items FOR ALL
USING (public.is_platform_admin());

-- -----------------------------
-- 5.7 orders policies
-- -----------------------------
DROP POLICY IF EXISTS orders_admin_read_all ON public.orders;
CREATE POLICY orders_admin_read_all
ON public.orders FOR SELECT
USING (public.is_platform_admin());

DROP POLICY IF EXISTS orders_restaurant_read_own ON public.orders;
CREATE POLICY orders_restaurant_read_own
ON public.orders FOR SELECT
USING (restaurant_id = public.current_restaurant_id());

DROP POLICY IF EXISTS orders_user_read_own ON public.orders;
CREATE POLICY orders_user_read_own
ON public.orders FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS orders_insert_authenticated ON public.orders;
CREATE POLICY orders_insert_authenticated
ON public.orders FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS orders_update_by_restaurant_staff ON public.orders;
CREATE POLICY orders_update_by_restaurant_staff
ON public.orders FOR UPDATE
USING (restaurant_id = public.current_restaurant_id())
WITH CHECK (restaurant_id = public.current_restaurant_id());

-- -----------------------------
-- 5.8 system_settings policies
-- -----------------------------
DROP POLICY IF EXISTS "Public can read public settings" ON public.system_settings;
CREATE POLICY "Public can read public settings" 
ON public.system_settings FOR SELECT 
TO anon, authenticated 
USING (is_public = true);

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

-- -----------------------------
-- 5.9 invoices policies
-- -----------------------------
DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;
CREATE POLICY "Admins can manage all invoices"
ON public.invoices FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.profile_role = 'admin'
    )
);

DROP POLICY IF EXISTS "Restaurant staff can view own invoices" ON public.invoices;
CREATE POLICY "Restaurant staff can view own invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_staff
        WHERE restaurant_staff.user_id = auth.uid()
        AND restaurant_staff.restaurant_id = invoices.restaurant_id
        AND restaurant_staff.connected = true
    )
);

-- ============================================================================
-- SECTION 6: STORAGE BUCKETS & POLICIES
-- ============================================================================

-- -----------------------------
-- 6.1 Create avatars bucket (if not exists)
-- -----------------------------
-- Note: This needs to be done via Supabase Dashboard or Storage API
-- CREATE BUCKET IF NOT EXISTS 'avatars' WITH (public = false);

-- -----------------------------
-- 6.2 Storage policies for avatars
-- -----------------------------

-- Drop old policies
DROP POLICY IF EXISTS "Users can read their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their avatar" ON storage.objects;

-- 1. Anyone can read the default avatar (no auth required)
DROP POLICY IF EXISTS avatars_read_default ON storage.objects;
CREATE POLICY avatars_read_default
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND name = 'default.jpg');

-- 2. Authenticated users can read all avatars (public profile photos)
DROP POLICY IF EXISTS avatars_read_all ON storage.objects;
CREATE POLICY avatars_read_all
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 3. Users can upload to their own folder only (profile-photos/{user_id}/*)
DROP POLICY IF EXISTS avatars_insert_own ON storage.objects;
CREATE POLICY avatars_insert_own
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'profile-photos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. Users can update their own photos only
DROP POLICY IF EXISTS avatars_update_own ON storage.objects;
CREATE POLICY avatars_update_own
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'profile-photos'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'profile-photos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 5. Users can delete their own photos only
DROP POLICY IF EXISTS avatars_delete_own ON storage.objects;
CREATE POLICY avatars_delete_own
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'profile-photos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================================================
-- SECTION 7: INITIAL DATA SEEDING
-- ============================================================================

-- -----------------------------
-- 7.1 System Settings - Landing Page
-- -----------------------------
INSERT INTO public.system_settings (key, value, category, is_public, description)
VALUES 
(
    'landing_hero', 
    '{
        "title": "Manage Your Restaurant Smarter", 
        "subtitle": "The all-in-one QR menu and ordering system.", 
        "cta_text": "Get Started Now",
        "image_url": "/hero-dashboard.png"
    }'::jsonb, 
    'landing_page', 
    true, 
    'Main Hero Section Content'
),
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
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- -----------------------------
-- 7.2 System Settings - Company Details
-- -----------------------------
INSERT INTO public.system_settings (key, value, category, is_public, description)
VALUES (
    'company_details',
    '{
        "name": "TableTap Technologies Pvt. Ltd.",
        "address": "123 Tech Park, Sector 62",
        "city": "Noida",
        "state": "Uttar Pradesh",
        "pincode": "201301",
        "country": "India",
        "phone": "+91 98765 43210",
        "email": "billing@tabletap.in",
        "website": "www.tabletap.in",
        "gstin": "09AABCT1234F1ZG",
        "pan": "AABCT1234F",
        "cin": "U72200UP2024PTC123456"
    }'::jsonb,
    'general',
    false,
    'Company details for invoices and legal documents'
) ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- -----------------------------
-- 7.3 System Settings - API Keys (REPLACE WITH YOUR KEYS)
-- -----------------------------
INSERT INTO public.system_settings (key, value, category, is_public, description)
VALUES 
(
    'razorpay_keys', 
    '{"key_id": "YOUR_RAZORPAY_KEY_ID", "key_secret": "YOUR_RAZORPAY_KEY_SECRET"}'::jsonb, 
    'payment', 
    false, 
    'Razorpay API Configuration'
),
(
    'resend_config', 
    '{"api_key": "YOUR_RESEND_API_KEY", "from_email": "noreply@yourdomain.com"}'::jsonb, 
    'email', 
    false, 
    'Resend (Email Service) API Configuration'
)
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- 
-- Next Steps:
-- 1. Create Storage Bucket: Go to Storage in Supabase Dashboard and create 'avatars' bucket
-- 2. Update API Keys: Replace placeholder API keys in system_settings table
-- 3. Configure Auth: Set up Google OAuth in Supabase Auth settings
-- 4. Test: Create a test restaurant and verify RLS policies work correctly
--
-- ============================================================================
