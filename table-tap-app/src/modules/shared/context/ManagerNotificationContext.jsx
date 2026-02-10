import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../shared/supabase';
import {
  getManagerNotifications,
  getUnreadManagerNotifications,
  markAllManagerNotificationsAsRead,
  subscribeToManagerNotifications,
  markNotificationAsRead
} from '../api/notificationService';

import { useAdminRestaurant } from './AdminRestaurantContext';

const ManagerNotificationContext = createContext();

export const ManagerNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Use the robust restaurant resolution from AdminRestaurantContext
  const { userRestaurantId: restaurantId } = useAdminRestaurant();

  // Removed manual profile fetching effect as it's redundant and error-prone

  const fetchManagerNotifications = async () => {
    if (!restaurantId) return; // Don't fetch if no restaurant ID known yet
    const data = await getManagerNotifications(restaurantId);
    setNotifications(data);
  };

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.read && n.is_admin_notification).length;
    setUnreadCount(count);
  }, [notifications]);

  useEffect(() => {
    if (!restaurantId) return;

    fetchManagerNotifications();

    const subscription = subscribeToManagerNotifications((payload) => {
      if (payload.eventType === 'INSERT') {
        setNotifications(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setNotifications(prev =>
          prev.map(n => n.id === payload.new.id ? payload.new : n)
        );
      }
    }, restaurantId);

    return () => {
      subscription.unsubscribe();
    };
  }, [restaurantId]);

  const markAllAsRead = async () => {
    await markAllManagerNotificationsAsRead();
    await fetchManagerNotifications();
  };

  const markAsRead = async (notificationId) => {
    try {
      // Update local state first for instant UI feedback
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );

      // Perform API call
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // We don't necessarily want to revert state here if it's just a read status, 
      // but we could if we wanted it to be strictly consistent.
    }
  };

  return (
    <ManagerNotificationContext.Provider value={{
      notifications,
      unreadCount,
      refreshNotifications: fetchManagerNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </ManagerNotificationContext.Provider>
  );
};

export const useManagerNotifications = () => {
  const context = useContext(ManagerNotificationContext);
  if (!context) {
    throw new Error('useManagerNotifications must be used within a ManagerNotificationProvider');
  }
  return context;
};