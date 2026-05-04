// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../shared/config/AuthContext';
import { supabase } from '../supabase';
import {
  getUserNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  formatNotificationForDisplay,
  subscribeToUserNotifications,
} from '../api/notificationService';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getUserNotifications(user.id);

      if (data) {
        const formattedNotifications = data.map((notif) => formatNotificationForDisplay(notif));
        setNotifications(formattedNotifications);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const unreadData = await getUnreadNotifications(user.id);
      setUnreadCount(unreadData.length);
    } catch (err) {}
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        await markNotificationAsRead(notificationId);

        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)),
        );
        await fetchUnreadCount();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [fetchUnreadCount],
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await markAllNotificationsAsRead(user.id);

      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      setUnreadCount(0);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [user]);

  // Delete notification
  const deleteNotificationHandler = useCallback(
    async (notificationId) => {
      try {
        const result = await deleteNotification(notificationId);

        if (result.success) {
          setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
          await fetchUnreadCount();
          return { success: true };
        } else {
          throw new Error(result.error?.message || 'Failed to delete notification');
        }
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [fetchUnreadCount],
  );

  // Handle real-time notifications
  const handleRealtimeNotification = useCallback((notification) => {
    const formatted = formatNotificationForDisplay(notification);
    setNotifications((prev) => [formatted, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Show browser notification if permission is granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico', // Add your app icon
        badge: '/favicon.ico',
      });
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    fetchUnreadCount();

    // Subscribe to real-time notifications
    const subscription = subscribeToUserNotifications(user.id, handleRealtimeNotification);

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [user, fetchNotifications, fetchUnreadCount, handleRealtimeNotification]);

  // Refresh notifications
  const refresh = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotificationHandler,
    refresh,
    requestNotificationPermission,
  };
};
