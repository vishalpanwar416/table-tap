// Pet Pooja calls this endpoint whenever the restaurant's menu changes.
// We store the sync timestamp and upsert item mappings so stock updates work.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Invalid JSON' }), { status: 400 });
  }

  const restaurants = body.restaurants as Array<{ restID: string; items?: Array<{ itemid: string; item_name?: string }> }>;
  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    return new Response(JSON.stringify({ success: false, message: 'Missing restaurants array' }), { status: 400 });
  }

  const restID = restaurants[0]?.restID as string;
  if (!restID) {
    return new Response(JSON.stringify({ success: false, message: 'Missing restID' }), { status: 400 });
  }

  // Find the integration and verify credentials in one query
  const { data: integration, error: intErr } = await supabase
    .from('petpooja_integrations')
    .select('id, app_key, app_secret')
    .eq('petpooja_rest_id', restID)
    .single();

  if (intErr || !integration) {
    return new Response(JSON.stringify({ success: false, message: 'Restaurant not mapped' }), { status: 404 });
  }

  const appKey = body.appKey as string | undefined;
  const appSecret = body.appSecret as string | undefined;
  if (!appKey || !appSecret || appKey !== integration.app_key || appSecret !== integration.app_secret) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
  }

  // Update last sync timestamp
  await supabase
    .from('petpooja_integrations')
    .update({ last_menu_sync_at: new Date().toISOString(), status: 'active', last_error: null })
    .eq('id', integration.id);

  // Upsert item mappings from the pushed menu
  const items = restaurants[0]?.items;
  if (Array.isArray(items) && items.length > 0) {
    const mappings = items.map((item) => ({
      integration_id: integration.id,
      petpooja_item_id: String(item.itemid),
      item_name: item.item_name || String(item.itemid),
      in_stock: true,
    }));

    await supabase
      .from('petpooja_item_mappings')
      .upsert(mappings, { onConflict: 'integration_id,petpooja_item_id', ignoreDuplicates: false });
  }

  return new Response(JSON.stringify({ success: true, message: 'Menu received' }), { status: 200 });
});
