// Handles both Get Store Status (GET) and Update Store Status (POST).
// Pet Pooja calls GET to check if the store is open, POST to open/close it.
// GET auth: appKey via query param. POST auth: appKey+appSecret in body.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const url = new URL(req.url);
  const restID = url.searchParams.get('restID') || '';

  if (req.method === 'GET') {
    if (!restID) {
      return new Response(
        JSON.stringify({ status: 'failed', http_code: '400', message: 'restID is required' }),
        { status: 400 }
      );
    }

    const appKey = url.searchParams.get('appKey') || '';

    const { data: integration } = await supabase
      .from('petpooja_integrations')
      .select('store_open, status, app_key')
      .eq('petpooja_rest_id', restID)
      .single();

    if (!integration) {
      return new Response(
        JSON.stringify({ status: 'failed', http_code: '404', message: 'Restaurant not mapped' }),
        { status: 404 }
      );
    }

    if (!appKey || appKey !== integration.app_key) {
      return new Response(
        JSON.stringify({ status: 'failed', http_code: '401', message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        store_status: integration.store_open ? '1' : '0',
        http_code: '200',
        message: integration.store_open ? 'Store is open' : 'Store is closed',
      }),
      { status: 200 }
    );
  }

  if (req.method === 'POST') {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ status: 'failed', http_code: '400', message: 'Invalid JSON' }),
        { status: 400 }
      );
    }

    const { restID: bodyRestID, store_status, appKey, appSecret } = body as {
      restID: string;
      store_status: string;
      appKey?: string;
      appSecret?: string;
    };
    const rid = bodyRestID || restID;

    if (!rid || store_status === undefined) {
      return new Response(
        JSON.stringify({ status: 'failed', http_code: '400', message: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const { data: integration } = await supabase
      .from('petpooja_integrations')
      .select('app_key, app_secret')
      .eq('petpooja_rest_id', rid)
      .single();

    if (!integration) {
      return new Response(
        JSON.stringify({ status: 'failed', http_code: '404', message: 'Restaurant not mapped' }),
        { status: 404 }
      );
    }

    if (!appKey || !appSecret || appKey !== integration.app_key || appSecret !== integration.app_secret) {
      return new Response(
        JSON.stringify({ status: 'failed', http_code: '401', message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const storeOpen = store_status === '1' || store_status === 1;

    const { error } = await supabase
      .from('petpooja_integrations')
      .update({ store_open: storeOpen })
      .eq('petpooja_rest_id', rid);

    if (error) {
      return new Response(
        JSON.stringify({ status: 'failed', http_code: '400', message: 'Failed to update store status' }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        store_status: storeOpen ? '1' : '0',
        http_code: '200',
        message: storeOpen ? 'Store turned on' : 'Store turned off',
      }),
      { status: 200 }
    );
  }

  return new Response('Method not allowed', { status: 405 });
});
