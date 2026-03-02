import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../shared/supabase';

const AdminNotificationContext = createContext();

// Notification types for admin
export const NOTIFICATION_TYPES = {
  // Inquiry notifications
  NEW_INQUIRY: 'new_inquiry',
  INQUIRY_CONVERTED: 'inquiry_converted',

  // Registration notifications
  NEW_REGISTRATION: 'new_registration',
  REGISTRATION_APPROVED: 'registration_approved',
  REGISTRATION_REJECTED: 'registration_rejected',

  // Subscription notifications
  NEW_SUBSCRIPTION: 'new_subscription',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',

  // Restaurant notifications
  NEW_RESTAURANT: 'new_restaurant',
  RESTAURANT_ACTIVATED: 'restaurant_activated',
  RESTAURANT_DEACTIVATED: 'restaurant_deactivated',

  // Staff notifications
  NEW_STAFF: 'new_staff',
  STAFF_CONNECTED: 'staff_connected',

  // Feature notifications
  AI_ENABLED: 'ai_enabled',
  AI_DISABLED: 'ai_disabled',
  AGGREGATORS_ENABLED: 'aggregators_enabled',
  AGGREGATORS_DISABLED: 'aggregators_disabled',

  // Payment notifications
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',

  // Email notifications
  EMAIL_SENT: 'email_sent',
  EMAIL_FAILED: 'email_failed'
};

export const AdminNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch all admin notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data: adminNotifications, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching admin notifications:', error);
        return;
      }

      setNotifications(adminNotifications || []);
      setUnreadCount((adminNotifications || []).filter(n => !n.read).length);
    } catch (error) {
      console.error('Catch error in fetchNotifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Local update for immediate UI feedback
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark notification as unread
  const markAsUnread = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: false, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Local update
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
      );
      setUnreadCount(prev => prev + 1);
    } catch (error) {
      console.error('Error marking as unread:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Clear old read notifications (keep last 30 days)
  const clearOldNotifications = async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      await supabase
        .from('admin_notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('read', true);
    } catch (error) {
      // Ignore
    }
  };

  // Real-time listener for admin_notifications table
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    const channel = supabase
      .channel('admin_notifications_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'admin_notifications'
      }, payload => {
        if (payload.eventType === 'INSERT') {
          const newNotif = payload.new;
          setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)].slice(0, 100));
          setUnreadCount(prev => prev + 1);
        } else if (payload.eventType === 'UPDATE') {
          const updatedNotif = payload.new;
          setNotifications(prev => {
            const exists = prev.find(n => n.id === updatedNotif.id);
            if (!exists) return [updatedNotif, ...prev].slice(0, 100);
            return prev.map(n => n.id === updatedNotif.id ? updatedNotif : n);
          });

          // Re-calculate unread count by inspecting the full notifications list after it's updated 
          // or just trigger a fetch if we want to be perfectly accurate across clients
          // but let's try a simpler update:
          setUnreadCount(prev => {
            // we'll actually fetch to be safe as unread count is important
            return prev; // placeholders because we'll add a separate effect for count sync if needed
          });
          // Better: just fetch unread count again if it's an update
          fetchNotifications();
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          fetchNotifications();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);
  // Wait, notifications in dependency array might cause infinite loop if setNotifications is called.
  // Actually, for UPDATE it's safe if we check values. 
  // But let's use the functional update pattern for everything and remove notifications from refs.

  return (
    <AdminNotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      fetchNotifications,
      refreshNotifications: fetchNotifications,
      clearOldNotifications,
      NOTIFICATION_TYPES
    }}>
      {children}
    </AdminNotificationContext.Provider>
  );
};

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
  }
  return context;
};
