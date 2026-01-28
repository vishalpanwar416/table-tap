
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { messages, systemContext, userQuestion } = await req.json()
        const apiKey = Deno.env.get('OPENAI_API_KEY')

        if (!apiKey) {
            throw new Error('Server configuration error: OpenAI API key missing')
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
