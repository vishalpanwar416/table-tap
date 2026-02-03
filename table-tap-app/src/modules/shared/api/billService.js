/**
 * Bill Service - Unified service for sending bills via Email & WhatsApp
 */

import { sendBillEmail, getBillPreviewHTML } from './emailService';
import { 
    sendWhatsAppBill, 
    openWhatsAppBill, 
    generateBillMessage,
    generateWhatsAppShareURL 
} from './whatsappService';
import { supabase } from '../supabase';

/**
 * Bill sending methods
 */
export const BILL_METHODS = {
    EMAIL: 'email',
    WHATSAPP: 'whatsapp',
    BOTH: 'both'
};

/**
 * Send bill to customer
 * @param {Object} order - Order details
 * @param {Object} restaurant - Restaurant details
 * @param {Object} options - Sending options
 * @param {string} options.method - 'email', 'whatsapp', or 'both'
 * @param {string} options.email - Customer email (required for email method)
 * @param {string} options.phone - Customer phone (required for whatsapp method)
 * @param {boolean} options.openWhatsApp - Open WhatsApp app instead of API (fallback)
 */
export const sendBill = async (order, restaurant, options = {}) => {
    const { method = BILL_METHODS.BOTH, email, phone, openWhatsApp = false } = options;
    
    const results = {
        email: null,
        whatsapp: null,
        success: false,
        errors: []
    };

    // Send via Email
    if (method === BILL_METHODS.EMAIL || method === BILL_METHODS.BOTH) {
        if (email) {
            try {
                const emailResult = await sendBillEmail(order, restaurant, email);
                results.email = emailResult;
                if (emailResult.success) {
                    results.success = true;
                }
            } catch (error) {
                results.email = { success: false, error: error.message };
                results.errors.push(`Email: ${error.message}`);
            }
        } else if (method === BILL_METHODS.EMAIL) {
            results.errors.push('Email: No email address provided');
        }
    }

    // Send via WhatsApp
    if (method === BILL_METHODS.WHATSAPP || method === BILL_METHODS.BOTH) {
        if (phone) {
            try {
                if (openWhatsApp) {
                    // Use fallback method - opens WhatsApp app
                    const waResult = openWhatsAppBill(order, restaurant, phone);
                    results.whatsapp = { ...waResult, method: 'share_link' };
                    results.success = true;
                } else {
                    // Try API first
                    const waResult = await sendWhatsAppBill(order, restaurant, phone);
                    results.whatsapp = waResult;
                    if (waResult.success || waResult.fallback) {
                        results.success = true;
                    }
                }
            } catch (error) {
                results.whatsapp = { success: false, error: error.message };
                results.errors.push(`WhatsApp: ${error.message}`);
            }
        } else if (method === BILL_METHODS.WHATSAPP) {
            results.errors.push('WhatsApp: No phone number provided');
        }
    }

    return results;
};

/**
 * Send bill using customer's order contact info
 */
export const sendBillToCustomer = async (order, restaurant) => {
    const email = order.customer_email;
    const phone = order.customer_phone;

    if (!email && !phone) {
        throw new Error('No contact information available for this customer');
    }

    let method = BILL_METHODS.BOTH;
    if (!email) method = BILL_METHODS.WHATSAPP;
    if (!phone) method = BILL_METHODS.EMAIL;

    return sendBill(order, restaurant, { method, email, phone });
};

/**
 * Quick send bill via Email only
 */
export const emailBill = async (order, restaurant, email) => {
    return sendBill(order, restaurant, { 
        method: BILL_METHODS.EMAIL, 
        email 
    });
};

/**
 * Quick send bill via WhatsApp only
 */
export const whatsappBill = async (order, restaurant, phone, openApp = false) => {
    return sendBill(order, restaurant, { 
        method: BILL_METHODS.WHATSAPP, 
        phone,
        openWhatsApp: openApp
    });
};

/**
 * Get bill preview data
 */
export const getBillPreview = (order, restaurant) => {
    return {
        html: getBillPreviewHTML(order, restaurant),
        whatsappMessage: generateBillMessage(order, restaurant),
        whatsappShareURL: order.customer_phone ? 
            generateWhatsAppShareURL(order.customer_phone, generateBillMessage(order, restaurant)) : 
            null
    };
};

/**
 * Get customer contact info from order
 */
export const getCustomerContacts = (order) => {
    return {
        email: order.customer_email || null,
        phone: order.customer_phone || null,
        name: order.customer_name || 'Guest',
        hasEmail: !!order.customer_email,
        hasPhone: !!order.customer_phone,
        canSendBill: !!(order.customer_email || order.customer_phone)
    };
};

/**
 * Save bill sending preference for restaurant
 */
export const saveBillPreference = async (restaurantId, preference) => {
    try {
        const { data, error } = await supabase
            .from('restaurants')
            .update({ 
                bill_sending_preference: preference,
                updated_at: new Date().toISOString()
            })
            .eq('id', restaurantId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Get bill sending preference for restaurant
 */
export const getBillPreference = async (restaurantId) => {
    try {
        const { data, error } = await supabase
            .from('restaurants')
            .select('bill_sending_preference')
            .eq('id', restaurantId)
            .single();

        if (error) throw error;
        return data?.bill_sending_preference || BILL_METHODS.BOTH;
    } catch (error) {
        return BILL_METHODS.BOTH;
    }
};

/**
 * Log bill sending activity
 */
export const logBillSent = async (order, restaurant, method, success, error = null) => {
    try {
        await supabase
            .from('admin_activity_logs')
            .insert([{
                activity_type: success ? 'bill_sent' : 'bill_failed',
                activity_name: `Bill sent via ${method}`,
                restaurant_id: restaurant.id,
                target_type: 'order',
                target_id: order.id,
                target_name: order.customer_name || order.customer_email || order.customer_phone || 'Guest',
                status: success ? 'success' : 'failed',
                details: {
                    method: method,
                    order_id: order.id,
                    amount: order.total,
                    recipient_email: order.customer_email,
                    recipient_phone: order.customer_phone,
                    error: error
                },
                description: `Bill ${success ? 'sent' : 'failed'} via ${method} for order #${order.id?.slice(0, 8)}`,
                created_at: new Date().toISOString()
            }]);
    } catch (err) {
        console.error('Failed to log bill activity:', err);
    }
};

export default {
    sendBill,
    sendBillToCustomer,
    emailBill,
    whatsappBill,
    getBillPreview,
    getCustomerContacts,
    saveBillPreference,
    getBillPreference,
    logBillSent,
    BILL_METHODS
};
