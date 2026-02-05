-- Add Bill Email Template to system_settings (editable in Admin > System Settings)
INSERT INTO system_settings (key, value, description, category, is_secret)
VALUES
(
    'email_template_bill',
    jsonb_build_object(
        'subject', 'Your Bill from {{restaurant_name}} - Order #{{order_id}}',
        'variables', '["restaurant_name","restaurant_address","order_id","date","table_number","payment_method","customer_name","customer_email","customer_phone","items_rows","subtotal","discount","gst","delivery_fee","total","special_instructions","restaurant_contact","restaurant_gst","year"]',
        'html', '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Bill from {{restaurant_name}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
<table role="presentation" style="width: 100%; border-collapse: collapse;">
<tr><td style="padding: 40px 20px;">
<table role="presentation" style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
<tr><td style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px;">
<table role="presentation" style="width: 100%;"><tr>
<td><h1 style="margin: 0; color: #fff; font-size: 24px;">{{restaurant_name}}</h1><p style="margin: 5px 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">{{restaurant_address}}</p></td>
<td style="text-align: right;"><span style="background: #f97316; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 700;">INVOICE</span></td>
</tr></table></td></tr>
<tr><td style="padding: 30px;">
<table role="presentation" style="width: 100%; background: #f8f9fa; border-radius: 12px; padding: 20px;">
<tr><td><p style="margin: 0 0 4px; color: #999; font-size: 11px;">Order ID</p><p style="margin: 0; font-weight: 700;">#{{order_id}}</p></td>
<td><p style="margin: 0 0 4px; color: #999; font-size: 11px;">Date</p><p style="margin: 0; font-weight: 700;">{{date}}</p></td></tr>
<tr><td style="padding-top: 15px;"><p style="margin: 0 0 4px; color: #999; font-size: 11px;">Table</p><p style="margin: 0; font-weight: 700;">{{table_number}}</p></td>
<td style="padding-top: 15px;"><p style="margin: 0 0 4px; color: #999; font-size: 11px;">Payment</p><p style="margin: 0; font-weight: 700;">{{payment_method}}</p></td></tr>
</table></td></tr>
<tr><td style="padding: 0 30px 20px;">
<div style="padding: 15px; background: #fff8f3; border-radius: 8px; border-left: 4px solid #f97316;">
<p style="margin: 0 0 4px; color: #999; font-size: 11px;">Bill To</p>
<p style="margin: 0; font-weight: 600;">{{customer_name}}</p>
<p style="margin: 4px 0 0; color: #666; font-size: 14px;">{{customer_email}}</p>
<p style="margin: 4px 0 0; color: #666; font-size: 14px;">{{customer_phone}}</p>
</div></td></tr>
<tr><td style="padding: 0 30px 30px;">
<table role="presentation" style="width: 100%; border-collapse: collapse;">
<thead><tr style="background: #f8f9fa;">
<th style="padding: 12px; text-align: left; font-size: 11px; color: #666;">Item</th>
<th style="padding: 12px; text-align: center; font-size: 11px; color: #666;">Qty</th>
<th style="padding: 12px; text-align: center; font-size: 11px; color: #666;">Price</th>
<th style="padding: 12px; text-align: right; font-size: 11px; color: #666;">Amount</th>
</tr></thead>
<tbody>{{items_rows}}</tbody>
</table>
<table role="presentation" style="width: 100%; margin-top: 20px;">
<tr><td style="padding: 8px 0; color: #666;">Subtotal</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">{{subtotal}}</td></tr>
{{discount_row}}
<tr><td style="padding: 8px 0; color: #666;">SGST (2.5%)</td><td style="padding: 8px 0; text-align: right;">{{sgst}}</td></tr>
<tr><td style="padding: 8px 0; color: #666;">CGST (2.5%)</td><td style="padding: 8px 0; text-align: right;">{{cgst}}</td></tr>
{{delivery_row}}
<tr style="border-top: 2px solid #333;"><td style="padding: 15px 0 0; font-size: 18px; font-weight: 800;">Total</td><td style="padding: 15px 0 0; text-align: right; font-size: 24px; font-weight: 800; color: #f97316;">{{total}}</td></tr>
</table>
{{special_instructions_block}}
</td></tr>
<tr><td style="background: #f8f9fa; padding: 30px; text-align: center;">
<p style="margin: 0 0 10px; color: #333; font-size: 18px; font-weight: 700;">Thank you for dining with us!</p>
<p style="margin: 0; color: #666; font-size: 14px;">{{restaurant_contact}}</p>
<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">{{restaurant_gst}}</div>
<p style="margin: 20px 0 0; color: #999; font-size: 12px;">&copy; {{year}} TableTap</p>
</td></tr>
</table></td></tr>
</table>
</body>
</html>'
    ),
    'Template for the order bill email sent to customers. Edit in Admin > System Settings.',
    'email',
    false
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  category = EXCLUDED.category;
