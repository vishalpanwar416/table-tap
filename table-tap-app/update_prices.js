import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updatePlan() {
  const { data, error } = await supabase
    .from('subscription_plans')
    .update({ base_price: 2999, description: 'Bespoke solutions for restaurant chains.', features: [
        "Multi-Location Sync",
        "Custom WhatsApp Bundles",
        "Dedicated DB isolation",
        "Custom AI & ERP integrations",
        "SSO & Audit trails",
        "Dedicated CSM",
        "Starting ₹2,999 - ₹5,999/mo",
        "Full migration & onboarding support"
    ]})
    .eq('key', 'enterprise');
  
  if (error) {
    console.error('Update Error:', error);
  } else {
    console.log('Update Success:', data);
  }
}

updatePlan();
