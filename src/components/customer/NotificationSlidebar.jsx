import React, { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, UtensilsCrossed, Heart, ShoppingBag, Bike, CheckCircle, XCircle, AlertCircle, Trash2, X, Settings } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const typeIcons = {
  order_received: <ShoppingBag className="w-5 h-5 text-blue-300" />,
  order_accepted: <CheckCircle className="w-5 h-5 text-green-300" />,
  order_preparing: <UtensilsCrossed className="w-5 h-5 text-yellow-300" />,
  order_ready: <Bike className="w-5 h-5 text-purple-300" />,
  order_rejected: <XCircle className="w-5 h-5 text-red-300" />,
  payment_success: <CheckCircle className="w-5 h-5 text-green-300" />,
  payment_failed: <AlertCircle className="w-5 h-5 text-red-300" />,
  default: <Bell className="w-5 h-5 text-gray-300" />
};

// Helper: is Notification API supported?
const isNotificationSupported = () => typeof window !== 'undefined' && 'Notification' in window;

const NotificationSidebar = ({ 
  isOpen,
  onClose,
  headerIcon = <Bell className="w-6 h-6 " />,
  title = "Notifications"
}) => {
  const sidebarRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Use real notifications
  const { notifications, markAsRead, deleteNotification, unreadCount } = useNotifications();
  
  // Browser notification state
  const [notificationPermission, setNotificationPermission] = useState(isNotificationSupported() ? Notification.permission : 'unsupported');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // Swipe detection
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50; // Minimum swipe distance
    const swipeDistance = touchEndX.current - touchStartX.current;
    if (swipeDistance > swipeThreshold) {
      onClose();
    }
  }, [onClose]);

  // Add keyboard support for escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!isNotificationSupported()) {
      alert('This browser does not support notifications');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setShowPermissionPrompt(false);
      if (permission === 'granted') {
        // Show a test notification
        new Notification('Notifications Enabled!', {
          body: 'You will now receive notifications for order updates.',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      }
    } catch (error) {
    }
  };

  // Show permission prompt if needed
  useEffect(() => {
    if (isOpen && notificationPermission === 'default') {
      setShowPermissionPrompt(true);
    } else {
      setShowPermissionPrompt(false);
    }
  }, [isOpen, notificationPermission]);

  const slideVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { 
      x: '100%', 
      opacity: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 40,
        duration: 0.4
      } 
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 0.3,
        ease: 'easeOut'
      } 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            ref={sidebarRef}
            key="notification-content"
            className="fixed top-0 right-0 h-full w-full z-50 rounded-l-[80px] overflow-hidden"
            style={{ maxWidth: '70%' }}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Enhanced glassy background with multiple layers */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/5 to-transparent"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <div className="absolute inset-0 rounded-l-[80px] border border-white/20 shadow-2xl"></div>
            <div className="absolute inset-1 rounded-l-[75px] border border-white/10"></div>
            {/* Main content */}
            <div className="relative h-full flex flex-col">
              <div className="pt-16 pb-4 px-6 flex items-center justify-between border-b border-white/20">
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-white/30 backdrop-blur-md rounded-full p-3 border border-white/30 shadow-xl">
                    {headerIcon}
                  </div>
                  <h2 className="text-2xl font-bold text-white text-center drop-shadow-lg">{title} <span className="ml-2 text-base font-normal text-blue-200">({unreadCount})</span></h2>
                </div>
                <div className="flex items-center gap-2">
                  {isNotificationSupported() && notificationPermission === 'default' && (
                    <button
                      onClick={requestNotificationPermission}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 p-2 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-all backdrop-blur-md"
                      title="Enable browser notifications"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm('Clear all notifications?')) {
                          notifications.forEach(notif => deleteNotification(notif.id));
                        }
                      }}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 p-2 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-all backdrop-blur-md"
                      title="Clear all notifications"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="py-4 flex-1 overflow-y-auto">
                {showPermissionPrompt && isNotificationSupported() && (
                  <div className="px-6 py-4 mb-4">
                    <div className="bg-blue-500/20 backdrop-blur-md rounded-lg border border-blue-500/30 p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Bell className="w-5 h-5 text-blue-300" />
                        <h3 className="text-white font-semibold">Enable Notifications</h3>
                      </div>
                      <p className="text-white/80 text-sm mb-3">
                        Get notified about your order status updates even when the app is closed.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={requestNotificationPermission}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Enable
                        </button>
                        <button
                          onClick={() => setShowPermissionPrompt(false)}
                          className="bg-gray-500/20 hover:bg-gray-500/30 text-white/80 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Later
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {notifications.length === 0 ? (
                  <div className="px-6 py-8 text-center text-white/70">No notifications yet.</div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-6 py-4 border-b border-white/20 transition-all ${!notification.read ? 'bg-blue-900/20' : ''}`}
                    >
                      <div className="flex items-center p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all shadow-lg">
                        <div className="bg-white/30 backdrop-blur-md rounded-md p-3 mr-4 border border-white/30 shadow-xl">
                          {typeIcons[notification.type] || typeIcons.default}
                        </div>
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => !notification.read && markAsRead(notification.id)}
                        >
                          <p className="text-white font-semibold drop-shadow-sm mb-1">{notification.title}</p>
                          <p className="text-white/90 text-sm mb-1">{notification.message}</p>
                          <span className="text-xs text-white/60">{new Date(notification.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Delete this notification?')) {
                                deleteNotification(notification.id);
                              }
                            }}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 p-1.5 rounded-md border border-red-500/30 hover:border-red-500/50 transition-all backdrop-blur-md"
                            title="Delete notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
          <motion.div
            key="notification-overlay"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationSidebar;