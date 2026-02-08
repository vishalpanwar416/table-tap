import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        // Fetch user profile to check role
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('profile_role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return new Response(JSON.stringify({ error: 'Profile not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
            });
        }

        let restaurants = [];

        if (profile.profile_role === 'owner') {
            const { data: staffData, error: staffError } = await supabaseClient
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .eq('connected', true);

            if (staffError) throw staffError;

            if (staffData && staffData.length > 0) {
                const ids = staffData.map(item => item.restaurant_id);
                const { data: rests, error: restsError } = await supabaseClient
                    .from('restaurants')
                    .select('*')
                    .in('id', ids)
                    .eq('is_active', true);

                if (restsError) throw restsError;
                restaurants = rests;
            }
        } else if (profile.profile_role === 'admin') {
            // Admin sees all active restaurants
            const { data: rests, error: restsError } = await supabaseClient
                .from('restaurants')
                .select('*')
                .eq('is_active', true);

            if (restsError) throw restsError;
            restaurants = rests;
        } else {
            // Other roles might only see their assigned restaurant
            const { data: staffData, error: staffError } = await supabaseClient
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .eq('connected', true)
                .limit(1);

            if (staffError) throw staffError;

            if (staffData && staffData.length > 0) {
                const { data: rest, error: restError } = await supabaseClient
                    .from('restaurants')
                    .select('*')
                    .eq('id', staffData[0].restaurant_id)
                    .single();

                if (restError) throw restError;
                if (rest) restaurants = [rest];
            }
        }

        return new Response(JSON.stringify({ restaurants }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
