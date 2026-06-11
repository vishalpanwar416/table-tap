import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  getAdminClient,
  getRazorpayCredentials,
  razorpayRequest,
} from '../_shared/razorpay.ts';
import {
  applySuccessfulSubscriptionPayment,
  loadPlanPricing,
} from '../_shared/subscriptionBilling.ts';

function isAuthorizedCron(req: Request): boolean {
  const cronSecret = Deno.env.get('SUBSCRIPTION_CRON_SECRET');
  const headerSecret = req.headers.get('x-cron-secret');
  if (cronSecret && headerSecret === cronSecret) return true;

  const auth = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return auth === `Bearer ${serviceKey}`;
}

serve(async (req) => {
  const headers = { 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  if (!isAuthorizedCron(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  try {
    const adminClient = await getAdminClient();
    const creds = await getRazorpayCredentials(adminClient);

    const now = new Date();
    const chargeWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: dueSubs, error: queryError } = await adminClient
      .from('subscriptions')
      .select(
        'id, restaurant_id, plan_name, billing_cycle, razorpay_customer_id, razorpay_token_id, next_payment_date, autopay_method, last_charge_attempt_at',
      )
      .eq('auto_renew', true)
      .eq('autopay_status', 'active')
      .not('razorpay_token_id', 'is', null)
      .in('status', ['active', 'grace_period'])
      .lte('next_payment_date', chargeWindow.toISOString())
      .is('pending_renewal_order_id', null);

    if (queryError) throw queryError;

    const results: Array<Record<string, unknown>> = [];

    for (const sub of dueSubs ?? []) {
      try {
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
        if (sub.last_charge_attempt_at && sub.last_charge_attempt_at > twelveHoursAgo) {
          results.push({ subscription_id: sub.id, skipped: true, reason: 'recent_attempt' });
          continue;
        }

        const pricing = await loadPlanPricing(adminClient, sub.plan_name, sub.billing_cycle);

        const { data: restaurant } = await adminClient
          .from('restaurants')
          .select('name, contact_email, contact_phone, enable_subscription_autopay')
          .eq('id', sub.restaurant_id)
          .single();

        if (restaurant?.enable_subscription_autopay === false) {
          results.push({ subscription_id: sub.id, skipped: true, reason: 'autopay_disabled' });
          continue;
        }

        const order = await razorpayRequest<Record<string, string>>(creds, '/orders', {
          method: 'POST',
          body: JSON.stringify({
            amount: pricing.totalPaise,
            currency: 'INR',
            payment_capture: 1,
            notes: {
              restaurant_id: sub.restaurant_id,
              subscription_id: sub.id,
              checkout_type: 'recurring_charge',
              plan_key: sub.plan_name,
              billing_cycle: sub.billing_cycle,
            },
          }),
        });

        await adminClient
          .from('subscription_payment_orders')
          .insert([
            {
              restaurant_id: sub.restaurant_id,
              subscription_id: sub.id,
              razorpay_order_id: order.id,
              razorpay_customer_id: sub.razorpay_customer_id,
              amount_paise: pricing.amountPaise,
              gst_paise: pricing.gstPaise,
              total_paise: pricing.totalPaise,
              plan_name: sub.plan_name,
              billing_cycle: sub.billing_cycle,
              payment_method: sub.autopay_method || 'card',
              enable_autopay: true,
              checkout_type: 'recurring_charge',
              status: 'pending',
            },
          ]);

        await adminClient
          .from('subscriptions')
          .update({
            pending_renewal_order_id: order.id,
            last_charge_attempt_at: now.toISOString(),
            last_charge_error: null,
          })
          .eq('id', sub.id);

        const recurringPayment = await razorpayRequest<Record<string, unknown>>(
          creds,
          '/payments/create/recurring',
          {
            method: 'POST',
            body: JSON.stringify({
              email: restaurant?.contact_email || 'billing@table-tap.in',
              contact: restaurant?.contact_phone || '9999999999',
              amount: pricing.totalPaise,
              currency: 'INR',
              order_id: order.id,
              customer_id: sub.razorpay_customer_id,
              token: sub.razorpay_token_id,
              recurring: true,
              description: `TableTap ${sub.plan_name} renewal`,
              notes: {
                subscription_id: sub.id,
                restaurant_id: sub.restaurant_id,
              },
            }),
          },
        );

        const paymentId = recurringPayment.razorpay_payment_id as string;
        const paymentStatus = recurringPayment.status as string;

        if (paymentStatus === 'captured' && paymentId) {
          await applySuccessfulSubscriptionPayment(adminClient, {
            restaurantId: sub.restaurant_id,
            subscriptionId: sub.id,
            planKey: sub.plan_name,
            billingCycle: sub.billing_cycle,
            pricing,
            paymentMethod: sub.autopay_method === 'upi' ? 'razorpay_upi' : 'razorpay_card',
            paymentId,
            enableAutopay: true,
            customerId: sub.razorpay_customer_id,
            tokenId: sub.razorpay_token_id,
            isRenewal: true,
            checkoutType: 'recurring_charge',
            orderId: order.id,
          });
          results.push({ subscription_id: sub.id, status: 'captured', payment_id: paymentId });
        } else {
          results.push({
            subscription_id: sub.id,
            status: paymentStatus || 'initiated',
            payment_id: paymentId || null,
          });
        }
      } catch (subError) {
        const message = subError instanceof Error ? subError.message : 'Renewal failed';
        await adminClient
          .from('subscriptions')
          .update({
            last_charge_error: message,
            autopay_status: 'failed',
          })
          .eq('id', sub.id);
        results.push({ subscription_id: sub.id, error: message });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { status: 200, headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Renewal job failed';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});
