// Pet Pooja calls this to toggle item in_stock status on our platform.
// We update petpooja_item_mappings and propagate to food_items if mapped.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ code: 400, status: 'failed', message: 'Method not allowed' }), { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ code: 400, status: 'failed', message: 'Invalid JSON' }), { status: 400 });
  }

  const { restID, inStock, type, itemID, appKey, appSecret } = body as {
    restID: string;
    inStock: boolean;
    type: string;
    itemID: string[];
    appKey?: string;
    appSecret?: string;
  };

  if (!restID || inStock === undefined || !itemID || !Array.isArray(itemID)) {
    return new Response(
      JSON.stringify({ code: 400, status: 'failed', message: 'Missing required fields' }),
      { status: 400 }
    );
  }

  const { data: integration } = await supabase
    .from('petpooja_integrations')
    .select('id, app_key, app_secret')
    .eq('petpooja_rest_id', restID)
    .single();

  if (!integration) {
    return new Response(
      JSON.stringify({ code: 400, status: 'failed', message: 'Restaurant not mapped' }),
      { status: 404 }
    );
  }

  if (!appKey || !appSecret || appKey !== integration.app_key || appSecret !== integration.app_secret) {
    return new Response(
      JSON.stringify({ code: 401, status: 'failed', message: 'Unauthorized' }),
      { status: 401 }
    );
  }

  // Update stock in item mappings
  const { error } = await supabase
    .from('petpooja_item_mappings')
    .update({ in_stock: inStock })
    .eq('integration_id', integration.id)
    .in('petpooja_item_id', itemID.map(String));

  if (error) {
    return new Response(
      JSON.stringify({ code: 400, status: 'failed', message: 'Stock status not updated successfully' }),
      { status: 400 }
    );
  }

  // If items are mapped to fooditems, propagate the is_active flag
  if (type === 'item') {
    const { data: mappings } = await supabase
      .from('petpooja_item_mappings')
      .select('food_item_id')
      .eq('integration_id', integration.id)
      .in('petpooja_item_id', itemID.map(String))
      .not('food_item_id', 'is', null);

    const foodItemIds = (mappings || []).map((m) => m.food_item_id).filter(Boolean);
    if (foodItemIds.length > 0) {
      await supabase
        .from('fooditems')
        .update({ is_active: inStock })
        .in('id', foodItemIds);
    }
  }

  return new Response(
    JSON.stringify({ code: 200, status: 'success', message: 'Stock status updated successfully' }),
    { status: 200 }
  );
});
