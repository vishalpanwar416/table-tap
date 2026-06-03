import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import {
  getManagerNotifications,
  markAllManagerNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notificationService';
import { useAdminRestaurant } from './AdminRestaurantContext';

const ManagerNotificationContext = createContext();

export const ManagerNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userRestaurantId } = useAdminRestaurant();
  const channelRef = useRef(null);

  const fetchManagerNotifications = async (restaurantId) => {
    if (!restaurantId) return;
    const data = await getManagerNotifications(restaurantId);
    setNotifications(data);
    setUnreadCount(data.filter((n) => !n.read && n.is_admin_notification).length);
  };

  useEffect(() => {
    if (!userRestaurantId) return;

    fetchManagerNotifications(userRestaurantId);

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelId = `admin-notifications-${userRestaurantId}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `restaurant_id=eq.${userRestaurantId}`,
        },
        (payload) => {
          if (payload.new && !payload.new.is_admin_notification) return;
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new, ...prev]);
            setUnreadCount((prev) => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? payload.new : n)),
            );
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userRestaurantId]);

  const markAllAsRead = async () => {
    await markAllManagerNotificationsAsRead();
    await fetchManagerNotifications(userRestaurantId);
  };

  const markAsRead = async (notificationId) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <ManagerNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications: fetchManagerNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
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
