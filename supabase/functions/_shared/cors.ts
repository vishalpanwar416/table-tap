const ALLOWED_ORIGINS = new Set([
  'https://table-tap.in',
  'https://app.table-tap.in',
  'https://restaurant.table-tap.in',
  'https://admin.table-tap.in',
  'https://owner.table-tap.in',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
]);

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://table-tap.in';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function handleCors(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(request) });
  }
  return null;
}
