// src/api/NotificationServiceuser.js
import { supabase } from '../supabase';

class NotificationServiceuser {
  // Get user notifications
  static async getUserNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get unread count
  static async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error) {
      return { count: 0, error };
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Delete notification
  static async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Format notification for display
  static formatNotificationForDisplay(notification) {
    return {
      id: notification.id,
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'order_received',
      read: notification.read || false,
      created_at: notification.created_at,
      updated_at: notification.updated_at,
      order_id: notification.order_id,
      user_id: notification.user_id,
      metadata: notification.metadata || {},
      is_admin_notification: notification.is_admin_notification || false
    };
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(userId, callback) {
    return supabase
      .channel(`user-notifications-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        callback(payload.eventType, payload.new);
      })
      .subscribe();
  }

  // Create notification
  static async createNotification(notificationData) {
    try {
      // Validate notification type
      const allowedTypes = [
        'order_received',
        'order_accepted', 
        'order_preparing',
        'order_ready',
        'order_rejected',
        'payment_success',
        'payment_failed'
      ];
      
      if (!allowedTypes.includes(notificationData.type)) {
        throw new Error(`Invalid notification type. Must be one of: ${allowedTypes.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...notificationData,
          read: notificationData.read || false,
          is_admin_notification: notificationData.is_admin_notification || false,
          metadata: notificationData.metadata || {}
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

export default NotificationServiceuser; 