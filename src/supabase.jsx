import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
//const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsYXRjcmZmbmpja3h2ZmlvcXpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTY5Njc3MywiZXhwIjoyMDYxMjcyNzczfQ.5e4-_0BJKQLyLlwNb1LN-k6TIdoMYTVR64EBdwxakY8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
//export const supabaseStorage = createClient(supabaseUrl, supabaseServiceRoleKey);
