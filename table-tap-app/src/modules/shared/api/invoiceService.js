/**
 * Invoice Service - API operations for invoice management
 */

import { supabase } from '../supabase';
import {
    generateInvoiceNumber,
    createInvoiceData,
    generateProfessionalInvoiceHTML,
    calculateGST
} from '../utils/invoiceGenerator';

/**
 * Get all invoices for a restaurant
 */
export const getRestaurantInvoices = async (restaurantId) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select(`
                *,
                subscription:subscriptions(plan_name, billing_cycle, start_date, end_date)
            `)
            .eq('restaurant_id', restaurantId)
            .eq('is_void', false)
            .order('invoice_date', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Get a single invoice by ID
 */
export const getInvoiceById = async (invoiceId) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select(`
                *,
                restaurant:restaurants(name, address, city, state, pincode, contact_email, contact_phone, gst_number),
                subscription:subscriptions(plan_name, billing_cycle, start_date, end_date)
            `)
            .eq('id', invoiceId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Get invoice by invoice number
 */
export const getInvoiceByNumber = async (invoiceNumber) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select(`
                *,
                restaurant:restaurants(name, address, city, state, pincode, contact_email, contact_phone, gst_number),
                subscription:subscriptions(plan_name, billing_cycle, start_date, end_date)
            `)
            .eq('invoice_number', invoiceNumber)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Get all invoices (admin only)
 */
export const getAllInvoices = async (filters = {}) => {
    try {
        let query = supabase
            .from('invoices')
            .select(`
                *,
                restaurant:restaurants(id, name, contact_email),
                subscription:subscriptions(plan_name, billing_cycle)
            `)
            .eq('is_void', false);

        // Apply filters
        if (filters.status) {
            query = query.eq('payment_status', filters.status);
        }
        if (filters.type) {
            query = query.eq('invoice_type', filters.type);
        }
        if (filters.fromDate) {
            query = query.gte('invoice_date', filters.fromDate);
        }
        if (filters.toDate) {
            query = query.lte('invoice_date', filters.toDate);
        }
        if (filters.restaurantId) {
            query = query.eq('restaurant_id', filters.restaurantId);
        }

        query = query.order('invoice_date', { ascending: false });

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching all invoices:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Create a new invoice manually
 */
export const createInvoice = async (invoiceData) => {
    try {
        // Generate invoice number if not provided
        if (!invoiceData.invoice_number) {
            const { data: seqData } = await supabase
                .rpc('generate_invoice_number');
            invoiceData.invoice_number = seqData || generateInvoiceNumber(Date.now());
        }

        // Calculate GST if not provided
        if (!invoiceData.total_tax && invoiceData.subtotal) {
            const taxAmount = invoiceData.subtotal * 0.18;
            invoiceData.cgst_amount = taxAmount / 2;
            invoiceData.sgst_amount = taxAmount / 2;
            invoiceData.total_tax = taxAmount;
            invoiceData.total_amount = invoiceData.subtotal + taxAmount;
        }

        // Get company details for snapshot
        const { data: companySettings } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'company_details')
            .single();

        invoiceData.company_snapshot = companySettings?.value || null;

        const { data, error } = await supabase
            .from('invoices')
            .insert([invoiceData])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creating invoice:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Update invoice email status
 */
export const updateInvoiceEmailStatus = async (invoiceId, email) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .update({
                email_sent: true,
                email_sent_at: new Date().toISOString(),
                email_sent_to: email
            })
            .eq('id', invoiceId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating invoice email status:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Void an invoice
 */
export const voidInvoice = async (invoiceId, reason) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .update({
                is_void: true,
                voided_at: new Date().toISOString(),
                void_reason: reason
            })
            .eq('id', invoiceId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error voiding invoice:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Get invoice statistics
 */
export const getInvoiceStats = async (restaurantId = null) => {
    try {
        let query = supabase
            .from('invoices')
            .select('total_amount, payment_status, invoice_type, invoice_date')
            .eq('is_void', false);

        if (restaurantId) {
            query = query.eq('restaurant_id', restaurantId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calculate stats
        const stats = {
            totalInvoices: data.length,
            totalRevenue: 0,
            paidInvoices: 0,
            pendingInvoices: 0,
            thisMonthRevenue: 0,
            lastMonthRevenue: 0,
            byType: {}
        };

        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

        data.forEach(invoice => {
            stats.totalRevenue += invoice.total_amount || 0;

            if (invoice.payment_status === 'paid') {
                stats.paidInvoices++;
            } else if (invoice.payment_status === 'pending') {
                stats.pendingInvoices++;
            }

            // Monthly breakdown
            const invoiceMonth = invoice.invoice_date?.substring(0, 7);
            if (invoiceMonth === thisMonth) {
                stats.thisMonthRevenue += invoice.total_amount || 0;
            } else if (invoiceMonth === lastMonthStr) {
                stats.lastMonthRevenue += invoice.total_amount || 0;
            }

            // By type
            const type = invoice.invoice_type || 'other';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });

        return { data: stats, error: null };
    } catch (error) {
        console.error('Error fetching invoice stats:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Generate invoice from subscription history (for existing records without invoices)
 */
export const generateInvoiceFromHistory = async (historyRecord, restaurant, subscription) => {
    try {
        // Check if invoice already exists for this history record
        const { data: existing } = await supabase
            .from('invoices')
            .select('id')
            .eq('subscription_history_id', historyRecord.id)
            .single();

        if (existing) {
            return { data: existing, error: null, message: 'Invoice already exists' };
        }

        // Calculate amounts
        const totalAmount = historyRecord.amount_paid || 0;
        const gstAmount = historyRecord.gst_amount || (totalAmount - totalAmount / 1.18);
        const subtotal = totalAmount - gstAmount;

        // Get company details
        const { data: companySettings } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'company_details')
            .single();

        // Generate invoice number
        const { data: invNumber } = await supabase
            .rpc('generate_invoice_number');

        const invoiceData = {
            invoice_number: invNumber || generateInvoiceNumber(Date.now()),
            invoice_date: historyRecord.created_at,
            due_date: historyRecord.created_at,
            restaurant_id: restaurant.id,
            subscription_id: subscription?.id,
            subscription_history_id: historyRecord.id,
            invoice_type: historyRecord.action === 'renewed' ? 'renewal' : 
                          historyRecord.action === 'upgraded' ? 'upgrade' : 'subscription',
            subtotal: subtotal,
            taxable_amount: subtotal,
            cgst_amount: gstAmount / 2,
            sgst_amount: gstAmount / 2,
            total_tax: gstAmount,
            total_amount: totalAmount,
            payment_status: 'paid',
            payment_method: subscription?.payment_method || 'online',
            payment_reference: historyRecord.payment_reference,
            payment_date: historyRecord.created_at,
            line_items: [{
                name: `TableTap ${(historyRecord.new_plan || subscription?.plan_name || 'Professional').charAt(0).toUpperCase() + (historyRecord.new_plan || subscription?.plan_name || 'Professional').slice(1)}`,
                description: `${(subscription?.billing_cycle || 'Monthly').charAt(0).toUpperCase() + (subscription?.billing_cycle || 'Monthly').slice(1)} Subscription`,
                quantity: 1,
                unit_price: subtotal,
                tax_rate: 18
            }],
            customer_snapshot: {
                name: restaurant.name,
                address: restaurant.address,
                city: restaurant.city,
                state: restaurant.state,
                pincode: restaurant.pincode,
                email: restaurant.contact_email,
                phone: restaurant.contact_phone,
                gstin: restaurant.gst_number
            },
            company_snapshot: companySettings?.value || null
        };

        const { data, error } = await supabase
            .from('invoices')
            .insert([invoiceData])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error generating invoice from history:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Send invoice email
 */
export const sendInvoiceEmail = async (invoiceId, recipientEmail = null) => {
    try {
        // Get invoice data
        const { data: invoice, error: invoiceError } = await getInvoiceById(invoiceId);
        if (invoiceError) throw new Error(invoiceError);

        const email = recipientEmail || invoice.restaurant?.contact_email;
        if (!email) {
            throw new Error('No email address available');
        }

        // Get email template
        const { data: templateData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'email_template_invoice_v2')
            .single();

        const template = templateData?.value || {};
        
        // Prepare invoice data for email
        const invoiceData = createInvoiceData({
            transaction: {
                id: invoice.subscription_history_id,
                created_at: invoice.invoice_date,
                amount_paid: invoice.total_amount,
                gst_amount: invoice.total_tax,
                plan_name: invoice.line_items?.[0]?.name?.replace('TableTap ', '') || 'Professional',
                billing_cycle: invoice.line_items?.[0]?.description?.replace(' Subscription', '') || 'Monthly',
                payment_reference: invoice.payment_reference
            },
            restaurant: invoice.customer_snapshot || invoice.restaurant,
            subscription: invoice.subscription,
            invoiceNumber: invoice.invoice_number,
            companyDetails: invoice.company_snapshot
        });

        // Generate HTML for attachment/preview
        const invoiceHTML = generateProfessionalInvoiceHTML(invoiceData);

        // Prepare email variables
        const vars = {
            invoice_number: invoice.invoice_number,
            date: new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
            }),
            restaurant_name: invoice.customer_snapshot?.name || invoice.restaurant?.name,
            plan_name: invoice.line_items?.[0]?.name || 'Professional',
            billing_cycle: invoice.line_items?.[0]?.description?.replace(' Subscription', '') || 'Monthly',
            subtotal: (invoice.subtotal || 0).toFixed(2),
            gst: (invoice.total_tax || 0).toFixed(2),
            total_paid: (invoice.total_amount || 0).toFixed(2),
            year: new Date().getFullYear()
        };

        // Replace template variables
        let subject = template.subject || `Invoice ${invoice.invoice_number} from TableTap`;
        let html = template.html || `<p>Your invoice is attached.</p>`;

        Object.keys(vars).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, vars[key] || '');
            html = html.replace(regex, vars[key] || '');
        });

        // Send email via edge function
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
                to: email,
                subject: subject,
                html: html,
                text: `Invoice ${invoice.invoice_number} for ₹${invoice.total_amount}`,
                // attachments: [{ content: invoiceHTML, filename: `Invoice-${invoice.invoice_number}.html` }]
            }
        });

        if (emailError) throw emailError;

        // Update invoice email status
        await updateInvoiceEmailStatus(invoiceId, email);

        return { data: { success: true, email }, error: null };
    } catch (error) {
        console.error('Error sending invoice email:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Get company details from system settings
 */
export const getCompanyDetails = async () => {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'company_details')
            .single();

        if (error) throw error;
        return { data: data?.value, error: null };
    } catch (error) {
        console.error('Error fetching company details:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Update company details
 */
export const updateCompanyDetails = async (details) => {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .upsert({
                key: 'company_details',
                value: details,
                category: 'general',
                is_public: false,
                description: 'Company details for invoices and legal documents'
            }, { onConflict: 'key' })
            .select()
            .single();

        if (error) throw error;
        return { data: data?.value, error: null };
    } catch (error) {
        console.error('Error updating company details:', error);
        return { data: null, error: error.message };
    }
};

export default {
    getRestaurantInvoices,
    getInvoiceById,
    getInvoiceByNumber,
    getAllInvoices,
    createInvoice,
    updateInvoiceEmailStatus,
    voidInvoice,
    getInvoiceStats,
    generateInvoiceFromHistory,
    sendInvoiceEmail,
    getCompanyDetails,
    updateCompanyDetails
};
