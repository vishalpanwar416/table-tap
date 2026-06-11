import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { getAdminClient, getRazorpayCredentials, razorpayRequest } from '../_shared/razorpay.ts';
import { requireRestaurantManager } from '../_shared/subscriptionBilling.ts';

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    const { subscription_id: subscriptionId, restaurant_id: restaurantId } = await req.json();
    if (!subscriptionId || !restaurantId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
    }

    await requireRestaurantManager(req, restaurantId);

    const adminClient = await getAdminClient();
    const { data: sub, error: subError } = await adminClient
      .from('subscriptions')
      .select('id, restaurant_id, razorpay_customer_id, razorpay_token_id, plan_name, status')
      .eq('id', subscriptionId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (subError || !sub) {
      return new Response(JSON.stringify({ error: 'Subscription not found' }), { status: 404, headers });
    }

    if (sub.razorpay_customer_id && sub.razorpay_token_id) {
      const creds = await getRazorpayCredentials(adminClient);
      try {
        await razorpayRequest(
          creds,
          `/customers/${sub.razorpay_customer_id}/tokens/${sub.razorpay_token_id}`,
          { method: 'DELETE' },
        );
      } catch (tokenError) {
        console.warn('Razorpay token cancel failed (continuing):', tokenError);
      }
    }

    const { error: updateError } = await adminClient
      .from('subscriptions')
      .update({
        auto_renew: false,
        autopay_status: 'cancelled',
        razorpay_token_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) throw updateError;

    await adminClient.from('subscription_history').insert([
      {
        subscription_id: subscriptionId,
        restaurant_id: restaurantId,
        action: 'renewed',
        old_plan: sub.plan_name,
        new_plan: sub.plan_name,
        old_status: sub.status,
        new_status: sub.status,
        notes: 'Auto-renewal disabled — Razorpay mandate cancelled',
      },
    ]);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cancel autopay failed';
    const status = message === 'Unauthorized' || message === 'NOT_AUTHORIZED' ? 401 : 400;
    return new Response(JSON.stringify({ error: message }), { status, headers });
  }
});
