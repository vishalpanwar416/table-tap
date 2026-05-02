// Pet Pooja calls this after the restaurant accepts/rejects/dispatches an order.
// We update the order status in Table-Tap accordingly.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Pet Pooja status codes -> Table-Tap order status
// DB constraint: pending | preparing | ready | completed | rejected
const PP_STATUS_MAP: Record<string, string> = {
  '-1': 'rejected',
  '1': 'preparing',
  '2': 'preparing',
  '3': 'preparing',
  '4': 'preparing',
  '5': 'ready',
  '10': 'completed',
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Invalid JSON' }), { status: 400 });
  }

  const { restID, orderID, status, cancel_reason, appKey, appSecret } = body as {
    restID: string;
    orderID: string;
    status: string;
    cancel_reason?: string;
    appKey?: string;
    appSecret?: string;
  };

  if (!restID || !orderID || !status) {
    return new Response(JSON.stringify({ success: false, message: 'Missing required fields' }), { status: 400 });
  }

  // Find integration and verify credentials in one query
  const { data: integration } = await supabase
    .from('petpooja_integrations')
    .select('id, app_key, app_secret')
    .eq('petpooja_rest_id', restID)
    .single();

  if (!integration) {
    return new Response(JSON.stringify({ success: false, message: 'Restaurant not mapped' }), { status: 404 });
  }

  if (!appKey || !appSecret || appKey !== integration.app_key || appSecret !== integration.app_secret) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
  }

  const tabletapStatus = PP_STATUS_MAP[status] || 'unknown';

  // Update our order by matching the client order ID stored in petpooja_order_logs
  const { data: log } = await supabase
    .from('petpooja_order_logs')
    .select('order_id')
    .eq('integration_id', integration.id)
    .eq('petpooja_order_id', orderID)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (log?.order_id) {
    const updatePayload: Record<string, unknown> = { status: tabletapStatus };
    if (cancel_reason) updatePayload.cancel_reason = cancel_reason;

    await supabase.from('orders').update(updatePayload).eq('id', log.order_id);
  }

  // Log the callback
  await supabase.from('petpooja_order_logs').insert({
    integration_id: integration.id,
    order_id: log?.order_id || null,
    petpooja_order_id: orderID,
    direction: 'callback',
    status: 'success',
    request_payload: body,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
