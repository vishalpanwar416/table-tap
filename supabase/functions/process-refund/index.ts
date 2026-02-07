import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // Require authenticated caller to reduce abuse of this endpoint
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { payment_id, order_id, amount, notes } = await req.json()

    // Validate required fields
    if (!payment_id) {
      return new Response(JSON.stringify({ error: 'payment_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Fetch credentials from DB using Service Role
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: settings, error: configError } = await adminClient
      .from('system_settings')
      .select('value')
      .eq('key', 'razorpay_keys')
      .single()

    if (configError || !settings?.value?.key_id || !settings?.value?.key_secret) {
      console.error('Process refund failed: Missing config', configError);
      throw new Error('Server configuration error: Payment keys missing')
    }

    const keyId = settings.value.key_id
    const keySecret = settings.value.key_secret

    // Build refund request body
    const refundBody: Record<string, unknown> = {}

    // Amount is optional - if not provided, full refund is issued
    if (amount) {
      // Amount should be in paise (smallest currency unit)
      refundBody.amount = Math.round(amount * 100)
    }

    // Add notes if provided
    if (notes) {
      refundBody.notes = notes
    }

    // Set speed to 'normal' for standard refund processing
    refundBody.speed = 'normal'

    // Create Basic Auth header
    const authHeader = 'Basic ' + btoa(`${keyId}:${keySecret}`)

    // Call Razorpay Refund API
    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${payment_id}/refund`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundBody),
      }
    )

    const razorpayData = await razorpayResponse.json()

    if (!razorpayResponse.ok) {
      console.error('Razorpay refund error:', razorpayData)
      return new Response(JSON.stringify({
        success: false,
        error: razorpayData.error?.description || 'Refund failed',
        razorpay_error: razorpayData.error
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: razorpayResponse.status,
      })
    }

    // If order_id is provided, update the order's payment status and store refund details
    if (order_id) {
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          payment_status: 'refunded',
          refund_id: razorpayData.id,
          refund_amount: razorpayData.amount / 100, // Convert paise back to rupees
          refund_status: razorpayData.status,
          refund_timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id)

      if (updateError) {
        console.error('Error updating order with refund details:', updateError)
        // Don't fail the request - refund was successful, just logging failed
      }
    }

    return new Response(JSON.stringify({
      success: true,
      refund: {
        id: razorpayData.id,
        amount: razorpayData.amount / 100, // Convert paise to rupees for response
        status: razorpayData.status,
        payment_id: razorpayData.payment_id,
        created_at: razorpayData.created_at,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Process refund error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
