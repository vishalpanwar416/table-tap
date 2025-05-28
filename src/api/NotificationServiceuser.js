// src/services/NotificationService.js
import { supabase } from '../supabase';

class NotificationServiceuser {
  // Fetch notifications for a specific user
  static async getUserNotifications(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          message,
          type,
          read,
          created_at,
          metadata,
          order_id,
          orders (
            id,
            total_amount,
            status
          )
        `)
        .eq('user_id', userId)
        .eq('is_admin_notification', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { data: null, error };
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error };
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error };
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)
        .eq('is_admin_notification', false);

      if (error) throw error;
      return { count, error: null };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { count: 0, error };
    }
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(userId, callback) {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback('INSERT', payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback('UPDATE', payload.new);
        }
      )
      .subscribe();

    return subscription;
  }

  // Create notification (for testing purposes)
  static async createNotification({
    userId,
    orderId = null,
    title,
    message,
    type,
    metadata = {}
  }) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          order_id: orderId,
          title,
          message,
          type,
          metadata,
          is_admin_notification: false
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { data: null, error };
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
      console.error('Error deleting notification:', error);
      return { success: false, error };
    }
  }

  // Helper method to format notification display data
  static formatNotificationForDisplay(notification) {
    const typeConfig = {
      order_received: {
        icon: '🛒',
        color: 'bg-blue-500',
        iconBg: 'bg-blue-100',
        priority: 'medium'
      },
      order_accepted: {
        icon: '✅',
        color: 'bg-green-500',
        iconBg: 'bg-green-100',
        priority: 'high'
      },
      order_preparing: {
        icon: '👨‍🍳',
        color: 'bg-orange-500',
        iconBg: 'bg-orange-100',
        priority: 'high'
      },
      order_ready: {
        icon: '🎉',
        color: 'bg-purple-500',
        iconBg: 'bg-purple-100',
        priority: 'urgent'
      },
      order_rejected: {
        icon: '❌',
        color: 'bg-red-500',
        iconBg: 'bg-red-100',
        priority: 'urgent'
      },
      payment_success: {
        icon: '💳',
        color: 'bg-green-500',
        iconBg: 'bg-green-100',
        priority: 'medium'
      },
      payment_failed: {
        icon: '⚠️',
        color: 'bg-red-500',
        iconBg: 'bg-red-100',
        priority: 'urgent'
      }
    };

    const config = typeConfig[notification.type] || {
      icon: '📱',
      color: 'bg-gray-500',
      iconBg: 'bg-gray-100',
      priority: 'low'
    };

    return {
      ...notification,
      displayConfig: config,
      timeAgo: this.getTimeAgo(notification.created_at),
      formattedDate: new Date(notification.created_at).toLocaleDateString(),
      orderAmount: notification.orders?.total_amount
    };
  }

  // Helper method to calculate time ago
  static getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }
}

export default NotificationServiceuser;