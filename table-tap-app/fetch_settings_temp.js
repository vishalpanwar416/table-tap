import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSettings() {
  const { data, error } = await supabase.from('system_settings').select('*');
  console.log(JSON.stringify({data, error}, null, 2));
}

checkSettings();
