import { createClient } from '@supabase/supabase-js';

// Support both Next.js and React App naming conventions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

// Use fallback values to prevent build crashes if env vars are missing
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials missing during build! Using placeholder values.');
    console.warn('Please check your Vercel Project Settings for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
    supabaseUrl || defaultUrl,
    supabaseAnonKey || defaultKey
);
