
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { order_id, payment_id, signature } = await req.json()
        const secret = Deno.env.get('RAZORPAY_KEY_SECRET')

        if (!secret) {
            throw new Error('Server configuration error: Razorpay secret missing')
        }

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
