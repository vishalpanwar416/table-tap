import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import siteConfig from '../../data/site-config.json';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || siteConfig.contact.fromEmail;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || siteConfig.site.baseUrl;

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            ownerName,
            ownerEmail,
            restaurantName,
            selectedPlan,
            paymentId
        } = body;

        if (!ownerEmail || !restaurantName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 1. Security: Origin Check
        const origin = request.headers.get('origin');
        const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || siteConfig.site.baseUrl;
        // Allow localhost for dev
        const isLocalhost = origin?.includes('localhost');

        if (origin && !origin.includes(allowedOrigin) && !isLocalhost) {
            console.error(`Blocked request from unauthorized origin: ${origin}`);
            return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403 });
        }

        // 2. Security: Verify Registration Exists in DB
        // This prevents the API from being used as an open mail relay
        try {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );

            const { data: registration } = await supabaseAdmin
                .from('restaurant_registrations')
                .select('id, created_at')
                .eq('owner_email', ownerEmail)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!registration) {
                console.error(`Security blocked: No registration found for ${ownerEmail}`);
                return NextResponse.json({ error: 'Invalid request: No registration found' }, { status: 403 });
            }

            // Check if registration is recent (e.g. within last 15 minutes)
            const created = new Date(registration.created_at);
            const now = new Date();
            const diffMinutes = (now - created) / 1000 / 60;

            if (diffMinutes > 15) {
                console.error(`Security blocked: Registration too old (${diffMinutes}m) for ${ownerEmail}`);
                return NextResponse.json({ error: 'Request expired' }, { status: 403 });
            }
        } catch (dbError) {
            console.error('Database verification failed:', dbError);
            // Fail open or closed? Closed is safer.
            return NextResponse.json({ error: 'Security verification failed' }, { status: 500 });
        }

        // Status tracking URL
        const statusUrl = `${APP_URL}/application-status?email=${encodeURIComponent(ownerEmail)}`;

        // Fetch custom template
        let customTemplate = null;
        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );
            const { data } = await supabase
                .from('email_templates')
                .select('subject, html')
                .eq('key', 'email_template_application_received')
                .maybeSingle();
            if (data) customTemplate = data;
        } catch (e) {
            console.error('Failed to fetch template:', e);
        }

        let emailHtml;
        let subject = `Application Received - ${restaurantName} | Table Tap`;

        if (customTemplate) {
            subject = customTemplate.subject;
            emailHtml = customTemplate.html;

            const paymentRowHtml = paymentId ? `
            <tr>
                <td style="padding: 8px 0; color: #777; font-size: 14px;">Payment:</td>
                <td style="padding: 8px 0; font-size: 14px; text-align: right;">
                    <span style="background-color: #D1FAE5; color: #065F46; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 12px;">
                        ✓ Paid
                    </span>
                </td>
            </tr>` : `
            <tr>
                <td style="padding: 8px 0; color: #777; font-size: 14px;">Payment:</td>
                <td style="padding: 8px 0; font-size: 14px; text-align: right;">
                    <span style="background-color: #EEF2FF; color: #4338CA; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 12px;">
                        Due
                    </span>
                </td>
            </tr>`;

            const ctaText = paymentId ? 'Track Application Status' : 'Complete Payment & Track Status';

            const vars = {
                owner_name: ownerName,
                restaurant_name: restaurantName,
                plan: selectedPlan,
                status_url: statusUrl,
                year: new Date().getFullYear(),
                payment_row: paymentRowHtml,
                cta_text: ctaText
            };

            Object.keys(vars).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                subject = subject.replace(regex, vars[key] || '');
                emailHtml = emailHtml.replace(regex, vars[key] || '');
            });
        } else {
            // Fallback
            emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Received - Table Tap</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2A9D8F 0%, #238b7e 100%); padding: 40px 40px 30px;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">
                                🎉 Application Received!
                            </h1>
                            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                                Thank you for choosing Table Tap
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                                Hi <strong>${ownerName}</strong>,
                            </p>
                            <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
                                We've received your registration application for <strong style="color: #2A9D8F;">${restaurantName}</strong>. Our team will review your application and get back to you within <strong>24-48 hours</strong>.
                            </p>
                            
                            <!-- Application Summary -->
                            <table role="presentation" style="width: 100%; background-color: #f8fafa; border-radius: 12px; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 16px; color: #333; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                                            Application Summary
                                        </h3>
                                        <table role="presentation" style="width: 100%;">
                                            <tr>
                                                <td style="padding: 8px 0; color: #777; font-size: 14px;">Restaurant:</td>
                                                <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600; text-align: right;">${restaurantName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #777; font-size: 14px;">Plan:</td>
                                                <td style="padding: 8px 0; color: #2A9D8F; font-size: 14px; font-weight: 600; text-align: right; text-transform: capitalize;">${selectedPlan}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #777; font-size: 14px;">Status:</td>
                                                <td style="padding: 8px 0; font-size: 14px; text-align: right;">
                                                    <span style="background-color: #FEF3C7; color: #92400E; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 12px;">
                                                        Pending Review
                                                    </span>
                                                </td>
                                            </tr>
                                            ${paymentId ? `
                                            <tr>
                                                <td style="padding: 8px 0; color: #777; font-size: 14px;">Payment:</td>
                                                <td style="padding: 8px 0; font-size: 14px; text-align: right;">
                                                    <span style="background-color: #D1FAE5; color: #065F46; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 12px;">
                                                        ✓ Paid
                                                    </span>
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${statusUrl}" style="display: inline-block; background: linear-gradient(135deg, #2A9D8F 0%, #238b7e 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px;">
                                            ${paymentId ? 'Track Application Status' : 'Complete Payment & Track Status'}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0; color: #777; font-size: 14px; line-height: 1.6;">
                                You can also track your application status anytime by visiting:
                                <br>
                                <a href="${statusUrl}" style="color: #2A9D8F; word-break: break-all;">${statusUrl}</a>
                            </p>
                            
                            <!-- What's Next -->
                            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee;">
                                <h3 style="margin: 0 0 16px; color: #333; font-size: 16px; font-weight: 700;">
                                    What happens next?
                                </h3>
                                <ol style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
                                    <li>Our team reviews your application</li>
                                    <li>We verify your restaurant details</li>
                                    <li>You receive approval notification via email</li>
                                    <li>Get your dashboard access credentials</li>
                                    <li>Start managing your restaurant digitally! 🚀</li>
                                </ol>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 30px 40px; text-align: center;">
                            <p style="margin: 0 0 10px; color: #999; font-size: 13px;">
                                Questions? Contact us at 
                                <a href="mailto:${siteConfig.contact.supportEmail}" style="color: #2A9D8F;">${siteConfig.contact.supportEmail}</a>
                            </p>
                            <p style="margin: 0; color: #bbb; font-size: 12px;">
                                © ${new Date().getFullYear()} Table Tap. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
        }

        // Plain text version
        const emailText = `
Hi ${ownerName},

Thank you for registering ${restaurantName} with Table Tap!

We've received your application and our team will review it within 24-48 hours.

Application Summary:
- Restaurant: ${restaurantName}
- Plan: ${selectedPlan}
- Status: Pending Review
${paymentId ? `- Payment: Paid (ID: ${paymentId})` : ''}

Track your application status: ${statusUrl}

What happens next?
1. Our team reviews your application
2. We verify your restaurant details
3. You receive approval notification via email
4. Get your dashboard access credentials
5. Start managing your restaurant digitally!

Questions? Contact us at ${siteConfig.contact.supportEmail}

Best regards,
The Table Tap Team
        `;

        // Initialize Admin Client for fetching sensitive config
        const supabaseAdminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // Fetch Resend Config from DB
        let dbResendKey = null;
        let dbFromEmail = null;
        try {
            const { data: resendConfig } = await supabaseAdminClient
                .from('system_settings')
                .select('value')
                .eq('key', 'resend_config')
                .single();

            if (resendConfig?.value?.api_key) {
                dbResendKey = resendConfig.value.api_key;
                dbFromEmail = resendConfig.value.from_email;
            }
        } catch (e) {
            console.error('Failed to fetch Resend config:', e);
        }

        const FINAL_API_KEY = dbResendKey || process.env.RESEND_API_KEY;
        const FINAL_FROM_EMAIL = dbFromEmail || process.env.FROM_EMAIL || siteConfig.contact.fromEmail;

        // If Resend API key is configured, send email
        if (FINAL_API_KEY) {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${FINAL_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: FINAL_FROM_EMAIL,
                    to: ownerEmail,
                    subject: subject,
                    html: emailHtml,
                    text: emailText,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Email send error:', errorData);
                // Don't fail the registration, just log the error
                return NextResponse.json({
                    success: true,
                    emailSent: false,
                    message: 'Registration successful but email failed to send'
                });
            }

            const data = await response.json();
            return NextResponse.json({
                success: true,
                emailSent: true,
                emailId: data.id
            });
        } else {
            // No email service configured, just return success
            console.log('Email service not configured (Missing Key). Would have sent email to:', ownerEmail);
            return NextResponse.json({
                success: true,
                emailSent: false,
                message: 'Email service not configured'
            });
        }
    } catch (error) {
        console.error('Send email error:', error);
        return NextResponse.json(
            { error: 'Failed to send email', details: error.message },
            { status: 500 }
        );
    }
}
