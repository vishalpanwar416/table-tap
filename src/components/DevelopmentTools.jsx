import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Trash2, Wifi, WifiOff, Settings, X } from 'lucide-react';
import { devHelpers } from '../utils/serviceWorkerRegistration';

const DevelopmentTools = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleForceRefresh = () => {
    setLastRefresh(new Date());
    devHelpers.forceRefresh();
  };

  const handleClearCaches = () => {
    devHelpers.clearCaches();
  };

  const handleUnregisterSW = () => {
    devHelpers.unregisterSW();
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        className="fixed bottom-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-full shadow-lg z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsVisible(!isVisible)}
      >
        <Settings className="h-5 w-5" />
      </motion.button>

      {/* Development panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-20 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[280px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Dev Tools</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {isOnline ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
            </div>

            {/* Cache info */}
            {lastRefresh && (
              <div className="text-xs text-gray-500 mb-3">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              <motion.button
                onClick={handleForceRefresh}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="h-4 w-4" />
                Force Refresh
              </motion.button>

              <motion.button
                onClick={handleClearCaches}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 className="h-4 w-4" />
                Clear Caches
              </motion.button>

              <motion.button
                onClick={handleUnregisterSW}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-800 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Settings className="h-4 w-4" />
                Unregister SW
              </motion.button>
            </div>

            {/* Info */}
            <div className="mt-3 text-xs text-gray-500 text-center">
              Development mode active
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DevelopmentTools; 