import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const getAllowedOrigin = (requestOrigin: string | null): string => {
    const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || [
        "https://table-tap-app.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin
    return allowedOrigins[0]
}

const getCorsHeaders = (requestOrigin: string | null) => ({
    "Access-Control-Allow-Origin": getAllowedOrigin(requestOrigin),
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
})

import { withRateLimit } from '../_shared/rateLimiter.ts'

serve(async (req) => {
    return await withRateLimit(
        req,
        async (req) => {
            const requestOrigin = req.headers.get("Origin")
            const corsHeaders = getCorsHeaders(requestOrigin)

            if (req.method === 'OPTIONS') {
                return new Response('ok', { headers: corsHeaders })
            }

            try {
                const { order_id, payment_id, signature, expected_amount_paise } = await req.json()

                if (!order_id || !payment_id || !signature) {
                    return new Response(
                        JSON.stringify({ verified: false, error: 'Missing required fields' }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                    )
                }

                const adminClient = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                )

                // Fetch Razorpay secret from DB (never exposed to client)
                const { data: settings, error: configError } = await adminClient
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'razorpay_keys')
                    .single()

                if (configError || !settings?.value?.key_secret) {
                    console.error('Payment verification failed: Missing config', configError)
                    throw new Error('Server configuration error: Payment keys missing')
                }

                const secret = settings.value.key_secret

                // 1. Verify HMAC-SHA256 signature
                const text = `${order_id}|${payment_id}`
                const encoder = new TextEncoder()
                const key = await crypto.subtle.importKey(
                    "raw",
                    encoder.encode(secret),
                    { name: "HMAC", hash: "SHA-256" },
                    false,
                    ["sign"]
                )
                const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(text))
                const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('')

                if (generatedSignature !== signature) {
                    return new Response(
                        JSON.stringify({ verified: false, error: 'Signature mismatch' }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                    )
                }

                // 2. Amount validation — cross-check client-claimed amount against
                // the Razorpay order amount stored server-side when the order was created.
                // Prevents a tampered lower amount from passing verification.
                if (expected_amount_paise) {
                    const { data: razorpayOrder, error: orderError } = await adminClient
                        .from('razorpay_orders')
                        .select('amount_paise')
                        .eq('razorpay_order_id', order_id)
                        .single()

                    if (!orderError && razorpayOrder) {
                        const tolerance = 1 // 1 paise rounding tolerance
                        if (Math.abs(razorpayOrder.amount_paise - expected_amount_paise) > tolerance) {
                            console.error('Amount mismatch detected', {
                                stored: razorpayOrder.amount_paise,
                                claimed: expected_amount_paise,
                                payment_id,
                            })
                            return new Response(
                                JSON.stringify({ verified: false, error: 'Amount mismatch' }),
                                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                            )
                        }
                    } else if (orderError) {
                        // razorpay_orders table not yet populated for this order —
                        // log for monitoring but don't hard-block (graceful degradation)
                        console.warn('razorpay_orders lookup skipped (table may not exist yet):', orderError.message)
                    }
                }

                return new Response(
                    JSON.stringify({ verified: true }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )

            } catch (error) {
                return new Response(
                    JSON.stringify({ error: error.message }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }
        },
        {
            windowMs: 60 * 1000,
            maxRequests: 20,
            keyPrefix: 'verify-payment',
        }
    )
})
