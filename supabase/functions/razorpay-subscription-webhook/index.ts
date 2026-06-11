import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  getAdminClient,
  getRazorpayCredentials,
  verifyWebhookSignature,
} from '../_shared/razorpay.ts';
import {
  applySuccessfulSubscriptionPayment,
  loadPlanPricing,
} from '../_shared/subscriptionBilling.ts';

serve(async (req) => {
  const headers = { 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const adminClient = await getAdminClient();
    const creds = await getRazorpayCredentials(adminClient);

    const valid = await verifyWebhookSignature(creds, rawBody, signature);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), { status: 401, headers });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event as string;
    const entity = payload.payload?.payment?.entity ?? payload.payload?.['payment']?.entity;

    if (!entity) {
      return new Response(JSON.stringify({ received: true, skipped: 'no_entity' }), { status: 200, headers });
    }

    const paymentId = entity.id as string;
    const orderId = entity.order_id as string;
    const status = entity.status as string;
    const notes = (entity.notes ?? {}) as Record<string, string>;

    if (event === 'payment.failed') {
      const subscriptionId = notes.subscription_id;
      if (subscriptionId) {
        await adminClient
          .from('subscriptions')
          .update({
            autopay_status: 'failed',
            last_charge_error: entity.error_description || 'Payment failed',
            pending_renewal_order_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscriptionId);
      }
      return new Response(JSON.stringify({ received: true }), { status: 200, headers });
    }

    if (event !== 'payment.captured' || status !== 'captured') {
      return new Response(JSON.stringify({ received: true, skipped: event }), { status: 200, headers });
    }

    const restaurantId = notes.restaurant_id;
    const planKey = notes.plan_key;
    const billingCycle = notes.billing_cycle;
    const subscriptionId = notes.subscription_id || null;
    const checkoutType = notes.checkout_type || 'recurring_charge';

    if (!restaurantId || !orderId || !planKey || !billingCycle) {
      return new Response(JSON.stringify({ received: true, skipped: 'not_subscription' }), {
        status: 200,
        headers,
      });
    }

    const { data: checkoutOrder } = await adminClient
      .from('subscription_payment_orders')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();

    if (checkoutOrder?.status === 'completed') {
      return new Response(JSON.stringify({ received: true, already_completed: true }), {
        status: 200,
        headers,
      });
    }

    const pricing = await loadPlanPricing(adminClient, planKey, billingCycle);
    const tokenId = (entity.token_id as string) || null;
    const customerId = (entity.customer_id as string) || checkoutOrder?.razorpay_customer_id || null;
    const enableAutopay =
      checkoutOrder?.enable_autopay ?? (checkoutType === 'recurring_charge' || Boolean(tokenId));

    await applySuccessfulSubscriptionPayment(adminClient, {
      restaurantId,
      subscriptionId: subscriptionId || checkoutOrder?.subscription_id,
      planKey,
      billingCycle,
      pricing,
      paymentMethod: checkoutOrder?.payment_method === 'upi' ? 'razorpay_upi' : 'razorpay_card',
      paymentId,
      enableAutopay: Boolean(enableAutopay),
      customerId,
      tokenId: enableAutopay ? tokenId : null,
      isRenewal: checkoutType !== 'initial',
      checkoutType: (checkoutType as 'initial' | 'renewal' | 'recurring_charge') || 'recurring_charge',
      orderId,
    });

    return new Response(JSON.stringify({ received: true, processed: true }), { status: 200, headers });
  } catch (error) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});
