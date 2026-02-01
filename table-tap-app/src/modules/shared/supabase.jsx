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

// Custom storage that handles errors gracefully
const customStorage = {
  getItem: (key) => {
    try {
      const value = localStorage.getItem(key);
      return value;
    } catch (error) {
      console.warn('Failed to get item from localStorage:', key, error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to set item in localStorage:', key, error);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove item from localStorage:', key, error);
    }
  }
};

export const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: customStorage
    },
    // Add this realtime configuration
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
