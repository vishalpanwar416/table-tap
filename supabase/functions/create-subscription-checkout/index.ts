import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import {
  getAdminClient,
  getRazorpayCredentials,
  razorpayRequest,
} from '../_shared/razorpay.ts';
import {
  buildMandateTokenConfig,
  loadPlanPricing,
  requireRestaurantManager,
} from '../_shared/subscriptionBilling.ts';

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    const body = await req.json();
    const {
      restaurant_id: restaurantId,
      plan_key: planKey,
      billing_cycle: billingCycle,
      payment_method: paymentMethod = 'card',
      enable_autopay: enableAutopay = true,
      subscription_id: subscriptionId = null,
    } = body;

    if (!restaurantId || !planKey || !billingCycle) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
    }

    await requireRestaurantManager(req, restaurantId);

    const adminClient = await getAdminClient();
    const creds = await getRazorpayCredentials(adminClient);
    const pricing = await loadPlanPricing(adminClient, planKey, billingCycle);

    const { data: restaurant, error: restaurantError } = await adminClient
      .from('restaurants')
      .select('id, name, contact_email, contact_phone, enable_subscription_autopay')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found' }), { status: 404, headers });
    }

    if (restaurant.enable_subscription_autopay === false && enableAutopay) {
      return new Response(
        JSON.stringify({ error: 'Subscription autopay is disabled for this restaurant' }),
        { status: 403, headers },
      );
    }

    let customerId: string | null = null;
    if (subscriptionId) {
      const { data: existingSub } = await adminClient
        .from('subscriptions')
        .select('razorpay_customer_id')
        .eq('id', subscriptionId)
        .maybeSingle();
      customerId = existingSub?.razorpay_customer_id ?? null;
    }

    if (!customerId) {
      const customer = await razorpayRequest<Record<string, string>>(creds, '/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: restaurant.name,
          email: restaurant.contact_email || undefined,
          contact: restaurant.contact_phone || undefined,
          fail_existing: '0',
          notes: { restaurant_id: restaurantId },
        }),
      });
      customerId = customer.id;
    }

    const orderBody: Record<string, unknown> = {
      amount: pricing.totalPaise,
      currency: 'INR',
      customer_id: customerId,
      payment_capture: 1,
      notes: {
        restaurant_id: restaurantId,
        plan_key: planKey,
        billing_cycle: billingCycle,
        enable_autopay: String(enableAutopay),
        subscription_id: subscriptionId || '',
        checkout_type: subscriptionId ? 'renewal' : 'initial',
      },
    };

    if (enableAutopay) {
      orderBody.method = paymentMethod === 'upi' ? 'upi' : 'card';
      orderBody.token = buildMandateTokenConfig(billingCycle, pricing.totalPaise);
    }

    const order = await razorpayRequest<Record<string, string>>(creds, '/orders', {
      method: 'POST',
      body: JSON.stringify(orderBody),
    });

    const checkoutType = subscriptionId ? 'renewal' : 'initial';
    const { data: checkoutRow, error: checkoutError } = await adminClient
      .from('subscription_payment_orders')
      .insert([
        {
          restaurant_id: restaurantId,
          subscription_id: subscriptionId,
          razorpay_order_id: order.id,
          razorpay_customer_id: customerId,
          amount_paise: pricing.amountPaise,
          gst_paise: pricing.gstPaise,
          total_paise: pricing.totalPaise,
          plan_name: planKey,
          billing_cycle: billingCycle,
          payment_method: paymentMethod,
          enable_autopay: enableAutopay,
          checkout_type: checkoutType,
          status: 'pending',
        },
      ])
      .select('id')
      .single();

    if (checkoutError) throw checkoutError;

    return new Response(
      JSON.stringify({
        key_id: creds.key_id,
        order_id: order.id,
        customer_id: customerId,
        amount: pricing.totalPaise,
        currency: 'INR',
        checkout_id: checkoutRow.id,
        enable_autopay: enableAutopay,
        prefill: {
          name: restaurant.name,
          email: restaurant.contact_email || '',
          contact: restaurant.contact_phone || '',
        },
        description: `${pricing.planName} — ${billingCycle}${enableAutopay ? ' (Autopay)' : ''}`,
      }),
      { status: 200, headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout creation failed';
    const status = message === 'Unauthorized' || message === 'NOT_AUTHORIZED' ? 401 : 400;
    return new Response(JSON.stringify({ error: message }), { status, headers });
  }
});
