-- Create invoices table for storing invoice records
-- This enables tracking, retrieval, and management of all generated invoices

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

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_restaurant ON public.invoices(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(payment_status);

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    seq_val INTEGER;
    year_month TEXT;
BEGIN
    -- Get next sequence value
    SELECT nextval('invoice_number_seq') INTO seq_val;
    
    -- Format: TT-YYYYMM-XXXXX
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    RETURN 'TT-' || year_month || '-' || LPAD(seq_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_invoice_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_timestamp ON public.invoices;
CREATE TRIGGER trigger_update_invoice_timestamp
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_timestamp();

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Admins can do everything
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

-- 2. Restaurant staff can view their own invoices
DROP POLICY IF EXISTS "Restaurant staff can view own invoices" ON public.invoices;
CREATE POLICY "Restaurant staff can view own invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff
        WHERE staff.user_id = auth.uid()
        AND staff.restaurant_id = invoices.restaurant_id
        AND staff.status = 'active'
    )
);

-- Add company details to system_settings
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

-- Add invoice email template
INSERT INTO public.system_settings (key, value, category, is_public, description)
VALUES (
    'email_template_invoice_v2',
    '{
        "subject": "Invoice {{invoice_number}} from TableTap",
        "html": "<div style=\"font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;\"><div style=\"background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;\"><h1 style=\"color: white; margin: 0; font-size: 28px;\">Invoice</h1><p style=\"color: rgba(255,255,255,0.9); margin: 10px 0 0;\">{{invoice_number}}</p></div><div style=\"padding: 40px 30px; background: #fff; border: 1px solid #e5e5e5; border-top: none;\"><p style=\"margin: 0 0 20px;\">Hi <strong>{{restaurant_name}}</strong>,</p><p style=\"color: #666; line-height: 1.6;\">Thank you for your payment. Please find your invoice details below:</p><div style=\"background: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0;\"><table style=\"width: 100%; border-collapse: collapse;\"><tr><td style=\"padding: 8px 0; color: #666;\">Invoice Date</td><td style=\"padding: 8px 0; text-align: right; font-weight: 600;\">{{date}}</td></tr><tr><td style=\"padding: 8px 0; color: #666;\">Plan</td><td style=\"padding: 8px 0; text-align: right; font-weight: 600;\">{{plan_name}} ({{billing_cycle}})</td></tr><tr style=\"border-top: 1px solid #e5e5e5;\"><td style=\"padding: 12px 0 8px; color: #666;\">Subtotal</td><td style=\"padding: 12px 0 8px; text-align: right;\">₹{{subtotal}}</td></tr><tr><td style=\"padding: 8px 0; color: #666;\">GST (18%)</td><td style=\"padding: 8px 0; text-align: right;\">₹{{gst}}</td></tr><tr style=\"border-top: 2px solid #1a1a1a;\"><td style=\"padding: 12px 0; font-size: 18px; font-weight: 700;\">Total Paid</td><td style=\"padding: 12px 0; text-align: right; font-size: 18px; font-weight: 700; color: #16a34a;\">₹{{total_paid}}</td></tr></table></div><p style=\"color: #666; font-size: 14px;\">A PDF copy of this invoice is attached to this email.</p></div><div style=\"background: #f9fafb; padding: 24px 30px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;\"><p style=\"color: #888; font-size: 12px; margin: 0;\">© {{year}} TableTap Technologies Pvt. Ltd. All rights reserved.</p></div></div>"
    }'::jsonb,
    'email',
    false,
    'Professional invoice email template v2'
) ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Create function to auto-create invoice on subscription payment
CREATE OR REPLACE FUNCTION create_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    inv_number TEXT;
    restaurant_data JSONB;
    company_data JSONB;
    sub_data RECORD;
BEGIN
    -- Only create invoice for new payments
    IF TG_OP = 'INSERT' AND NEW.amount_paid > 0 THEN
        -- Generate invoice number
        inv_number := generate_invoice_number();
        
        -- Get restaurant data
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
        
        -- Get company data from settings
        SELECT value INTO company_data
        FROM public.system_settings
        WHERE key = 'company_details';
        
        -- Get subscription data
        SELECT * INTO sub_data
        FROM public.subscriptions
        WHERE id = NEW.subscription_id;
        
        -- Insert invoice record
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

-- Create trigger for auto-invoice generation
DROP TRIGGER IF EXISTS trigger_create_invoice_on_payment ON public.subscription_history;
CREATE TRIGGER trigger_create_invoice_on_payment
    AFTER INSERT ON public.subscription_history
    FOR EACH ROW
    EXECUTE FUNCTION create_invoice_on_payment();

-- Add comment
COMMENT ON TABLE public.invoices IS 'Stores all generated invoices for subscription payments';
