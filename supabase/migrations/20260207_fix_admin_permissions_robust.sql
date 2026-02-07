-- Function to check if current user is admin (Security Definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND profile_role = 'admin'
  );
END;
$$;

-- Ensure RLS is enabled
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS subscription_plans_manage_admin ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.subscription_plans;

-- Create robust Admin policy for subscription_plans
CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Ensure Public/Everyone can READ active plans
DROP POLICY IF EXISTS subscription_plans_select_all ON public.subscription_plans;
DROP POLICY IF EXISTS "Public can view active plans" ON public.subscription_plans;

CREATE POLICY "Public can view active plans"
ON public.subscription_plans
FOR SELECT
TO anon, authenticated
USING (true);

-- Fix Billing Cycles permissions as well
DROP POLICY IF EXISTS billing_cycles_manage_admin ON public.billing_cycles;
CREATE POLICY "Admins can manage billing cycles"
ON public.billing_cycles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS billing_cycles_select_all ON public.billing_cycles;
CREATE POLICY "Public can view billing cycles"
ON public.billing_cycles
FOR SELECT
TO anon, authenticated
USING (true);
