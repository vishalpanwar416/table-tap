
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

// Get allowed origins from environment or use defaults
const getAllowedOrigin = (requestOrigin: string | null): string => {
    const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [
        'https://table-tap-app.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
    ]

    // If request origin matches allowed origins, use it; otherwise use first allowed origin
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        return requestOrigin
    }

    return allowedOrigins[0] // Default to production URL
}

const getCorsHeaders = (requestOrigin: string | null) => ({
    'Access-Control-Allow-Origin': getAllowedOrigin(requestOrigin),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
})

serve(async (req) => {
    const requestOrigin = req.headers.get('Origin')
    const corsHeaders = getCorsHeaders(requestOrigin)

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Verify caller is authenticated
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // 2. Initialize Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { user_id } = await req.json()

        if (!user_id) {
            return new Response(JSON.stringify({ error: 'Missing user_id' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Fetch profile to check if requester is admin
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('profile_role')
            .eq('id', user.id)
            .single()

        // 3. Verify Authorization
        // Allow if user is deleting themselves OR if user is an admin
        const isAdmin = profile?.profile_role === 'admin'
        const isSelf = user.id === user_id

        if (!isAdmin && !isSelf) {
            return new Response(JSON.stringify({ error: 'Forbidden: You can only delete your own account' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }

        if (user_id) {
            // OPTIONAL: Clean up storage (Avatar)
            // We need to fetch the profile first to get the avatar_url
            const { data: targetProfile } = await supabaseAdmin
                .from('profiles')
                .select('avatar_url')
                .eq('id', user_id)
                .single()

            if (targetProfile?.avatar_url) {
                try {
                    const urlParts = targetProfile.avatar_url.split('/')
                    const fileName = urlParts[urlParts.length - 1]
                    // We assume a standard path structure: profile-photos/{userId}/{fileName}
                    // Adjust this based on your actual storage structure!
                    // Based on ProfilePage.jsx: `profile-photos/${user.id}/${fileName}`
                    const filePath = `profile-photos/${user_id}/${fileName}`

                    await supabaseAdmin.storage
                        .from('avatars')
                        .remove([filePath])
                } catch (err) {
                    console.error('Error cleaning up avatar:', err)
                }
            }
        }

        // 4. Delete the user (This usually cascades to profiles if set up, but we clean up auth)
        const { data, error } = await supabaseAdmin.auth.admin.deleteUser(user_id)

        if (error) throw error

        return new Response(JSON.stringify({ data, message: 'User deleted successfully' }), {
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
