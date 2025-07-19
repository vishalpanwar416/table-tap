import React, { useState, useRef, useEffect, useMemo, useCallback, memo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../config/CartContent';
import Header from './Header';
import LogoutPopup from '../auth/LogoutPopup';
import FloatingCartButton from './FloatingCartButton';
import { useMultiScrollLock } from '../../hooks/useScrollLock';

// Lazy load heavy components
const Sidebar = lazy(() => import('./Slidebar'));
const CartSidebar = lazy(() => import('./CartSidebar'));
const NotificationSidebar = lazy(() => import('./NotificationSlidebar'));

// Optimized loading skeletons
const PageSkeleton = memo(() => (
  <div className="flex justify-center items-center min-h-screen bg-black">
    <div className="text-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p className="text-lg">Loading...</p>
    </div>
  </div>
));

const SidebarSkeleton = memo(() => (
  <div className="fixed inset-0 z-50 bg-black/50">
    <div className="fixed left-0 top-0 h-full w-80 bg-white animate-pulse">
      <div className="p-4 space-y-4">
        <div className="h-6 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
));

// Optimized animation variants with reduced motion support
const pageVariants = {
  initial: { 
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  animate: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.1 : 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.05 : 0.2,
      ease: "easeIn"
    }
  }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.1
    }
  }
};

const itemVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.9
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.1 : 0.4,
      ease: "easeOut"
    }
  }
};

const OptimizedPageWrapper = memo(({ 
  children, 
  title,
  showBackButton = false,
  onBack,
  showHeader = true,
  className = "",
  loading = false,
  error = null,
  onRetry,
  showPadding = true // Add new prop for conditional padding
}) => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem } = useCart();
  
  // State management
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const toggles = useMemo(() => ({
    search: () => setIsSearchActive(prev => !prev),
    sidebar: () => setIsSidebarOpen(prev => !prev),
    cart: () => setIsCartOpen(prev => !prev),
    notifications: () => setIsNotificationOpen(prev => !prev)
  }), []);

  const handleLogout = useCallback(() => {
    setIsLogoutOpen(false);
    setIsSidebarOpen(false);
    navigate('/login');
  }, [navigate]);

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black p-4">
        <div className="text-center text-white max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <PageSkeleton />;
  }

  // Lock scroll when any sidebar is open
  useMultiScrollLock({
    cart: isCartOpen,
    sidebar: isSidebarOpen,
    notifications: isNotificationOpen
  });

  return (
    <div className={`flex justify-center items-start min-h-screen bg-black ${showPadding ? 'p-4' : ''}`}>
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          className={`w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl mx-auto relative overflow-visible flex-col ${className}`}
        >
          {/* Modals and Sidebars */}
          <LogoutPopup 
            isOpen={isLogoutOpen}
            onClose={() => setIsLogoutOpen(false)}
            onConfirm={handleLogout}
          />
          
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <Suspense fallback={<SidebarSkeleton />}>
                <Sidebar
                  isSidebarOpen={isSidebarOpen}
                  toggleSidebar={toggles.sidebar}
                  onLogout={() => setIsLogoutOpen(true)}
                />
              </Suspense>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isNotificationOpen && (
              <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50" />}>
                <NotificationSidebar 
                  isOpen={isNotificationOpen}
                  onClose={toggles.notifications}
                />
              </Suspense>
            )}
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            {isCartOpen && (
              <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50" />}>
                <CartSidebar
                  isOpen={isCartOpen}
                  onClose={() => setIsCartOpen(false)}
                  cartItems={cartItems}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                />
              </Suspense>
            )}
          </AnimatePresence>

          {/* Header */}
          {showHeader && (
            <Header 
              isSearchActive={isSearchActive}
              toggleSearch={toggles.search}
              toggleSidebar={toggles.sidebar}
              toggleNotifications={toggles.notifications}
              toggleCart={toggles.cart}
              cartItems={cartItems}
              title={title}
              showBackButton={showBackButton}
              onBack={onBack}
              className="mb-2 md:mb-3"
            />
          )}

          {/* Main Content */}
          <motion.div 
            variants={staggerContainer}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </motion.div>
        
        <FloatingCartButton 
          toggleCart={toggles.cart}
          isCartOpen={isCartOpen}
          isSidebarOpen={isSidebarOpen}
          isNotificationOpen={isNotificationOpen}
        />
      </div>
    </div>
  );
});

OptimizedPageWrapper.displayName = 'OptimizedPageWrapper';

export { OptimizedPageWrapper, itemVariants, staggerContainer }; 