// src/context/NotificationContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../config/AuthContext';
import { 
  getUserNotifications,
  getUnreadNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationService,
  subscribeToUserNotifications
} from '../api/notificationService';


const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user notifications when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Subscribe to new notifications
      const subscription = subscribeToUserNotifications(user.id, (newNotification) => {
        console.log('[Realtime] New notification received:', newNotification);
        // Add notification to state
        setNotifications(prev => [newNotification, ...prev]);
        
        // Increment unread count
        if (!newNotification.read) {
          setUnreadCount(prevCount => prevCount + 1);
          
          // Show browser notification
          showBrowserNotification(newNotification);
        }
      });
      
      if (subscription && subscription.on) {
        subscription.on('status', (status) => {
          console.log('[Supabase Realtime] Channel status:', status);
        });
      }
      console.log('[Realtime] Subscribed to notifications for user:', user.id);
      
      return () => {
        if (subscription) {
          subscription.unsubscribe();
          console.log('[Realtime] Unsubscribed from notifications for user:', user.id);
        }
      };
    }
  }, [user]);

  // Fetch user notifications from Supabase
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get all user notifications
      const userNotifications = await getUserNotifications(user.id);
      setNotifications(userNotifications);
      
      // Get unread count
      const unreadNotifications = await getUnreadNotifications(user.id);
      setUnreadCount(unreadNotifications.length);
      
      setError(null);
      console.log('[Debug] Notifications fetched:', userNotifications);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('[NotificationContext] Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      console.log('[Debug] Notification marked as read:', notificationId);
    } catch (err) {
      console.error('[NotificationContext] Error marking as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsAsRead(user.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const result = await deleteNotificationService(notificationId);
      
      if (result.success) {
        // Remove notification from local state
        setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
        
        // Update unread count if the deleted notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        console.log('[Debug] Notification deleted:', notificationId);
      }
    } catch (err) {
      console.error('[NotificationContext] Error deleting notification:', err);
    }
  };

  // Show browser notification if supported
  const showBrowserNotification = (notification) => {
    if (!("Notification" in window)) {
      return;
    }
    
    const showNotif = () => {
      const notificationTitle = notification.title || 'New Notification';
      const notificationBody = notification.message || 'You have a new notification';
      
      const notif = new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/logo.png', // Update with your app logo
      });

      notif.onclick = () => {
        window.focus();
        if (notification.order_id) {
          navigate(`/order-tracking/${notification.order_id}`);
        } else {
          navigate('/my-orders');
        }
      };
    };
    
    // Check if permission is granted
    if (Notification.permission === "granted") {
      showNotif();
    }
    // If permission is not denied, ask for it
    else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          showNotif();
        }
      });
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 9999, maxWidth: 400, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 12, padding: 8, borderRadius: 8, pointerEvents: 'auto' }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>[Debug] Notifications State</div>
          <pre style={{ maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{JSON.stringify(notifications, null, 2)}</pre>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};