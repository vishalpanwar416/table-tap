-- Log automatic subscription expiry to admin_activity_logs.
--
-- Expiry runs server-side via the hourly pg_cron job `expire-overdue-subscriptions`
-- (SELECT public.expire_overdue_subscriptions()). That function created an
-- admin_notifications entry but never an admin_activity_logs entry, so automatic
-- expirations never appeared in the admin Activity Logs screen.
--
-- This recreates the function verbatim with a single addition: an INSERT into
-- admin_activity_logs right after a subscription is marked expired. The expiry
-- loop only processes active subscriptions past their end date, so each
-- subscription is logged exactly once (it won't be re-selected next run).

CREATE OR REPLACE FUNCTION public.expire_overdue_subscriptions()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  updated_count INTEGER;
  rec RECORD;
BEGIN
  -- Process each subscription that should expire
  FOR rec IN
    SELECT s.id AS sub_id, s.plan_name, s.end_date, r.id AS restaurant_id, r.name AS restaurant_name
    FROM subscriptions s
    JOIN restaurants r ON r.id = s.restaurant_id
    WHERE s.status = 'active' AND s.end_date < NOW()
  LOOP
    -- Mark as expired
    UPDATE subscriptions SET status = 'expired', updated_at = NOW() WHERE id = rec.sub_id;

    -- Activity log entry (added): surface automatic expiry in admin Activity Logs.
    INSERT INTO admin_activity_logs (
      activity_type, activity_name, restaurant_id, user_id, user_name,
      target_type, target_id, target_name, status, details, description
    ) VALUES (
      'subscription_expired',
      'Subscription expired',
      rec.restaurant_id,
      NULL,
      'System',
      'subscription',
      rec.sub_id,
      rec.restaurant_name,
      'success',
      jsonb_build_object('plan_name', rec.plan_name, 'end_date', rec.end_date, 'source', 'cron'),
      'Subscription auto-expired — restaurant hidden from customers until renewed'
    );

    -- Create admin notification (avoid duplicates using metadata matching)
    IF NOT EXISTS (
      SELECT 1 FROM admin_notifications
      WHERE type = 'subscription_expired'
        AND metadata->>'subscription_id' = rec.sub_id::text
        AND created_at > NOW() - INTERVAL '25 hours'
    ) THEN
      INSERT INTO admin_notifications (id, type, title, message, metadata, read, created_at, updated_at)
      VALUES (
        uuid_generate_v4()::text,
        'subscription_expired',
        '🔴 Subscription Expired: ' || rec.restaurant_name,
        'The ' || COALESCE(rec.plan_name, 'subscription') || ' plan for ' || rec.restaurant_name ||
          ' expired on ' || TO_CHAR(rec.end_date AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY') ||
          '. They have a 7-day grace period. Please follow up.',
        jsonb_build_object(
          'subscription_id', rec.sub_id,
          'restaurant_id', rec.restaurant_id,
          'restaurant_name', rec.restaurant_name,
          'plan_name', rec.plan_name,
          'end_date', rec.end_date
        ),
        false,
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;

  -- Also handle: subscriptions expiring in ≤7 days (send expiring-soon notification once per day)
  FOR rec IN
    SELECT s.id AS sub_id, s.plan_name, s.end_date, r.id AS restaurant_id, r.name AS restaurant_name,
           CEIL(EXTRACT(EPOCH FROM (s.end_date - NOW())) / 86400)::int AS days_left
    FROM subscriptions s
    JOIN restaurants r ON r.id = s.restaurant_id
    WHERE s.status = 'active'
      AND s.end_date > NOW()
      AND s.end_date < NOW() + INTERVAL '7 days'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM admin_notifications
      WHERE type = 'subscription_expiring'
        AND metadata->>'subscription_id' = rec.sub_id::text
        AND created_at > NOW() - INTERVAL '23 hours'
    ) THEN
      INSERT INTO admin_notifications (id, type, title, message, metadata, read, created_at, updated_at)
      VALUES (
        uuid_generate_v4()::text,
        'subscription_expiring',
        '⚠️ Expiring Soon: ' || rec.restaurant_name,
        rec.restaurant_name || '''s ' || COALESCE(rec.plan_name, 'subscription') || ' plan expires in ' ||
          rec.days_left || ' day' || CASE WHEN rec.days_left = 1 THEN '' ELSE 's' END || '. Remind the owner to renew.',
        jsonb_build_object(
          'subscription_id', rec.sub_id,
          'restaurant_id', rec.restaurant_id,
          'restaurant_name', rec.restaurant_name,
          'plan_name', rec.plan_name,
          'end_date', rec.end_date,
          'days_left', rec.days_left
        ),
        false,
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$function$;
