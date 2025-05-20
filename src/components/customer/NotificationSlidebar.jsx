import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, UtensilsCrossed, Heart, ShoppingBag, Bike } from 'lucide-react';

const NotificationSidebar = ({ 
  isOpen,
  onClose,
  notifications = [
    {
      icon: <UtensilsCrossed className="w-5 h-5 text-gray-300" />,
      message: "We have added a product you might like."
    },
    {
      icon: <Heart className="w-5 h-5 text-gray-300" />,
      message: "One of your favorite is on promotion."
    },
    {
      icon: <ShoppingBag className="w-5 h-5 text-gray-300" />,
      message: "Your order has been delivered"
    },
    {
      icon: <Bike className="w-5 h-5 text-gray-300" />,
      message: "The delivery is on his way"
    }
  ],
  headerIcon = <Bell className="w-6 h-6 " />,
  title = "Notifications"
}) => {
  const slideVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { x: '100%', opacity: 0, transition: { duration: 0.3 } }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="notification-content"
            className="fixed top-1 right-0 h-full w-full bg-black z-50 rounded-l-[80px] overflow-hidden"
            style={{ maxWidth: '70%' }}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="pt-16 pb-4 px-6 flex items-center justify-center border-b border-gray-700">
              <div className="flex items-center justify-center gap-3">
                  {headerIcon}
                  <h2 className="text-2xl font-bold text-white text-center">{title}</h2>
              </div>
            </div>
            
            <div className="py-4">
              {notifications.map((notification, index) => (
                <div key={index} className="px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center">
                    <div className="bg-gray-800 rounded-md p-3 mr-4">
                      {notification.icon}
                    </div>
                    <p className="text-white">{notification.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            key="notification-overlay"
            className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
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