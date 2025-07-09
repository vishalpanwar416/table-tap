import React, { useRef, useCallback, useEffect } from 'react';
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
  const sidebarRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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
    
    // If swiped right (positive distance) and distance is significant
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
            
            {/* Glass effect layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/5 to-transparent"></div>
            
            {/* Additional glass highlights */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            {/* Border glow effect */}
            <div className="absolute inset-0 rounded-l-[80px] border border-white/20 shadow-2xl"></div>
            
            {/* Inner glass border */}
            <div className="absolute inset-1 rounded-l-[75px] border border-white/10"></div>
            
            {/* Main content */}
            <div className="relative h-full flex flex-col">
              <div className="pt-16 pb-4 px-6 flex items-center justify-center border-b border-white/20">
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-white/30 backdrop-blur-md rounded-full p-3 border border-white/30 shadow-xl">
                    {headerIcon}
                  </div>
                  <h2 className="text-2xl font-bold text-white text-center drop-shadow-lg">{title}</h2>
                </div>
              </div>
              
              <div className="py-4 flex-1 overflow-y-auto">
                {notifications.map((notification, index) => (
                  <div key={index} className="px-6 py-4 border-b border-white/20">
                    <div className="flex items-center p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all shadow-lg">
                      <div className="bg-white/30 backdrop-blur-md rounded-md p-3 mr-4 border border-white/30 shadow-xl">
                        {notification.icon}
                      </div>
                      <p className="text-white drop-shadow-sm">{notification.message}</p>
                    </div>
                  </div>
                ))}
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