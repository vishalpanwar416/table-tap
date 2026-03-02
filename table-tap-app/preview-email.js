const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function previewTemplate() {
    const { data: templates } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'email_template_renewal_reminder')
        .single();

    let subject = templates?.value?.subject;
    let html = templates?.value?.html;

    const vars = {
        restaurant_name: "Bella Vista Trattoria",
        plan_name: "Pro Premium",
        days_left: "3",
        expiration_date: "10 Mar 2026"
    };

    for (const [key, val] of Object.entries(vars)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        html = html.replace(regex, val);
    }

    fs.writeFileSync('preview_email.html', html);
    console.log('Saved to preview_email.html');
}

previewTemplate();
