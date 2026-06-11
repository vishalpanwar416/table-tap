-- Daily subscription renewal cron via pg_cron + pg_net.
-- Cron secret + function URL are read from system_settings (populated by ops / CLI).

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

INSERT INTO public.system_settings (key, value, category, description, is_public, is_secret)
VALUES (
  'subscription_autopay_ops',
  jsonb_build_object(
    'renewal_function', 'process-subscription-renewals',
    'webhook_function', 'razorpay-subscription-webhook',
    'cron_schedule', '30 2 * * *',
    'function_url', '',
    'cron_secret', '',
    'webhook_url', ''
  ),
  'api',
  'Subscription autopay operations config (function_url, cron_secret, webhook_url set per environment)',
  false,
  true
)
ON CONFLICT (key) DO UPDATE SET
  value = public.system_settings.value || EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.invoke_subscription_renewal_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_cfg jsonb;
  v_url text;
  v_secret text;
BEGIN
  SELECT value INTO v_cfg FROM public.system_settings WHERE key = 'subscription_autopay_ops';
  v_url := nullif(trim(v_cfg->>'function_url'), '');
  v_secret := nullif(trim(v_cfg->>'cron_secret'), '');

  IF v_url IS NULL OR v_secret IS NULL THEN
    RAISE NOTICE 'subscription_autopay_ops.function_url or cron_secret not configured — skipping renewal invoke';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := '{}'::jsonb
  );
END;
$function$;

DO $cron$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'process-subscription-renewals';
  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;

  PERFORM cron.schedule(
    'process-subscription-renewals',
    '30 2 * * *',
    'SELECT public.invoke_subscription_renewal_cron()'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$cron$;
