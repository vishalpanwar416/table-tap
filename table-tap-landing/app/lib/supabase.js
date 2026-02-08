import { createClient } from '@supabase/supabase-js';

// Support both Next.js and React App naming conventions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Diagnostics for the browser console
const isMissingCredentials = !supabaseUrl || !supabaseAnonKey;

if (typeof window !== 'undefined') {
    if (isMissingCredentials) {
        console.error('%c⚠️ SUPABASE CONFIGURATION ERROR:', 'color: white; background: red; padding: 4px; font-weight: bold;');
        console.error('Missing: ', {
            URL: !supabaseUrl,
            KEY: !supabaseAnonKey
        });
        console.warn('Action Required: Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Environment Variables.');
    } else {
        console.log('%c✅ Supabase Connected:', 'color: #2A9D8F; font-weight: bold;', supabaseUrl);
    }
}

// createClient requires a valid URL. If missing, we use a string that won't resolve but won't crash the JS engine.
export const supabase = createClient(
    supabaseUrl || 'https://missing-supabase-url.invalid',
    supabaseAnonKey || 'missing-anon-key'
);
