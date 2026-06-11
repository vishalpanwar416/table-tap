-- Fix auto-renewal toggle: broken notification trigger + server-side RPC with auth checks.

-- 1. handle_admin_notification referenced subscription_history.plan_id (does not exist).
CREATE OR REPLACE FUNCTION public.handle_admin_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
  v_metadata JSONB;
BEGIN
  IF TG_TABLE_NAME = 'landing_inquiries' THEN
    IF TG_OP = 'INSERT' THEN
      v_type := 'new_inquiry';
      v_title := 'New Customer Inquiry';
      v_message := NEW.full_name || ' (' || NEW.restaurant_name || ') has sent a message: ' || substring(NEW.message FROM 1 FOR 50) || '...';
      v_metadata := jsonb_build_object('inquiry_id', NEW.id, 'restaurant_name', NEW.restaurant_name);
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'converted' THEN
      v_type := 'inquiry_converted';
      v_title := 'Lead Converted';
      v_message := NEW.full_name || ' has been converted to a client.';
      v_metadata := jsonb_build_object('inquiry_id', NEW.id);
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'restaurant_registrations' THEN
    IF TG_OP = 'INSERT' THEN
      v_type := 'new_registration';
      v_title := 'New Restaurant Registration';
      v_message := NEW.restaurant_name || ' is pending approval for ' || NEW.city;
      v_metadata := jsonb_build_object('registration_id', NEW.id, 'owner_email', NEW.owner_email);
    ELSIF TG_OP = 'UPDATE' AND OLD.registration_status != NEW.registration_status THEN
      IF NEW.registration_status = 'approved' THEN
        v_type := 'registration_approved';
        v_title := 'Registration Approved';
        v_message := NEW.restaurant_name || ' is now approved!';
      ELSIF NEW.registration_status = 'rejected' THEN
        v_type := 'registration_rejected';
        v_title := 'Registration Rejected';
        v_message := NEW.restaurant_name || ' registration was declined.';
      ELSE
        RETURN NEW;
      END IF;
      v_metadata := jsonb_build_object('registration_id', NEW.id);
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'subscription_history' THEN
    IF TG_OP = 'INSERT' THEN
      v_type := 'new_subscription';
      v_title := 'Subscription update';
      v_message := COALESCE(NEW.new_plan, 'Plan') || ' — ' || COALESCE(NEW.action, 'update')
        || COALESCE(' (' || NEW.notes || ')', '');
      v_metadata := jsonb_build_object(
        'subscription_id', NEW.subscription_id,
        'restaurant_id', NEW.restaurant_id,
        'action', NEW.action,
        'new_plan', NEW.new_plan
      );
    ELSE
      RETURN NEW;
    END IF;

  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.admin_notifications (id, type, title, message, metadata, read)
  VALUES (gen_random_uuid()::text, v_type, v_title, v_message, v_metadata, false);

  RETURN NEW;
END;
$function$;

-- 2. Align can_manage_restaurant with live DB (owner included).
CREATE OR REPLACE FUNCTION public.can_manage_restaurant(rid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF public.is_platform_admin() THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.restaurant_staff rs
    WHERE rs.user_id = auth.uid()
      AND rs.restaurant_id = rid
      AND rs.staff_role IN ('owner', 'manager', 'captain')
      AND rs.connected = true
  );
END;
$function$;

-- 3. RPC: toggle auto_renew with permission check and audit trail.
CREATE OR REPLACE FUNCTION public.toggle_subscription_auto_renew(
  p_subscription_id uuid,
  p_auto_renew boolean
)
RETURNS TABLE (id uuid, auto_renew boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_restaurant_id uuid;
  v_plan text;
  v_status text;
BEGIN
  SELECT s.restaurant_id, s.plan_name, s.status
  INTO v_restaurant_id, v_plan, v_status
  FROM public.subscriptions s
  WHERE s.id = p_subscription_id;

  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  IF NOT public.can_manage_restaurant(v_restaurant_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  RETURN QUERY
  UPDATE public.subscriptions
  SET auto_renew = p_auto_renew, updated_at = now()
  WHERE public.subscriptions.id = p_subscription_id
  RETURNING public.subscriptions.id, public.subscriptions.auto_renew;

  INSERT INTO public.subscription_history (
    subscription_id,
    restaurant_id,
    action,
    old_plan,
    new_plan,
    old_status,
    new_status,
    notes
  ) VALUES (
    p_subscription_id,
    v_restaurant_id,
    'renewed',
    v_plan,
    v_plan,
    v_status,
    v_status,
    CASE WHEN p_auto_renew THEN 'Auto-renewal enabled' ELSE 'Auto-renewal disabled' END
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.toggle_subscription_auto_renew(uuid, boolean) TO authenticated;
