-- Migration to add 'owner', 'chef', 'staff' to allowed roles
-- This aligns the database constraints with the frontend application logic

-- 1. Update profiles table constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_profile_role_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_profile_role_check
CHECK (profile_role IN (
    'admin', 
    'owner', 
    'manager', 
    'captain', 
    'chef', 
    'staff', 
    'waiter', 
    'cashier', 
    'customer'
));

-- 2. Update restaurant_staff table constraint
ALTER TABLE public.restaurant_staff DROP CONSTRAINT IF EXISTS restaurant_staff_staff_role_check;

ALTER TABLE public.restaurant_staff ADD CONSTRAINT restaurant_staff_staff_role_check
CHECK (staff_role IN (
    'owner', 
    'manager', 
    'captain', 
    'chef', 
    'staff', 
    'waiter', 
    'cashier'
));

-- 3. Update existing admin helper comments or functions if they hardcode roles (optional but good practice)
-- (No function updates needed as most use dynamic role checks or simple string comparisons)
