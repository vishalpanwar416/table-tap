import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Check your .env file.');
  console.log('URL present:', !!supabaseUrl);
  console.log('Key present:', !!supabaseAnonKey);
}

// Use fallback values if env vars are missing to prevent app crash
// This allows the app to load and show proper error messages instead of a blank screen
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Check your .env file or Vercel project settings.');
}

export const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Note: Storing tokens in localStorage is convenient but less secure than HttpOnly cookies.
      // For high-security applications, consider moving to server-side auth or HttpOnly cookies to prevent XSS.
      storage: {
        getItem: (key) => {
          try {
            return localStorage.getItem(key);
          } catch (error) {
            console.warn('Failed to get item from localStorage:', error);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, value);
          } catch (error) {
            console.warn('Failed to set item in localStorage:', error);
          }
        },
        removeItem: (key) => {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.warn('Failed to remove item from localStorage:', error);
          }
        }
      }
    },
    // Add this realtime configuration
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
