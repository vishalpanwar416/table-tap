import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

export type RazorpayCredentials = {
  key_id: string;
  key_secret: string;
  webhook_secret?: string;
};

export async function getAdminClient(): Promise<SupabaseClient> {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

export async function getRazorpayCredentials(
  adminClient?: SupabaseClient,
): Promise<RazorpayCredentials> {
  const client = adminClient ?? (await getAdminClient());
  const { data: settings, error } = await client
    .from('system_settings')
    .select('value')
    .eq('key', 'razorpay_keys')
    .single();

  if (error || !settings?.value?.key_id || !settings?.value?.key_secret) {
    throw new Error('Server configuration error: Razorpay keys missing');
  }

  return {
    key_id: settings.value.key_id,
    key_secret: settings.value.key_secret,
    webhook_secret:
      Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || settings.value.webhook_secret || settings.value.key_secret,
  };
}

export async function razorpayRequest<T = Record<string, unknown>>(
  creds: RazorpayCredentials,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const auth = btoa(`${creds.key_id}:${creds.key_secret}`);
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.description || data?.error?.reason || 'Razorpay API error';
    throw new Error(message);
  }
  return data as T;
}

export async function verifyPaymentSignature(
  creds: RazorpayCredentials,
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(creds.key_secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${orderId}|${paymentId}`),
  );
  const generated = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return generated === signature;
}

export async function verifyWebhookSignature(
  creds: RazorpayCredentials,
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(creds.webhook_secret || creds.key_secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const generated = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return generated === signature;
}

export function razorpayFrequency(billingCycle: string): string {
  if (billingCycle === 'yearly') return 'yearly';
  if (billingCycle === 'quarterly') return 'quarterly';
  return 'monthly';
}
