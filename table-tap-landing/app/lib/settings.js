import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

async function fetchLandingSettingsFromSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) return null;

    const supabase = createClient(supabaseUrl, serviceKey);
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', ['company_details', 'social_links', 'landing_hero', 'system_logo', 'google_maps_key']);

        if (error) throw error;

        return data?.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {}) ?? null;
    } catch {
        return null;
    }
}

/** Cached for 5 minutes so layout render is fast; revalidates in background. */
export async function getLandingSettings() {
    return unstable_cache(
        fetchLandingSettingsFromSupabase,
        ['landing-settings'],
        { revalidate: 300, tags: ['landing-settings'] }
    )();
}
