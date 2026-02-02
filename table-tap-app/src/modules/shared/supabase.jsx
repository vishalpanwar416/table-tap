/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing! Check your .env file or Vercel project settings.');
  console.log('URL present:', !!supabaseUrl);
  console.log('Key present:', !!supabaseAnonKey);
}

// Use fallback values if env vars are missing to prevent app crash
// This allows the app to load and show proper error messages instead of a blank screen
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder';

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
            // 1. Try to get from Cookie (Cross-subdomain)
            const name = key + "=";
            const decodedCookie = decodeURIComponent(document.cookie);
            const ca = decodedCookie.split(';');
            for (let i = 0; i < ca.length; i++) {
              let c = ca[i];
              while (c.charAt(0) === ' ') {
                c = c.substring(1);
              }
              if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
              }
            }
            // 2. Fallback to localStorage (Dev / Migration)
            return localStorage.getItem(key);
          } catch (error) {
            console.warn('Failed to get session:', error);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            const hostname = window.location.hostname;
            const isProd = hostname.endsWith('table-tap.in');

            if (isProd) {
              // Set cross-subdomain cookie
              // Note: Domains must start with dot for wildcard support in some browsers, 
              // but modern spec says just 'table-tap.in' works for subdomains. 
              // Using .table-tap.in for broadest compatibility.
              const domain = 'table-tap.in';
              const maxAge = 60 * 60 * 24 * 365; // 1 year
              document.cookie = `${key}=${value}; domain=.${domain}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
            } else {
              // Dev / Preview: use localStorage
              localStorage.setItem(key, value);
            }
          } catch (error) {
            console.warn('Failed to set session:', error);
          }
        },
        removeItem: (key) => {
          try {
            const hostname = window.location.hostname;
            const isProd = hostname.endsWith('table-tap.in');

            if (isProd) {
              const domain = 'table-tap.in';
              document.cookie = `${key}=; domain=.${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
            } else {
              localStorage.removeItem(key);
            }
          } catch (error) {
            console.warn('Failed to remove session:', error);
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
