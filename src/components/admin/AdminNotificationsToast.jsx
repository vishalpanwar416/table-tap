import React, { useEffect, useRef } from 'react';
import { useAdminNotifications } from '../../context/AdminNotificationContext';
import { Check, X, Info, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminNotificationsToast = () => {
  const { notifications, markAsRead, unreadCount } = useAdminNotifications();
  const audioRef = useRef(null);
  
  // Play sound when a new notification arrives
  useEffect(() => {
    if (unreadCount > 0 && audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error("Error playing notification sound:", error);
      });
    }
  }, [unreadCount]);

  // Handle quick actions for orders
  const handleOrderAction = async (orderId, action, notificationId) => {
    try {
      // Update order status
      await updateOrderStatus(orderId, action);
      // Mark notification as read
      markAsRead(notificationId);
    } catch (error) {
      console.error(`Error handling ${action} action:`, error);
    }
  };

  // Filter only unread admin notifications
  const unreadNotifications = notifications.filter(n => !n.read && n.is_admin_notification);

  return (
    <>
      {/* Hidden audio element for notification sound */}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto">
        Your browser does not support the audio element.
      </audio>
      
      {/* Notifications container with stacking */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50 max-h-[70vh] overflow-y-auto pr-2 flex flex-col-reverse">
        <AnimatePresence>
          {unreadNotifications.map((notification, index) => (
            <motion.div 
              key={notification.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-orange-500 w-80 mb-2"
              style={{ zIndex: 9999 - index }} // Ensure proper stacking
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-2">
                  <Bell className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-800">{notification.title}</h3>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => markAsRead(notification.id)}
                  className="text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 p-1"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {notification.order_details && (
                <div className="mb-3 text-sm bg-gray-50 p-2 rounded">
                  <p className="font-medium">Order Details:</p>
                  {notification.order_details.table && (
                    <p>Table {notification.order_details.table}</p>
                  )}
                  <p>Total: ₹{notification.order_details.total?.toFixed(2) || '0.00'}</p>
                  <p>{notification.order_details.items?.length || 0} items</p>
                </div>
              )}

              {notification.order_id && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleOrderAction(notification.order_id, 'preparing', notification.id)}
                    className="flex-1 bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600 text-sm font-medium transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleOrderAction(notification.order_id, 'rejected', notification.id)}
                    className="flex-1 bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 text-sm font-medium transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default AdminNotificationsToast;