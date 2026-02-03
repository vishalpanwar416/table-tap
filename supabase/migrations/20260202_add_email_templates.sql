-- Add Email Templates to system_settings

INSERT INTO system_settings (key, value, description, category, is_secret)
VALUES
(
    'email_template_welcome',
    jsonb_build_object(
        'subject', 'Welcome to Table Tap - Your Account is Approved!',
        'variables', '["owner_name", "restaurant_name", "email", "password", "dashboard_link", "year"]',
        'html', '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Welcome to Table Tap</title>
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Table Tap</h1>
        <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Restaurant Management Simplified</p>
    </div>
    <div style="padding: 40px;">
        <h2 style="color: #1f2937; margin-top: 0;">Welcome, {{owner_name}}!</h2>
        <p style="color: #4b5563; line-height: 1.6;">
            We are excited to inform you that your registration for <strong>{{restaurant_name}}</strong> has been approved.
        </p>
        <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 30px 0; border: 1px solid #dbeafe;">
            <h3 style="color: #1e40af; margin-top: 0; font-size: 16px;">Your Login Credentials</h3>
            <p style="margin: 10px 0 5px; color: #6b7280; font-size: 14px;">Email:</p>
            <p style="margin: 0 0 15px; color: #111827; font-weight: 600;">{{email}}</p>
            <p style="margin: 0 0 5px; color: #6b7280; font-size: 14px;">Temporary Password:</p>
            <p style="margin: 0; color: #111827; font-weight: 600; font-family: monospace; background: white; padding: 4px 8px; border-radius: 4px; display: inline-block;">{{password}}</p>
        </div>
        <div style="text-align: center; margin-top: 40px;">
            <a href="{{dashboard_link}}" style="background-color: #2563eb; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Access Admin Dashboard</a>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            Please change your password after your first login for security.
        </p>
    </div>
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; {{year}} Table Tap. All rights reserved.</p>
    </div>
</div>
</body>
</html>'
    ),
    'Template for the Welcome email sent on approval.',
    'email_templates',
    false
),
(
    'email_template_invoice',
    jsonb_build_object(
        'subject', 'Invoice #{{invoice_number}} - Table Tap',
        'variables', '["invoice_number", "date", "restaurant_name", "plan_name", "billing_cycle", "subtotal", "gst", "total_paid", "year"]',
        'html', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-bottom: 2px solid #e2e8f0;">
          <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Invoice</h1>
          <p style="color: #64748b; margin: 8px 0 0;">#{{invoice_number}}</p>
        </div>
        
        <div style="padding: 32px 24px;">
          <p>Hello <strong>{{restaurant_name}}</strong>,</p>
          <p>Thank you for your business. Here is the receipt for your recent subscription payment.</p>
          
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding-bottom: 12px; color: #64748b;">Date</td>
                <td style="padding-bottom: 12px; text-align: right; font-weight: bold;">{{date}}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 12px 0; color: #64748b;">Plan</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold;">{{plan_name}} ({{billing_cycle}})</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 12px 0; color: #64748b;">Subtotal</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold;">₹{{subtotal}}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 12px 0; color: #64748b;">GST (18%)</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold;">₹{{gst}}</td>
              </tr>
              <tr>
                <td style="padding-top: 12px; font-size: 18px; font-weight: bold;">Total Paid</td>
                <td style="padding-top: 12px; text-align: right; font-size: 18px; font-weight: bold; color: #16a34a;">₹{{total_paid}}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #64748b; text-align: center;">
            This is an automated email. If you have any questions, please contact support.
          </p>
        </div>
        
        <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center; font-size: 12px;">
          &copy; {{year}} TableTap. All rights reserved.
        </div>
      </div>'
    ),
    'Template for subscription invoices.',
    'email_templates',
    false
),
(
    'email_template_application_received',
    jsonb_build_object(
        'subject', 'Application Received - {{restaurant_name}} | Table Tap',
        'variables', '["owner_name", "restaurant_name", "plan", "status_url", "year"]',
        'html', '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Received - Table Tap</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
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
                                Hi <strong>{{owner_name}}</strong>,
                            </p>
                            <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
                                We''ve received your registration application for <strong style="color: #2A9D8F;">{{restaurant_name}}</strong>. Our team will review your application and get back to you within <strong>24-48 hours</strong>.
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
                                                <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600; text-align: right;">{{restaurant_name}}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #777; font-size: 14px;">Plan:</td>
                                                <td style="padding: 8px 0; color: #2A9D8F; font-size: 14px; font-weight: 600; text-align: right; text-transform: capitalize;">{{plan}}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #777; font-size: 14px;">Status:</td>
                                                <td style="padding: 8px 0; font-size: 14px; text-align: right;">
                                                    <span style="background-color: #FEF3C7; color: #92400E; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 12px;">
                                                        Pending Review
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="{{status_url}}" style="display: inline-block; background: linear-gradient(135deg, #2A9D8F 0%, #238b7e 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px;">
                                            Track Application Status
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0; color: #777; font-size: 14px; line-height: 1.6;">
                                You can also track your application status anytime by visiting:
                                <br>
                                <a href="{{status_url}}" style="color: #2A9D8F; word-break: break-all;">{{status_url}}</a>
                            </p>
                            
                            <!-- What''s Next -->
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
                                © {{year}} Table Tap. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'
    ),
    'Template for the Application Received email.',
    'email_templates',
    false
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
