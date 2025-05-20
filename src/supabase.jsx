import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vogixryubhpqziivspks.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZ2l4cnl1YmhwcXppaXZzcGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjQ4MzcsImV4cCI6MjA2MzAwMDgzN30.2DgVU72hL7AgQNK6vuhma6qiINRUt9ZwTYr3zOJ4WfA";
//const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsYXRjcmZmbmpja3h2ZmlvcXpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTY5Njc3MywiZXhwIjoyMDYxMjcyNzczfQ.5e4-_0BJKQLyLlwNb1LN-k6TIdoMYTVR64EBdwxakY8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
//export const supabaseStorage = createClient(supabaseUrl, supabaseServiceRoleKey);
