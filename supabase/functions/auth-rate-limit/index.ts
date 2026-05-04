import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"
import { withRateLimit, getClientIdentifier } from '../_shared/rateLimiter.ts'

/**
 * auth-rate-limit edge function
 *
 * Acts as a rate-limited proxy for Supabase auth operations (sign-in, sign-up,
 * forgot-password). The client calls this function instead of hitting Supabase
 * auth directly, so brute-force / credential-stuffing is stopped server-side
 * before it ever reaches GoTrue.
 *
 * Request body: { action, email, password?, redirectTo? }
 *   action: "sign_in" | "sign_up" | "forgot_password"
 *
 * Returns the Supabase auth response (session + user on success) or an error.
 */

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

// Stricter limits for auth endpoints — 10 attempts per 15 minutes per IP
const AUTH_RATE_LIMIT = {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'auth',
}

// Even stricter: 5 sign-in attempts per 15 minutes (brute-force guard)
const SIGN_IN_RATE_LIMIT = {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'auth-signin',
}

serve(async (req) => {
    const requestOrigin = req.headers.get("Origin")
    const corsHeaders = getCorsHeaders(requestOrigin)

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const limitConfig = (() => {
        try {
            const body = req.clone().json()
            // We'll check action after parsing
        } catch (_) { /* ignore */ }
        return AUTH_RATE_LIMIT
    })()

    return await withRateLimit(
        req,
        async (req) => {
            try {
                const { action, email, password, redirectTo } = await req.json()

                if (!action || !email) {
                    return new Response(
                        JSON.stringify({ error: 'Missing required fields: action, email' }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                    )
                }

                const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
                const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
                const client = createClient(supabaseUrl, supabaseAnonKey)

                if (action === 'sign_in') {
                    if (!password) {
                        return new Response(
                            JSON.stringify({ error: 'Password required for sign_in' }),
                            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                        )
                    }
                    const { data, error } = await client.auth.signInWithPassword({ email, password })
                    if (error) {
                        return new Response(
                            JSON.stringify({ error: error.message }),
                            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
                        )
                    }
                    return new Response(
                        JSON.stringify({ session: data.session, user: data.user }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                    )
                }

                if (action === 'sign_up') {
                    if (!password) {
                        return new Response(
                            JSON.stringify({ error: 'Password required for sign_up' }),
                            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                        )
                    }
                    const { data, error } = await client.auth.signUp({
                        email,
                        password,
                        options: { emailRedirectTo: redirectTo },
                    })
                    if (error) {
                        return new Response(
                            JSON.stringify({ error: error.message }),
                            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                        )
                    }
                    return new Response(
                        JSON.stringify({ session: data.session, user: data.user }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                    )
                }

                if (action === 'forgot_password') {
                    const { error } = await client.auth.resetPasswordForEmail(email, {
                        redirectTo,
                    })
                    if (error) {
                        return new Response(
                            JSON.stringify({ error: error.message }),
                            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                        )
                    }
                    return new Response(
                        JSON.stringify({ message: 'Password reset email sent' }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                    )
                }

                return new Response(
                    JSON.stringify({ error: `Unknown action: ${action}` }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )

            } catch (error) {
                return new Response(
                    JSON.stringify({ error: error.message }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
                )
            }
        },
        // Use stricter limit for sign-in (brute-force target), general limit for others
        SIGN_IN_RATE_LIMIT,
    )
})
