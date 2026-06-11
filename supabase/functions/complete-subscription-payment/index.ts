import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import {
  getAdminClient,
  getRazorpayCredentials,
  razorpayRequest,
  verifyPaymentSignature,
} from '../_shared/razorpay.ts';
import {
  applySuccessfulSubscriptionPayment,
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
      order_id: orderId,
      payment_id: paymentId,
      signature,
      subscription_id: subscriptionId = null,
    } = body;

    if (!restaurantId || !orderId || !paymentId || !signature) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
    }

    await requireRestaurantManager(req, restaurantId);

    const adminClient = await getAdminClient();
    const creds = await getRazorpayCredentials(adminClient);

    const valid = await verifyPaymentSignature(creds, orderId, paymentId, signature);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), { status: 400, headers });
    }

    const { data: checkoutOrder, error: checkoutError } = await adminClient
      .from('subscription_payment_orders')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (checkoutError || !checkoutOrder) {
      return new Response(JSON.stringify({ error: 'Checkout session not found' }), { status: 404, headers });
    }

    if (checkoutOrder.status === 'completed') {
      return new Response(JSON.stringify({ success: true, already_completed: true }), { status: 200, headers });
    }

    const payment = await razorpayRequest<Record<string, unknown>>(creds, `/payments/${paymentId}`);
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return new Response(JSON.stringify({ error: 'Payment not completed' }), { status: 400, headers });
    }

    const pricing = await loadPlanPricing(
      adminClient,
      checkoutOrder.plan_name,
      checkoutOrder.billing_cycle,
    );

    const tokenId = (payment.token_id as string) || null;
    const customerId = (payment.customer_id as string) || checkoutOrder.razorpay_customer_id;
    const method = checkoutOrder.payment_method === 'upi' ? 'razorpay_upi' : 'razorpay_card';

    const result = await applySuccessfulSubscriptionPayment(adminClient, {
      restaurantId,
      subscriptionId: subscriptionId || checkoutOrder.subscription_id,
      planKey: checkoutOrder.plan_name,
      billingCycle: checkoutOrder.billing_cycle,
      pricing,
      paymentMethod: method,
      paymentId,
      enableAutopay: checkoutOrder.enable_autopay,
      customerId,
      tokenId: checkoutOrder.enable_autopay ? tokenId : null,
      isRenewal: checkoutOrder.checkout_type === 'renewal',
      checkoutType: checkoutOrder.checkout_type,
      orderId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: result.subscriptionId,
        autopay_active: Boolean(checkoutOrder.enable_autopay && tokenId),
      }),
      { status: 200, headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment completion failed';
    const status = message === 'Unauthorized' || message === 'NOT_AUTHORIZED' ? 401 : 400;
    return new Response(JSON.stringify({ error: message }), { status, headers });
  }
});
