
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Calculate date 7 days ago
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        // ISO string format for comparison
        const cutoffDate = sevenDaysAgo.toISOString()

        // Delete notifications that are marked as read AND updated more than 7 days ago
        // We assume 'updated_at' is updated when 'read' becomes true.
        const { count, error } = await supabaseClient
            .from('notifications')
            .delete({ count: 'exact' })
            .eq('read', true)
            .lt('updated_at', cutoffDate)

        if (error) throw error

        return new Response(
            JSON.stringify({
                message: `Deleted ${count} read notifications older than 7 days`,
                count,
                cutoffDate
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
