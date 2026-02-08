import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../shared/supabase';
import {
  getManagerNotifications,
  getUnreadManagerNotifications,
  markAllManagerNotificationsAsRead,
  subscribeToManagerNotifications
} from '../api/notificationService';

const ManagerNotificationContext = createContext();

export const ManagerNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [restaurantId, setRestaurantId] = useState(null);

  // Fetch user's restaurant ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Try to get restaurant_id from metadata or profile
      // Assuming it's in user_metadata for now as per other parts of the app often do
      if (user?.user_metadata?.restaurant_id) {
        setRestaurantId(user.user_metadata.restaurant_id);
      } else {
        // Double check via profile table if needed, but for now rely on metadata first or context usage
        // If not found in metadata, we might need to fetch profile.
        // Let's try to fetch profile
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single();
          if (profile?.restaurant_id) setRestaurantId(profile.restaurant_id);
        }
      }
    };
    getUser();
  }, []);

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