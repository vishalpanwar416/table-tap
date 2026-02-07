ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS cycle_discounts JSONB DEFAULT '{}';

-- Reset existing records to empty JSON if needed (should be empty by default anyway)
UPDATE public.subscription_plans SET cycle_discounts = '{}' WHERE cycle_discounts IS NULL;
