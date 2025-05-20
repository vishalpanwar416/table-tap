import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  getAdminNotifications, 
  markNotificationAsRead, 
  markAllAdminNotificationsAsRead,
  subscribeToAdminNotifications
} from '../api/notificationService';
import { updateOrderStatus as updateOrderStatusService } from '../api/orderService';

const AdminNotificationContext = createContext();

export const AdminNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastNotificationTime, setLastNotificationTime] = useState(null);

  // Fetch notifications on mount
  useEffect(() => {
    fetchAdminNotifications();
  }, []);

  // Calculate unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.read && n.is_admin_notification).length;
    setUnreadCount(count);
  }, [notifications]);

  // Fetch admin notifications
  const fetchAdminNotifications = async () => {
    try {
      setLoading(true);
      const data = await getAdminNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to new notifications
  useEffect(() => {
    const subscription = subscribeToAdminNotifications((newNotification) => {
      // Add new notification to state
      setNotifications(prev => [newNotification, ...prev]);
      
      // Update last notification time for sound triggering
      setLastNotificationTime(new Date().toISOString());
      
      // Play notification sound (handled in component)
    });
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await markAllAdminNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Update order status (connected to order service)
  const updateOrderStatus = async (orderId, status) => {
    try {
      const updatedOrder = await updateOrderStatusService(orderId, status);
      return updatedOrder;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    lastNotificationTime,
    fetchAdminNotifications,
    markAsRead,
    markAllAsRead,
    updateOrderStatus
  };

  return (
    <AdminNotificationContext.Provider value={value}>
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