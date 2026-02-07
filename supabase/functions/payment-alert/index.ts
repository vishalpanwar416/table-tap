import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
    type: string;
    data: any;
    urgency?: string;
    customerEmail?: string;
    customerName?: string;
    restaurantName?: string;
    paymentId?: string;
    amount?: number;
    tableNumber?: string;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        // Fallback to a default sender if not set, though RESEND_API_KEY is critical
        const EMAIL_FROM = "TableTap Support <support@tabletap.in>"; // Update this to your verified sender

        if (!RESEND_API_KEY) {
            console.warn("RESEND_API_KEY is missing. Emails will not be sent.");
        }

        const payload: AlertRequest = await req.json();
        console.log("Received payment alert:", payload);

        // 1. Log the alert to Supabase (optional, but good for debugging)
        // We'll just rely on the console logs for now which show up in Supabase Dashboard

        // 2. Send Email Notification to Customer
        if (RESEND_API_KEY && payload.customerEmail) {
            console.log(`Sending failure notification to ${payload.customerEmail}...`);

            const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #e53e3e;">Payment Received, Order Pending</h2>
          <p>Hi ${payload.customerName || 'Customer'},</p>
          <p>We successfully received your payment of <strong>₹${payload.amount}</strong>.</p>
          <p>However, there was a slight technical glitch in creating your order tickets at <strong>${payload.restaurantName || 'the restaurant'}</strong>.</p>
          
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Payment ID:</strong> ${payload.paymentId}</p>
            <p style="margin: 5px 0;"><strong>Table:</strong> ${payload.tableNumber || 'N/A'}</p>
          </div>

          <p><strong>Don't worry, your money is safe.</strong></p>
          <p>Please show this email to the restaurant staff, or use the "Retry Order" button on your screen.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #718096;">Payment ID: ${payload.paymentId}</p>
        </div>
      `;

            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: EMAIL_FROM,
                    to: [payload.customerEmail],
                    subject: `Action Required: Order Issue at ${payload.restaurantName || 'TableTap'}`,
                    html: emailHtml,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Failed to send email via Resend:", errorData);
                // We don't throw here to ensure we still return a 200 OK for the alert logging itself
            } else {
                console.log("Email sent successfully.");
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Payment alert handler failed:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
