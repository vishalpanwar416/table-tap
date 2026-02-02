// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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
  cc?: string;
  bcc?: string;
}

interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get SMTP credentials from environment
    const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.hostinger.com";
    const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASS = Deno.env.get("SMTP_PASS");
    const SMTP_FROM = Deno.env.get("SMTP_FROM") || SMTP_USER;

    if (!SMTP_USER || !SMTP_PASS) {
      throw new Error("SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.");
    }

    // Parse request body
    const emailData: EmailRequest = await req.json();

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.html) {
      throw new Error("Missing required fields: to, subject, and html are required");
    }

    // Create SMTP client
    const client = new SmtpClient();

    // Connect to Hostinger SMTP (SSL/TLS)
    await client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USER,
      password: SMTP_PASS,
    });

    // Send email
    const result = await client.send({
      from: emailData.from || SMTP_FROM || SMTP_USER,
      to: emailData.to,
      cc: emailData.cc ? [emailData.cc] : undefined,
      bcc: emailData.bcc ? [emailData.bcc] : undefined,
      replyTo: emailData.replyTo,
      subject: emailData.subject,
      content: emailData.text || "Please view this email in an HTML-capable email client.",
      html: emailData.html,
    });

    // Close connection
    await client.close();

    console.log(`Email sent successfully to ${emailData.to}`);

    const response: EmailResponse = {
      success: true,
      message: `Email sent successfully to ${emailData.to}`,
      messageId: result?.toString() || undefined,
    };

    return new Response(JSON.stringify(response), {
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
      status: error instanceof Error && error.message.includes("credentials") ? 503 : 400,
    });
  }
});
