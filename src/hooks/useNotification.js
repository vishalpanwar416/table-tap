// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../config/AuthContext';
import NotificationServiceuser from '../api/NotificationServiceuser';

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
      const { data, error } = await NotificationServiceuser.getUserNotifications(user.id);
      
      if (error) throw error;
      
      if (data) {
        const formattedNotifications = data.map(notif => 
          NotificationServiceuser.formatNotificationForDisplay(notif)
        );  
        setNotifications(formattedNotifications);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const { count, error } = await NotificationServiceuser.getUnreadCount(user.id);
      
      if (!error) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { success, error } = await NotificationServiceuser.markAsRead(notificationId);
      
      if (success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        await fetchUnreadCount();
        return { success: true };
      } else {
        throw new Error(error?.message || 'Failed to mark as read');
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  }, [fetchUnreadCount]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      const { success, error } = await NotificationServiceuser.markAllAsRead(user.id);
      
      if (success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
        return { success: true };
      } else {
        throw new Error(error?.message || 'Failed to mark all as read');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { success: false, error: err.message };
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const { success, error } = await NotificationServiceuser.deleteNotification(notificationId);
      
      if (success) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        await fetchUnreadCount();
        return { success: true };
      } else {
        throw new Error(error?.message || 'Failed to delete notification');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      return { success: false, error: err.message };
    }
  }, [fetchUnreadCount]);

  // Handle real-time notifications
  const handleRealtimeNotification = useCallback((event, notification) => {
    if (event === 'INSERT') {
      const formatted = NotificationServiceuser.formatNotificationForDisplay(notification);
      setNotifications(prev => [formatted, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico', // Add your app icon
          badge: '/favicon.ico'
        });
      }
    } else if (event === 'UPDATE') {
      const formatted = NotificationServiceuser.formatNotificationForDisplay(notification);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notification.id ? formatted : notif
        )
      );
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
    const subscription = NotificationServiceuser.subscribeToNotifications(
      user.id,
      handleRealtimeNotification
    );

    return () => {
      subscription?.unsubscribe();
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
    deleteNotification,
    refresh,
    requestNotificationPermission
  };
};