import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    // 1. Verify Authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized: You must be logged in to send emails.');
    }

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
      throw new Error("RESEND_API_KEY not configured. Set it in 'system_settings' table or Supabase secrets.");
    }

    // Parse request body
    const emailData: EmailRequest = await req.json();

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.html) {
      throw new Error("Missing required fields: to, subject, and html are required");
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
      throw new Error(result.message || "Failed to send email via Resend");
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
    console.error("Email sending failed:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    const response: EmailResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
