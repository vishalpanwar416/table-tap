/**
 * Email Service - Handles sending various emails (bills, notifications, etc.)
 */

import { supabase } from '../supabase';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

/**
 * Log email activity to admin_activity_logs table
 */
const logEmailActivity = async (emailData, status, errorMessage = null) => {
    try {
        await supabase
            .from('admin_activity_logs')
            .insert([{
                activity_type: status === 'failed' ? 'email_failed' : status === 'queued' ? 'email_queued' : 'email_sent',
                activity_name: `Email: ${emailData.email_type || 'bill'}`,
                restaurant_id: emailData.restaurant_id || null,
                user_id: emailData.triggered_by || null,
                user_name: emailData.triggered_by_name || 'System (Automated)',
                target_type: 'email',
                target_id: emailData.order_id || null,
                target_name: emailData.to,
                status: status,
                details: {
                    email_type: emailData.email_type || 'bill',
                    recipient_email: emailData.to,
                    subject: emailData.subject,
                    amount: emailData.amount || null,
                    order_id: emailData.order_id || null,
                    error_message: errorMessage
                },
                description: `${emailData.email_type || 'Bill'} email ${status === 'failed' ? 'failed to send' : status === 'queued' ? 'queued' : 'sent'} to ${emailData.to}`,
                created_at: new Date().toISOString()
            }]);
    } catch (error) {
        console.error('Failed to log email activity:', error);
    }
};

/**
 * Generate bill HTML for email
 */
const generateBillHTML = (order, restaurant) => {
    const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;
    const formatDate = (date) => new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const itemsHTML = order.items.map(item => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                <div style="font-weight: 600; color: #333;">${item.name}</div>
                ${item.variant ? `<div style="font-size: 12px; color: #666;">Variant: ${item.variant}</div>` : ''}
                ${item.addons?.length ? `<div style="font-size: 12px; color: #666;">Add-ons: ${item.addons.join(', ')}</div>` : ''}
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; color: #666;">${item.quantity}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; color: #666;">${formatCurrency(item.price)}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Bill from ${restaurant.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px;">
                            <table role="presentation" style="width: 100%;">
                                <tr>
                                    <td>
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                                            ${restaurant.name}
                                        </h1>
                                        <p style="margin: 5px 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                                            ${restaurant.address || ''}
                                        </p>
                                    </td>
                                    <td style="text-align: right;">
                                        <span style="background: #f97316; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 700;">
                                            INVOICE
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Order Info -->
                    <tr>
                        <td style="padding: 30px;">
                            <table role="presentation" style="width: 100%; background: #f8f9fa; border-radius: 12px; padding: 20px;">
                                <tr>
                                    <td style="padding: 10px;">
                                        <table role="presentation" style="width: 100%;">
                                            <tr>
                                                <td style="width: 50%;">
                                                    <p style="margin: 0 0 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Order ID</p>
                                                    <p style="margin: 0; color: #333; font-weight: 700;">#${order.id?.slice(0, 8) || 'N/A'}</p>
                                                </td>
                                                <td style="width: 50%;">
                                                    <p style="margin: 0 0 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Date</p>
                                                    <p style="margin: 0; color: #333; font-weight: 700;">${formatDate(order.created_at)}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-top: 15px;">
                                                    <p style="margin: 0 0 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Table</p>
                                                    <p style="margin: 0; color: #333; font-weight: 700;">T${order.table_number || 'N/A'}</p>
                                                </td>
                                                <td style="padding-top: 15px;">
                                                    <p style="margin: 0 0 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Payment</p>
                                                    <p style="margin: 0; color: #333; font-weight: 700; text-transform: uppercase;">${order.payment_method || 'N/A'}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Customer Info -->
                            ${order.customer_name || order.customer_email ? `
                            <div style="margin-top: 20px; padding: 15px; background: #fff8f3; border-radius: 8px; border-left: 4px solid #f97316;">
                                <p style="margin: 0 0 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Bill To</p>
                                <p style="margin: 0; color: #333; font-weight: 600;">${order.customer_name || 'Guest'}</p>
                                ${order.customer_email ? `<p style="margin: 4px 0 0; color: #666; font-size: 14px;">${order.customer_email}</p>` : ''}
                                ${order.customer_phone ? `<p style="margin: 4px 0 0; color: #666; font-size: 14px;">${order.customer_phone}</p>` : ''}
                            </div>
                            ` : ''}
                        </td>
                    </tr>
                    
                    <!-- Items Table -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #f8f9fa;">
                                        <th style="padding: 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #eee;">Item</th>
                                        <th style="padding: 12px; text-align: center; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #eee;">Qty</th>
                                        <th style="padding: 12px; text-align: center; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #eee;">Price</th>
                                        <th style="padding: 12px; text-align: right; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #eee;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHTML}
                                </tbody>
                            </table>
                            
                            <!-- Totals -->
                            <table role="presentation" style="width: 100%; margin-top: 20px;">
                                <tr>
                                    <td style="width: 60%;"></td>
                                    <td style="width: 40%;">
                                        <table role="presentation" style="width: 100%;">
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;">Subtotal</td>
                                                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(order.subtotal)}</td>
                                            </tr>
                                            ${order.discount > 0 ? `
                                            <tr>
                                                <td style="padding: 8px 0; color: #22c55e;">Discount</td>
                                                <td style="padding: 8px 0; text-align: right; color: #22c55e; font-weight: 600;">-${formatCurrency(order.discount)}</td>
                                            </tr>
                                            ` : ''}
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;">SGST (2.5%)</td>
                                                <td style="padding: 8px 0; text-align: right;">${formatCurrency((order.gst || 0) / 2)}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;">CGST (2.5%)</td>
                                                <td style="padding: 8px 0; text-align: right;">${formatCurrency((order.gst || 0) / 2)}</td>
                                            </tr>
                                            ${order.deliveryFee > 0 ? `
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;">Delivery Fee</td>
                                                <td style="padding: 8px 0; text-align: right;">${formatCurrency(order.deliveryFee)}</td>
                                            </tr>
                                            ` : ''}
                                            <tr style="border-top: 2px solid #333;">
                                                <td style="padding: 15px 0 0; font-size: 18px; font-weight: 800; color: #333;">Total</td>
                                                <td style="padding: 15px 0 0; text-align: right; font-size: 24px; font-weight: 800; color: #f97316;">${formatCurrency(order.total)}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Special Instructions -->
                    ${order.special_instructions ? `
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <div style="background: #fef3c7; border-radius: 8px; padding: 15px;">
                                <p style="margin: 0 0 5px; color: #92400e; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Special Instructions</p>
                                <p style="margin: 0; color: #78350f;">${order.special_instructions}</p>
                            </div>
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8f9fa; padding: 30px; text-align: center;">
                            <p style="margin: 0 0 10px; color: #333; font-size: 18px; font-weight: 700;">
                                Thank you for dining with us! 🍽️
                            </p>
                            <p style="margin: 0; color: #666; font-size: 14px;">
                                We hope to see you again soon.
                            </p>
                            
                            ${restaurant.contact_phone ? `
                            <p style="margin: 20px 0 0; color: #999; font-size: 13px;">
                                Questions? Call us at ${restaurant.contact_phone}
                            </p>
                            ` : ''}
                            
                            <!-- Legal Info -->
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                                ${restaurant.gst_number ? `<p style="margin: 0; color: #999; font-size: 11px;">GST: ${restaurant.gst_number}</p>` : ''}
                                ${restaurant.fssai_license ? `<p style="margin: 5px 0 0; color: #999; font-size: 11px;">FSSAI: ${restaurant.fssai_license}</p>` : ''}
                            </div>
                        </td>
                    </tr>
                </table>
                
                <!-- Powered By -->
                <p style="text-align: center; margin: 20px 0 0; color: #999; font-size: 12px;">
                    Powered by <a href="https://tabletap.in" style="color: #f97316; text-decoration: none;">Table Tap</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

/**
 * Generate plain text version of bill
 */
const generateBillText = (order, restaurant) => {
    const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;
    
    const items = order.items.map(item => 
        `${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`
    ).join('\n');
    
    return `
${restaurant.name}
${restaurant.address || ''}
${'='.repeat(40)}

ORDER RECEIPT
${'─'.repeat(40)}
Order #: ${order.id?.slice(0, 8) || 'N/A'}
Date: ${new Date(order.created_at).toLocaleString('en-IN')}
Table: T${order.table_number || 'N/A'}
Payment: ${order.payment_method?.toUpperCase() || 'N/A'}

${order.customer_name ? `Customer: ${order.customer_name}` : ''}
${'─'.repeat(40)}

ITEMS
${items}

${'─'.repeat(40)}
Subtotal: ${formatCurrency(order.subtotal)}
${order.discount > 0 ? `Discount: -${formatCurrency(order.discount)}` : ''}
SGST (2.5%): ${formatCurrency((order.gst || 0) / 2)}
CGST (2.5%): ${formatCurrency((order.gst || 0) / 2)}
${order.deliveryFee > 0 ? `Delivery: ${formatCurrency(order.deliveryFee)}` : ''}
${'═'.repeat(40)}
TOTAL: ${formatCurrency(order.total)}
${'═'.repeat(40)}

${order.special_instructions ? `Note: ${order.special_instructions}` : ''}

Thank you for dining with us!
${restaurant.contact_phone ? `Phone: ${restaurant.contact_phone}` : ''}
${restaurant.gst_number ? `GST: ${restaurant.gst_number}` : ''}

Powered by Table Tap - tabletap.in
    `.trim();
};

/**
 * Send bill email to customer
 * @param {Object} order - Order details
 * @param {Object} restaurant - Restaurant details
 * @param {string} recipientEmail - Email to send the bill to
 * @returns {Promise<Object>} - Result of email send operation
 */
export const sendBillEmail = async (order, restaurant, recipientEmail) => {
    if (!order || !restaurant || !recipientEmail) {
        throw new Error('Missing required parameters: order, restaurant, or recipientEmail');
    }

    const emailHtml = generateBillHTML(order, restaurant);
    const emailText = generateBillText(order, restaurant);

    // Try to send via Supabase Edge Function or fallback API
    const emailData = {
        to: recipientEmail,
        subject: `Your Bill from ${restaurant.name} - Order #${order.id?.slice(0, 8) || 'N/A'}`,
        html: emailHtml,
        text: emailText,
        from: `${restaurant.name} <noreply@tabletap.in>`,
        replyTo: restaurant.email || undefined
    };

    // Email metadata for logging
    const emailLogData = {
        to: recipientEmail,
        subject: emailData.subject,
        email_type: 'bill',
        restaurant_id: restaurant.id,
        order_id: order.id,
        amount: order.total
    };

    try {
        // Try Supabase Edge Function first
        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(emailData)
        });

        if (response.ok) {
            const result = await response.json();
            // Log successful email
            await logEmailActivity(emailLogData, 'success');
            return { success: true, ...result };
        }
        
        // If Supabase function fails, try alternative
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Supabase email function unavailable');
    } catch (error) {
        console.warn('Primary email service failed:', error);
        
        // Log failed email
        await logEmailActivity(emailLogData, 'failed', error.message);
        
        // Store in localStorage for debugging/testing
        const storedEmails = JSON.parse(localStorage.getItem('pendingBillEmails') || '[]');
        storedEmails.push({
            ...emailData,
            timestamp: new Date().toISOString(),
            orderId: order.id,
            error: error.message
        });
        localStorage.setItem('pendingBillEmails', JSON.stringify(storedEmails.slice(-10))); // Keep last 10
        
        return { 
            success: false, 
            error: error.message,
            message: 'Email failed to send' 
        };
    }
};

/**
 * Send bill to customer's registered email
 */
export const sendBillToCustomer = async (order, restaurant) => {
    const customerEmail = order.customer_email;
    
    if (!customerEmail) {
        throw new Error('Customer email not available for this order');
    }
    
    return sendBillEmail(order, restaurant, customerEmail);
};

/**
 * Get the bill HTML for preview
 */
export const getBillPreviewHTML = (order, restaurant) => {
    return generateBillHTML(order, restaurant);
};

/**
 * Generate WhatsApp bill message
 */
const generateWhatsAppBillMessage = (order, restaurant) => {
    const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;
    const formatDate = (date) => new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const items = order.items.map(item => 
        `• ${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`
    ).join('\n');
    
    const message = `
🧾 *BILL FROM ${restaurant.name?.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━

📋 *Order Details*
Order #: ${order.id?.slice(0, 8) || 'N/A'}
Date: ${formatDate(order.created_at)}
Table: T${order.table_number || 'N/A'}
${order.customer_name ? `Customer: ${order.customer_name}` : ''}

━━━━━━━━━━━━━━━━━━━━
📦 *ITEMS*
━━━━━━━━━━━━━━━━━━━━
${items}

━━━━━━━━━━━━━━━━━━━━
💰 *BILL SUMMARY*
━━━━━━━━━━━━━━━━━━━━
Subtotal: ${formatCurrency(order.subtotal)}
${order.discount > 0 ? `Discount: -${formatCurrency(order.discount)} 🎉` : ''}
SGST (2.5%): ${formatCurrency((order.gst || 0) / 2)}
CGST (2.5%): ${formatCurrency((order.gst || 0) / 2)}
${order.deliveryFee > 0 ? `Delivery: ${formatCurrency(order.deliveryFee)}` : ''}
━━━━━━━━━━━━━━━━━━━━
*TOTAL: ${formatCurrency(order.total)}*
━━━━━━━━━━━━━━━━━━━━
Payment: ${order.payment_method?.toUpperCase() || 'N/A'}

${order.special_instructions ? `📝 Note: ${order.special_instructions}\n` : ''}
🙏 *Thank you for dining with us!*
${restaurant.contact_phone ? `📞 ${restaurant.contact_phone}` : ''}
${restaurant.address ? `📍 ${restaurant.address}` : ''}

_Powered by Table Tap_
    `.trim();

    return message;
};

/**
 * Generate WhatsApp share URL
 * @param {string} phoneNumber - Phone number with country code (e.g., 919876543210)
 * @param {string} message - Message to send
 * @returns {string} WhatsApp URL
 */
export const generateWhatsAppURL = (phoneNumber, message) => {
    // Clean the phone number - remove spaces, dashes, and +
    const cleanPhone = phoneNumber.replace(/[\s\-\+]/g, '');
    
    // Add country code if not present (default to India +91)
    const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${phoneWithCode}?text=${encodedMessage}`;
};

/**
 * Send bill via WhatsApp
 * Opens WhatsApp with pre-filled bill message
 * @param {Object} order - Order details
 * @param {Object} restaurant - Restaurant details  
 * @param {string} phoneNumber - Customer phone number
 * @returns {Object} - Result with WhatsApp URL
 */
export const sendWhatsAppBill = (order, restaurant, phoneNumber) => {
    if (!order || !restaurant || !phoneNumber) {
        throw new Error('Missing required parameters: order, restaurant, or phoneNumber');
    }

    const message = generateWhatsAppBillMessage(order, restaurant);
    const whatsappURL = generateWhatsAppURL(phoneNumber, message);
    
    // Open WhatsApp in new tab
    window.open(whatsappURL, '_blank');
    
    return { 
        success: true, 
        url: whatsappURL,
        message: 'WhatsApp opened with bill'
    };
};

/**
 * Get WhatsApp bill message for preview
 */
export const getWhatsAppBillMessage = (order, restaurant) => {
    return generateWhatsAppBillMessage(order, restaurant);
};

/**
 * Copy bill to clipboard for manual sharing
 */
export const copyBillToClipboard = async (order, restaurant) => {
    const message = generateWhatsAppBillMessage(order, restaurant);
    
    try {
        await navigator.clipboard.writeText(message);
        return { success: true, message: 'Bill copied to clipboard' };
    } catch (error) {
        console.error('Failed to copy:', error);
        throw new Error('Failed to copy bill to clipboard');
    }
};

export default {
    sendBillEmail,
    sendBillToCustomer,
    getBillPreviewHTML,
    sendWhatsAppBill,
    getWhatsAppBillMessage,
    generateWhatsAppURL,
    copyBillToClipboard
};
