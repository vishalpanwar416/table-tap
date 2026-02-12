-- Secure RPC function to sync guest orders manually/on-login
-- This is safer and more performant than a blocking trigger on the profiles table
CREATE OR REPLACE FUNCTION public.sync_guest_orders()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_count integer;
  current_user_email text;
  current_user_phone text;
BEGIN
  -- 1. Get current authenticated user's details directly from auth.users for security
  SELECT 
    email, 
    -- Prioritize the native auth phone column, then fallback to metadata
    COALESCE(phone, raw_user_meta_data->>'mobile_number', raw_user_meta_data->>'phone')
  INTO current_user_email, current_user_phone
  FROM auth.users
  WHERE id = auth.uid();

  -- If no user is found (shouldn't happen if called authenticated), return error
  IF current_user_email IS NULL AND current_user_phone IS NULL THEN
     RETURN json_build_object('success', false, 'message', 'User details not found');
  END IF;

  -- 2. Update orders and count them in a single atomic operation
  WITH updated_rows AS (
    UPDATE public.orders
    SET user_id = auth.uid()
    WHERE user_id IS NULL -- Only claim orphaned orders
    AND (
      -- Match by Email (User must have an email and it must match)
      (current_user_email IS NOT NULL AND LOWER(customer_email) = LOWER(current_user_email))
      OR
      -- Match by Phone (Clean spaces/formatting before comparing)
      (current_user_phone IS NOT NULL AND 
       REPLACE(customer_phone, ' ', '') = REPLACE(current_user_phone, ' ', ''))
    )
    RETURNING 1
  )
  SELECT count(*) INTO match_count FROM updated_rows;

  -- 3. Return the result for UI feedback
  RETURN json_build_object(
    'success', true, 
    'linked_count', match_count,
    'message', format('Successfully linked %s past orders', match_count)
  );
END;
$$;
