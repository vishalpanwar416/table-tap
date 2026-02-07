import { createClient } from '@supabase/supabase-js';

export async function getLandingSettings() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        if (!supabaseUrl) console.warn('Missing NEXT_PUBLIC_SUPABASE_URL for server-side settings fetch');
        if (!serviceKey) console.warn('Missing SUPABASE_SERVICE_ROLE_KEY for server-side settings fetch');
        return null;
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', ['company_details', 'social_links', 'landing_hero', 'system_logo']);

        if (error) throw error;

        return data.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    } catch (err) {
        console.error('Error fetching settings with service role:', err);
        return null;
    }
}
