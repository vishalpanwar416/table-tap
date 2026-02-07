
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

// Tighten CORS and allow dev/prod via env
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
        "authorization, x-client-info, apikey, content-type",
})

serve(async (req) => {
    const requestOrigin = req.headers.get("Origin")
    const corsHeaders = getCorsHeaders(requestOrigin)

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { order_id, payment_id, signature } = await req.json()

        // Fetch secret from DB using Service Role
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: settings, error: configError } = await adminClient
            .from('system_settings')
            .select('value')
            .eq('key', 'razorpay_keys')
            .single()

        if (configError || !settings?.value?.key_secret) {
            console.error('Payment verification failed: Missing config', configError);
            throw new Error('Server configuration error: Payment keys missing')
        }

        const secret = settings.value.key_secret

        // 1. Generate signature
        const text = `${order_id}|${payment_id}`
        const encoder = new TextEncoder()
        const keyData = encoder.encode(secret)
        const data = encoder.encode(text)

        const key = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        )

        const signatureBuffer = await crypto.subtle.sign(
            "HMAC",
            key,
            data
        )

        // Convert buffer to hex string
        const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')

        // 2. Compare signatures
        if (generatedSignature === signature) {
            return new Response(JSON.stringify({ verified: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        } else {
            return new Response(JSON.stringify({ verified: false, error: 'Signature mismatch' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
