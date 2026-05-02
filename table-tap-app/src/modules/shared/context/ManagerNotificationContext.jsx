import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../shared/supabase';
import {
  getManagerNotifications,
  getUnreadManagerNotifications,
  markAllManagerNotificationsAsRead,
  subscribeToManagerNotifications
} from '../api/notificationService';
import { useAdminRestaurant } from './AdminRestaurantContext';

const ManagerNotificationContext = createContext();

export const ManagerNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Use centralized restaurant context instead of re-fetching manually
  const { userRestaurantId } = useAdminRestaurant();
  const [restaurantId, setRestaurantId] = useState(null);

  // Sync internal state with AdminRestaurantContext
  useEffect(() => {
    if (userRestaurantId) {
      setRestaurantId(userRestaurantId);
    }
  }, [userRestaurantId]);

  const fetchManagerNotifications = async () => {
    if (!restaurantId) return; // Don't fetch if no restaurant ID known yet
    const data = await getManagerNotifications(restaurantId);
    setNotifications(data);
    const count = data.filter(n => !n.read && n.is_admin_notification).length;
    setUnreadCount(count);
  };

  useEffect(() => {
    if (!restaurantId) return;

    fetchManagerNotifications();

    const subscription = subscribeToManagerNotifications((payload) => {
      if (payload.eventType === 'INSERT') {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      } else if (payload.eventType === 'UPDATE') {
        setNotifications(prev =>
          prev.map(n => n.id === payload.new.id ? payload.new : n)
        );
        const count = notifications.filter(n => !n.read && n.is_admin_notification).length;
        setUnreadCount(count);
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

  return (
    <ManagerNotificationContext.Provider value={{
      notifications,
      unreadCount,
      refreshNotifications: fetchManagerNotifications,
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