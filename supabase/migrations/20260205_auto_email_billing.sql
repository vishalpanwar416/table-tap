-- Add auto email billing setting for restaurants (send bill by email when order is completed)
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS auto_email_billing_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.restaurants.auto_email_billing_enabled IS 'When true, completed orders get bill sent automatically to customer email.';
