import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  to: string;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
  message?: string;
  type?: 'template' | 'text';
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
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
      throw new Error('Unauthorized: You must be logged in to send WhatsApp messages.');
    }

    const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      throw new Error("WhatsApp credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Supabase secrets.");
    }

    const requestData: WhatsAppRequest = await req.json();

    if (!requestData.to) {
      throw new Error("Missing required field: 'to' (phone number)");
    }

    // Clean phone number - ensure it has country code
    let phoneNumber = requestData.to.replace(/[\s\-\+\(\)]/g, '');
    if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
      phoneNumber = '91' + phoneNumber; // Default to India
    }

    let messagePayload: any;

    if (requestData.type === 'template' && requestData.templateName) {
      // Template message (for marketing, notifications outside 24hr window)
      messagePayload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: requestData.templateName,
          language: {
            code: requestData.templateLanguage || "en"
          },
          components: requestData.templateComponents || []
        }
      };
    } else {
      // Text message (within 24hr service window or free entry point)
      if (!requestData.message) {
        throw new Error("Missing required field: 'message' for text type");
      }

      messagePayload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: {
          preview_url: false,
          body: requestData.message
        }
      };
    }

    console.log(`Sending WhatsApp message to ${phoneNumber}`);

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", result);
      throw new Error(result.error?.message || "Failed to send WhatsApp message");
    }

    console.log(`WhatsApp message sent successfully:`, result);

    const whatsappResponse: WhatsAppResponse = {
      success: true,
      messageId: result.messages?.[0]?.id,
    };

    return new Response(JSON.stringify(whatsappResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("WhatsApp sending failed:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const response: WhatsAppResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
