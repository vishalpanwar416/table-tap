import React, { createContext, useContext, useState, useEffect } from 'react';
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

  const fetchManagerNotifications = async () => {
    const data = await getManagerNotifications();
    setNotifications(data);
    const count = data.filter(n => !n.read && n.is_manager_notification).length;
    setUnreadCount(count);
  };

  useEffect(() => {
    fetchManagerNotifications();

    const subscription = subscribeToManagerNotifications((payload) => {
      if (payload.eventType === 'INSERT') {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      } else if (payload.eventType === 'UPDATE') {
        setNotifications(prev => 
          prev.map(n => n.id === payload.new.id ? payload.new : n)
        );
        const count = notifications.filter(n => !n.read && n.is_manager_notification).length;
        setUnreadCount(count);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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