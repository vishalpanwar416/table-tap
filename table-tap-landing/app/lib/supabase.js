import { createClient } from '@supabase/supabase-js';

// Support both Next.js and React App naming conventions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Support for both Next.js and typical React env prefixes.
// If credentials are missing, we use placeholder values to prevent the build worker from crashing.
const isMissingCredentials = !supabaseUrl || !supabaseAnonKey;

if (isMissingCredentials) {
    console.warn('⚠️ SUPABASE ERROR: Credentials missing during build! Using placeholders.');
    console.warn('Action required: Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel settings.');
}

// createClient throws if url is an empty string. A valid-ish URL is required to avoid build exit.
console.log('Initializing Supabase client with URL:', supabaseUrl || 'placeholder');
export const supabase = createClient(
    supabaseUrl || 'https://lib-placeholder.supabase.co',
    supabaseAnonKey || 'lib-placeholder-key'
);
