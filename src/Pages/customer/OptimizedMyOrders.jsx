import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Filter, RefreshCw, Clock, CheckCircle, XCircle, Package, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import { OptimizedPageWrapper, itemVariants, staggerContainer } from '../../components/customer/OptimizedPageWrapper';
import { usePerformanceMonitor } from '../../hooks/usePerformance';
import { useThrottle } from '../../hooks/usePerformance';

const OptimizedMyOrders = memo(() => {
  const navigate = useNavigate();
  
  // Performance monitoring
  usePerformanceMonitor('MyOrders');
  
  // State management
  const [activeTab, setActiveTab] = useState('pending');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const { userOrders, fetchUserOrders, loading, error } = useOrders();
  
  // Throttled refresh function
  const throttledRefresh = useThrottle(() => {
    handleFetchOrders(true);
  }, 2000);

  // Fetch orders with better error handling
  const handleFetchOrders = useCallback(async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) {
      setIsRefreshing(true);
    }
    
    try {
      await fetchUserOrders();
      setLastRefresh(new Date());
    } catch (err) {
    } finally {
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
      
      if (showRefreshAnimation) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, [fetchUserOrders, isInitialLoad]);

  // Initial load and polling setup
  useEffect(() => {
    handleFetchOrders();
    
    // Polling for updates (every 30 seconds)
    const interval = setInterval(() => handleFetchOrders(), 30000);
    
    return () => clearInterval(interval);
  }, [handleFetchOrders]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    throttledRefresh();
  }, [throttledRefresh]);

  // Tab change handler
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setExpandedOrderId(null);
  }, []);

  // Order card click handler
  const handleOrderClick = useCallback((orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  }, [expandedOrderId]);

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = userOrders.filter(order => {
      if (filterStatus === 'all') return true;
      return order.status === filterStatus;
    });
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [userOrders, filterStatus, sortBy]);

  // Status configuration
  const statusConfig = useMemo(() => ({
    pending: {
      icon: <Clock className="w-5 h-5 text-yellow-500" />,
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      label: 'Pending'
    },
    preparing: {
      icon: <Package className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      label: 'Preparing'
    },
    ready: {
      icon: <Truck className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      label: 'Ready'
    },
    completed: {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      color: 'bg-green-50 text-green-700 border-green-200',
      label: 'Completed'
    },
    rejected: {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      color: 'bg-red-50 text-red-700 border-red-200',
      label: 'Rejected'
    }
  }), []);

  // Empty state component
  const EmptyState = memo(({ status }) => {
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <motion.div 
        className="flex flex-col items-center justify-center py-12 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={`w-20 h-20 ${config.color} rounded-full flex items-center justify-center mb-4`}>
          {config.icon}
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          No {config.label.toLowerCase()} orders
        </h2>
        <p className="text-gray-500 text-center text-sm max-w-xs">
          Your {config.label.toLowerCase()} orders will appear here
        </p>
      </motion.div>
    );
  });

  // Order card component
  const OrderCard = memo(({ order }) => {
    const config = statusConfig[order.status] || statusConfig.pending;
    const isExpanded = expandedOrderId === order.id;
    
    return (
      <motion.div
        className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
        variants={itemVariants}
        layout
      >
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => handleOrderClick(order.id)}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${config.color}`}>
              {config.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Order #{order.id}</h3>
              <p className="text-sm text-gray-500">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-800">₹{order.total_amount}</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs ${config.color}`}>
              {config.label}
            </span>
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-gray-100"
            >
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-800">₹{item.price}</p>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">Total</span>
                    <span className="font-bold text-lg text-gray-800">₹{order.total_amount}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  });

  const handleRetry = useCallback(() => {
    handleFetchOrders(true);
  }, [handleFetchOrders]);

  return (
    <OptimizedPageWrapper
      title="My Orders"
      showBackButton
      onBack={() => navigate('/home')}
      loading={loading && isInitialLoad}
      error={error}
      onRetry={handleRetry}
    >
      <motion.div 
        className="bg-white rounded-t-[30px] flex-1 p-6"
        variants={itemVariants}
      >
        {/* Header with refresh */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-orange-500 transition-colors disabled:opacity-50"
            aria-label="Refresh orders"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Object.entries(statusConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filterStatus === key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort controls */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {filteredAndSortedOrders.length} order{filteredAndSortedOrders.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-orange-500 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Sort: {sortBy === 'newest' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>

        {/* Orders list */}
        <div className="flex-1">
          {filteredAndSortedOrders.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {filteredAndSortedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </motion.div>
          ) : (
            <EmptyState status={filterStatus} />
          )}
        </div>

        {/* Last updated indicator */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
      </motion.div>
    </OptimizedPageWrapper>
  );
});

OptimizedMyOrders.displayName = 'OptimizedMyOrders';

export default OptimizedMyOrders; 