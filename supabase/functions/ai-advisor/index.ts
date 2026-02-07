
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
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
})

serve(async (req) => {
    const requestOrigin = req.headers.get("Origin")
    const corsHeaders = getCorsHeaders(requestOrigin)

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Require authenticated caller so the function can't be abused publicly.
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

        const { messages, systemContext, userQuestion } = await req.json()
        // Initialize admin client to fetch secure settings
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Fetch OpenAI key from system_settings
        const { data: settings, error: configError } = await adminClient
            .from('system_settings')
            .select('value')
            .eq('key', 'openai_keys')
            .single()

        const apiKey = settings?.value?.api_key

        if (configError || !apiKey) {
            console.error('AI Advisor failed: Missing OpenAI config', configError);
            throw new Error('Server configuration error: OpenAI API key missing. Please configure it in System Settings.')
        }

        // Prepare messages for OpenAI
        // We expect the client to pass the history, and we construct the final payload here
        // or the client passes the full array.
        // Based on the previous code, the client constructs history.
        // Let's perform the construction here to be consistent with the inputs.

        const finalMessages = [
            { role: 'system', content: systemContext },
            ...(messages || []),
            { role: 'user', content: userQuestion }
        ]

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: finalMessages,
                max_tokens: 1200,
                temperature: 0.7
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`)
        }

        const data = await response.json()
        const aiResponse = data.choices[0].message.content

        return new Response(JSON.stringify({ textResponse: aiResponse }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
