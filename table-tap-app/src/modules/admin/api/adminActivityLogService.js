import { supabase } from '../../shared/supabase';

/**
 * Admin Activity Log Service
 * Tracks all admin-level activities including automated emails, system events, etc.
 */

// Activity types
export const ACTIVITY_TYPES = {
  // Email activities
  EMAIL_SENT: 'email_sent',
  EMAIL_FAILED: 'email_failed',
  EMAIL_QUEUED: 'email_queued',

  // Subscription activities
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',

  // Restaurant activities
  RESTAURANT_CREATED: 'restaurant_created',
  RESTAURANT_UPDATED: 'restaurant_updated',
  RESTAURANT_DELETED: 'restaurant_deleted',
  RESTAURANT_ACTIVATED: 'restaurant_activated',
  RESTAURANT_DEACTIVATED: 'restaurant_deactivated',

  // Staff activities
  STAFF_CREATED: 'staff_created',
  STAFF_UPDATED: 'staff_updated',
  STAFF_DELETED: 'staff_deleted',

  // System activities
  SYSTEM_ALERT: 'system_alert',
  CRON_JOB: 'cron_job',
  AUTO_PROCESS: 'auto_process'
};

// Email types
export const EMAIL_TYPES = {
  BILL: 'bill',
  WELCOME: 'welcome',
  SUBSCRIPTION_CONFIRMATION: 'subscription_confirmation',
  SUBSCRIPTION_REMINDER: 'subscription_reminder',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  PAYMENT_RECEIPT: 'payment_receipt',
  PAYMENT_FAILED: 'payment_failed',
  PASSWORD_RESET: 'password_reset',
  REGISTRATION_APPROVED: 'registration_approved',
  REGISTRATION_REJECTED: 'registration_rejected',
  INQUIRY_RESPONSE: 'inquiry_response',
  INVOICE: 'invoice'
};

/**
 * Log an admin activity
 * @param {Object} logData - The activity log data
 */
export const logAdminActivity = async (logData) => {
  try {
    const { error } = await supabase
      .from('admin_activity_logs')
      .insert([{
        activity_type: logData.activity_type,
        activity_name: logData.activity_name,
        restaurant_id: logData.restaurant_id || null,
        user_id: logData.user_id || null,
        user_name: logData.user_name || 'System',
        target_type: logData.target_type || null, // 'email', 'subscription', 'restaurant', etc.
        target_id: logData.target_id || null,
        target_name: logData.target_name || null,
        status: logData.status || 'success', // success, failed, pending
        details: logData.details || {},
        description: logData.description,
        ip_address: logData.ip_address || null,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error logging admin activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Log an email activity
 * @param {Object} emailData - Email activity data
 */
export const logEmailActivity = async (emailData) => {
  try {
    const { error } = await supabase
      .from('admin_activity_logs')
      .insert([{
        activity_type: emailData.status === 'failed' ? ACTIVITY_TYPES.EMAIL_FAILED :
          emailData.status === 'queued' ? ACTIVITY_TYPES.EMAIL_QUEUED :
            ACTIVITY_TYPES.EMAIL_SENT,
        activity_name: `Email: ${emailData.email_type}`,
        restaurant_id: emailData.restaurant_id || null,
        user_id: emailData.triggered_by || null,
        user_name: emailData.triggered_by_name || 'System (Automated)',
        target_type: 'email',
        target_id: emailData.email_id || null,
        target_name: emailData.recipient_email,
        status: emailData.status || 'success',
        details: {
          email_type: emailData.email_type,
          recipient_email: emailData.recipient_email,
          recipient_name: emailData.recipient_name || null,
          subject: emailData.subject,
          template_used: emailData.template || null,
          amount: emailData.amount || null,
          order_id: emailData.order_id || null,
          subscription_id: emailData.subscription_id || null,
          error_message: emailData.error_message || null,
          retry_count: emailData.retry_count || 0,
          metadata: emailData.metadata || {}
        },
        description: emailData.description || `${emailData.email_type} email ${emailData.status === 'failed' ? 'failed to send' : emailData.status === 'queued' ? 'queued' : 'sent'} to ${emailData.recipient_email}`,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error logging email activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get admin activity logs with filters
 */
export const getAdminActivityLogs = async (filters = {}, page = 1, pageSize = 50) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('admin_activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // Apply filters
    if (filters.activity_type) {
      query = query.eq('activity_type', filters.activity_type);
    }
    if (filters.restaurant_id) {
      query = query.eq('restaurant_id', filters.restaurant_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.target_type) {
      query = query.eq('target_type', filters.target_type);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters.search) {
      query = query.or(`description.ilike.%${filters.search}%,target_name.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data, count, error: null };
  } catch (error) {
    return { data: null, count: 0, error: error.message };
  }
};

/**
 * Get email activity logs specifically
 */
export const getEmailActivityLogs = async (filters = {}, page = 1, pageSize = 50) => {
  return getAdminActivityLogs({
    ...filters,
    target_type: 'email'
  }, page, pageSize);
};

/**
 * Get activity statistics
 */
export const getActivityStats = async (days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select('activity_type, status, created_at')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Calculate stats
    const stats = {
      total: data.length,
      emails: {
        sent: data.filter(d => d.activity_type === ACTIVITY_TYPES.EMAIL_SENT).length,
        failed: data.filter(d => d.activity_type === ACTIVITY_TYPES.EMAIL_FAILED).length,
        queued: data.filter(d => d.activity_type === ACTIVITY_TYPES.EMAIL_QUEUED).length
      },
      subscriptions: {
        created: data.filter(d => d.activity_type === ACTIVITY_TYPES.SUBSCRIPTION_CREATED).length,
        renewed: data.filter(d => d.activity_type === ACTIVITY_TYPES.SUBSCRIPTION_RENEWED).length,
        cancelled: data.filter(d => d.activity_type === ACTIVITY_TYPES.SUBSCRIPTION_CANCELLED).length,
        expired: data.filter(d => d.activity_type === ACTIVITY_TYPES.SUBSCRIPTION_EXPIRED).length
      },
      byStatus: {
        success: data.filter(d => d.status === 'success').length,
        failed: data.filter(d => d.status === 'failed').length,
        pending: data.filter(d => d.status === 'pending').length
      }
    };

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get email types for filtering
 */
export const getEmailTypes = () => {
  return Object.entries(EMAIL_TYPES).map(([key, value]) => ({
    key,
    value,
    label: value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }));
};

export default {
  logAdminActivity,
  logEmailActivity,
  getAdminActivityLogs,
  getEmailActivityLogs,
  getActivityStats,
  getEmailTypes,
  ACTIVITY_TYPES,
  EMAIL_TYPES
};
