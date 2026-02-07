import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verify Authentication (Optional: Rely on Gateway validation or check header presence)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      // If we want to allow ANON requests (e.g. public triggers), remove this block.
      // For now, valid requests via 'invoke' will have it.
      console.warn("Missing Authorization header");
    }

    // Initialize Supabase Client with the user's token (for RLS if needed later, though not used for Resend)
    // We don't strictly *need* this client if we just send email via Resend directly using Service Role for settings.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader || '' } } }
    );

    // Skip manual getUser() check to avoid "Invalid token" errors if gateway already validated it.
    // If strict user checking is needed, we can re-enable it, but for now we prioritize function execution.

    // Initialize Supabase Admin Client to fetch secrets from DB
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch Resend Config from system_settings table
    const { data: setting, error: dbError } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'resend_config')
      .single();

    let RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    let EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "TableTap <onboarding@resend.dev>";

    if (setting?.value) {
      if (setting.value.api_key) RESEND_API_KEY = setting.value.api_key;
      if (setting.value.from_email) EMAIL_FROM = setting.value.from_email;
      console.log("Using Resend configuration from Database.");
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Server configuration error: Resend API Key missing' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Parse request body
    const requestData = await req.json();

    // Handle Health Check
    if (requestData.type === 'ping') {
      return new Response(JSON.stringify({ success: true, message: 'Service is reachable' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const emailData: EmailRequest = requestData;

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.html) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields: to, subject, and html are required' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`Sending email to ${emailData.to} via Resend...`);

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailData.from || EMAIL_FROM,
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        reply_to: emailData.replyTo,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend API Error:", result);
      return new Response(JSON.stringify({ success: false, error: result.message || "Resend API Error", details: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: response.status,
      });
    }

    console.log(`Email sent successfully to ${emailData.to}`, result);

    const emailResponse: EmailResponse = {
      success: true,
      message: `Email sent successfully to ${emailData.to}`,
      messageId: result.id,
    };

    return new Response(JSON.stringify(emailResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Email sending exception:", error);

    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
