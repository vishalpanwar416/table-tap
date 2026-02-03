/**
 * WhatsApp Service - Handles sending messages via WhatsApp Business API
 */

import { supabase } from '../supabase';

// TableTap branding
export const TABLETAP_LOGO_URL = 'https://table-tap.in/logo.png';
export const TABLETAP_WEBSITE = 'https://table-tap.in';

/**
 * Log WhatsApp activity to admin_activity_logs table
 */
const logWhatsAppActivity = async (data, status, errorMessage = null) => {
    try {
        await supabase
            .from('admin_activity_logs')
            .insert([{
                activity_type: status === 'failed' ? 'whatsapp_failed' : 'whatsapp_sent',
                activity_name: `WhatsApp: ${data.message_type || 'bill'}`,
                restaurant_id: data.restaurant_id || null,
                user_id: data.triggered_by || null,
                user_name: data.triggered_by_name || 'System',
                target_type: 'whatsapp',
                target_id: data.order_id || null,
                target_name: data.to,
                status: status,
                details: {
                    message_type: data.message_type || 'bill',
                    recipient_phone: data.to,
                    amount: data.amount || null,
                    order_id: data.order_id || null,
                    error_message: errorMessage,
                    method: data.method || 'api' // 'api' or 'share_link'
                },
                description: `WhatsApp ${data.message_type || 'bill'} ${status === 'failed' ? 'failed' : 'sent'} to ${data.to}`,
                created_at: new Date().toISOString()
            }]);
    } catch (error) {
        console.error('Failed to log WhatsApp activity:', error);
    }
};

/**
 * Generate bill message for WhatsApp
 */
export const generateBillMessage = (order, restaurant) => {
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
    
    return `
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
};

/**
 * Generate order confirmation message
 */
export const generateOrderConfirmationMessage = (order, restaurant) => {
    const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;
    
    const items = order.items.map(item => 
        `• ${item.name} x${item.quantity}`
    ).join('\n');

    return `
✅ *ORDER CONFIRMED*

Hi${order.customer_name ? ` ${order.customer_name}` : ''}! Your order at *${restaurant.name}* has been received.

📋 *Order #${order.id?.slice(0, 8) || 'N/A'}*
🪑 Table: T${order.table_number || 'N/A'}

*Items:*
${items}

💰 *Total: ${formatCurrency(order.total)}*

Your order is being prepared. We'll notify you when it's ready!

_Powered by Table Tap_
    `.trim();
};

/**
 * Generate order ready message
 */
export const generateOrderReadyMessage = (order, restaurant) => {
    return `
🔔 *ORDER READY!*

Hi${order.customer_name ? ` ${order.customer_name}` : ''}! 

Your order #${order.id?.slice(0, 8) || 'N/A'} at *${restaurant.name}* is ready!

🪑 Table: T${order.table_number || 'N/A'}

Enjoy your meal! 🍽️

_Powered by Table Tap_
    `.trim();
};

/**
 * Clean and format phone number
 */
const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add India country code if not present
    if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }
    
    return cleaned;
};

/**
 * Generate WhatsApp share URL (fallback method)
 */
export const generateWhatsAppShareURL = (phoneNumber, message) => {
    const cleanPhone = formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

/**
 * Send WhatsApp message via Business API
 * @param {string} to - Phone number
 * @param {string} message - Message content
 * @param {Object} metadata - Additional metadata for logging
 */
export const sendWhatsAppMessage = async (to, message, metadata = {}) => {
    const cleanPhone = formatPhoneNumber(to);
    
    if (!cleanPhone) {
        throw new Error('Invalid phone number');
    }

    const logData = {
        to: cleanPhone,
        message_type: metadata.message_type || 'general',
        restaurant_id: metadata.restaurant_id,
        order_id: metadata.order_id,
        amount: metadata.amount,
        method: 'api'
    };

    try {
        // Try WhatsApp Business API via Supabase Edge Function
        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/send-whatsapp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                to: cleanPhone,
                message: message,
                type: 'text'
            })
        });

        if (response.ok) {
            const result = await response.json();
            await logWhatsAppActivity(logData, 'success');
            return { 
                success: true, 
                messageId: result.messageId,
                method: 'api'
            };
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'WhatsApp API unavailable');
        
    } catch (error) {
        console.warn('WhatsApp API failed, falling back to share link:', error);
        
        // Log the API failure
        await logWhatsAppActivity({ ...logData, method: 'share_link' }, 'fallback', error.message);
        
        // Return share URL as fallback
        const shareURL = generateWhatsAppShareURL(cleanPhone, message);
        
        return {
            success: false,
            fallback: true,
            shareURL: shareURL,
            error: error.message,
            message: 'WhatsApp API unavailable. Use share link instead.'
        };
    }
};

/**
 * Send bill via WhatsApp
 */
export const sendWhatsAppBill = async (order, restaurant, phoneNumber) => {
    if (!order || !restaurant || !phoneNumber) {
        throw new Error('Missing required parameters');
    }

    const message = generateBillMessage(order, restaurant);
    
    return sendWhatsAppMessage(phoneNumber, message, {
        message_type: 'bill',
        restaurant_id: restaurant.id,
        order_id: order.id,
        amount: order.total
    });
};

/**
 * Send order confirmation via WhatsApp
 */
export const sendOrderConfirmation = async (order, restaurant, phoneNumber) => {
    if (!order || !restaurant || !phoneNumber) {
        throw new Error('Missing required parameters');
    }

    const message = generateOrderConfirmationMessage(order, restaurant);
    
    return sendWhatsAppMessage(phoneNumber, message, {
        message_type: 'order_confirmation',
        restaurant_id: restaurant.id,
        order_id: order.id,
        amount: order.total
    });
};

/**
 * Send order ready notification via WhatsApp
 */
export const sendOrderReadyNotification = async (order, restaurant, phoneNumber) => {
    if (!order || !restaurant || !phoneNumber) {
        throw new Error('Missing required parameters');
    }

    const message = generateOrderReadyMessage(order, restaurant);
    
    return sendWhatsAppMessage(phoneNumber, message, {
        message_type: 'order_ready',
        restaurant_id: restaurant.id,
        order_id: order.id
    });
};

/**
 * Open WhatsApp with pre-filled message (fallback/manual method)
 */
export const openWhatsAppWithMessage = (phoneNumber, message) => {
    const url = generateWhatsAppShareURL(phoneNumber, message);
    window.open(url, '_blank');
    return { success: true, url };
};

/**
 * Open WhatsApp with bill (fallback/manual method)
 */
export const openWhatsAppBill = (order, restaurant, phoneNumber) => {
    const message = generateBillMessage(order, restaurant);
    return openWhatsAppWithMessage(phoneNumber, message);
};

/**
 * Copy message to clipboard
 */
export const copyMessageToClipboard = async (message) => {
    try {
        await navigator.clipboard.writeText(message);
        return { success: true };
    } catch (error) {
        throw new Error('Failed to copy to clipboard');
    }
};

export default {
    sendWhatsAppMessage,
    sendWhatsAppBill,
    sendOrderConfirmation,
    sendOrderReadyNotification,
    openWhatsAppWithMessage,
    openWhatsAppBill,
    generateBillMessage,
    generateOrderConfirmationMessage,
    generateOrderReadyMessage,
    generateWhatsAppShareURL,
    copyMessageToClipboard
};
