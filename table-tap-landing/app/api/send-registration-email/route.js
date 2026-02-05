import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Email service configuration
// You can use Resend, SendGrid, Mailgun, or any other email service
// For now, we'll use Resend as it's simple and has a generous free tier

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Table Tap <noreply@table-tap.in>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tabletap.in';

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
                .from('system_settings')
                .select('value')
                .eq('key', 'email_template_application_received')
                .single();
            if (data?.value) customTemplate = data.value;
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
            </tr>` : '';

            const vars = {
                owner_name: ownerName,
                restaurant_name: restaurantName,
                plan: selectedPlan,
                status_url: statusUrl,
                year: new Date().getFullYear(),
                payment_row: paymentRowHtml
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
                                            Track Application Status
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
                                <a href="mailto:support@tabletap.in" style="color: #2A9D8F;">support@tabletap.in</a>
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

Questions? Contact us at support@tabletap.in

Best regards,
The Table Tap Team
        `;

        // If Resend API key is configured, send email
        if (RESEND_API_KEY) {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: FROM_EMAIL,
                    to: ownerEmail,
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
            console.log('Email service not configured. Would have sent email to:', ownerEmail);
            console.log('Status URL:', statusUrl);
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
