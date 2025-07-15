import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ShoppingBag, Loader, Filter, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import OrderCard from '../../components/customer/OrderCard';
import { getActiveRestaurants } from '../Restaurantselection/restaurantSelectionService';
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
  { key: "pending", label: "Waiting Acceptance" },
  { key: "preparing", label: "In Preparation" },
  { key: "completed", label: "Order History" },
];

function SegmentedTabs({ activeTab, setActiveTab }) {
  // For indicator position/width
  const tabRefs = React.useRef([]);
  const [indicatorProps, setIndicatorProps] = React.useState({ left: 0, width: 0 });

  React.useEffect(() => {
    const idx = tabs.findIndex((t) => t.key === activeTab);
    const node = tabRefs.current[idx];
    if (node) {
      setIndicatorProps({
        left: node.offsetLeft,
        width: node.offsetWidth,
      });
    }
  }, [activeTab]);

  return (
    <div className="relative flex bg-gray-200 rounded-full p-1 w-fit mx-auto shadow-sm">
      {/* Sliding indicator */}
      <motion.div
        className="absolute top-0 left-0 h-full bg-gray-700 rounded-full z-0"
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          width: indicatorProps.width,
          left: indicatorProps.left,
        }}
      />
      {tabs.map((tab, idx) => (
        <button
          key={tab.key}
          ref={el => (tabRefs.current[idx] = el)}
          onClick={() => setActiveTab(tab.key)}
          className={`relative z-10 px-3 py-1 rounded-full font-medium transition-colors duration-200 text-xs
            ${activeTab === tab.key ? "text-white" : "text-gray-700"}
          `}
          style={{ minWidth: 0, whiteSpace: 'nowrap' }} // Ensures no wrapping
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

const statusComponents = {
  pending: {
    icon: (
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-yellow-50 flex items-center justify-center shadow-sm">
        <svg className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
    ),
    message: 'No pending orders',
    description: 'Your pending orders will appear here'
  },
  preparing: {
    icon: (
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-purple-50 flex items-center justify-center shadow-sm">
        <svg className="w-8 h-8 md:w-10 md:h-10 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v4M12 22v-4M6.314 6.314L4.9 4.9M17.686 6.314L19.1 4.9M6.314 17.69L4.9 19.1M17.686 17.69L19.1 19.1M12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"/>
        </svg>
      </div>
    ),
    message: 'No orders in preparation',
    description: 'Orders being prepared will appear here'
  },
  completed: {
    icon: (
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-50 flex items-center justify-center shadow-sm">
        <svg className="w-8 h-8 md:w-10 md:h-10 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
    ),
    message: 'No completed orders yet',
    description: 'Your order history will be displayed here'
  }
};

export default function MyOrders() {
  const [activeTab, setActiveTab] = useState("pending");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'oldest'
  const [restaurantMap, setRestaurantMap] = useState({});
  
  const navigate = useNavigate();
  const { userOrders, fetchUserOrders, loading, error } = useOrders();
  
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
        // Keep the refresh animation for at least 500ms to provide feedback
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, [fetchUserOrders, isInitialLoad]);

  // Initial load and polling setup
  useEffect(() => {
    handleFetchOrders();
    
    // Setting up polling for updates (WebSocket would be better in production)
    const interval = setInterval(() => handleFetchOrders(), 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [handleFetchOrders]);

  // Fetch all restaurants for mapping
  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const restaurants = await getActiveRestaurants();
        
        if (!restaurants || restaurants.length === 0) {
          setRestaurantMap({});
          return;
        }
        
        // Map restaurant_id to name
        const map = {};
        (restaurants || []).forEach(r => {
          if (r.id && r.name) {
            map[r.id] = r.name;
          }
        });
        setRestaurantMap(map);
      } catch (err) {
        setRestaurantMap({});
      }
    }
    fetchRestaurants();
  }, [userOrders]); // Re-fetch when orders change to ensure we have all restaurant IDs

  // Manual refresh handler for pull-to-refresh
  const handleManualRefresh = () => {
    handleFetchOrders(true);
  };

  // Show loading state only on initial load
  const showLoading = loading && isInitialLoad;

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setExpandedOrderId(null); // Reset expanded order when changing tabs
  };

  // Order card click handler
  const handleOrderClick = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortBy(sortBy === 'newest' ? 'oldest' : 'newest');
  };

  // Filter and sort orders based on active tab and sort preference
  const getFilteredAndSortedOrders = () => {
    // First filter by status
    const filtered = userOrders.filter(order => {
      switch(activeTab) {
        case 'pending': return order.status === 'pending';
        case 'preparing': return order.status === 'preparing';
        case 'completed': return ['completed', 'rejected', 'ready'].includes(order.status);
        default: return false;
      }
    });
    
    // Then sort by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };
  
  // Get orders for current tab
  const filteredOrders = getFilteredAndSortedOrders();

  // Empty state component
  const EmptyState = ({ tab }) => {
    const { icon, message, description } = statusComponents[tab];
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        {icon}
        <h2 className="text-lg md:text-xl font-semibold text-center text-gray-800 mt-5 mb-2">
          {message}
        </h2>
        <p className="text-gray-500 text-center text-sm max-w-xs">
          {description}
        </p>
      </div>
    );
  };

  // Loading spinner component
  if (showLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-opacity-20"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-orange-500 absolute top-0 left-0"></div>
          </div>
          <p className="text-white mt-4 text-lg font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Error display component
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md shadow-lg">
          <h3 className="text-red-600 text-xl font-semibold mb-2">Error Loading Orders</h3>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => handleFetchOrders(true)}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Format the "last updated" time
  const formatLastUpdated = () => {
    return lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-black">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        {/* Header */}
        <div className="w-full px-6 py-8 relative flex justify-center">
          <button 
            className="absolute left-4 top-8 text-orange-500"
            onClick={() => navigate('/home')}
            aria-label="Go back to home"
          >
            <ChevronLeft size={30} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-gray-100 text-3xl font-medium">
              My Orders
            </h1>
            <p className="text-gray-400 text-sm mt-1">Track and manage your food orders</p>
          </div>
        </div>

        {/* Main Content - Gray block with rounded top corners */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col bg-gray-200 rounded-t-3xl overflow-hidden min-h-[500px] px-6 pt-10 pb-6">
            {/* Tabs */}
            <div className="flex justify-center mb-6">
              <SegmentedTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            {/* Filter and Refresh Bar */}
            <div className="flex items-center justify-between mb-4 bg-white rounded-xl py-3 px-4 shadow-sm">
              <div className="flex items-center">
                <button 
                  onClick={toggleSortOrder}
                  className="flex items-center text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-200 transition-colors"
                >
                  <Filter size={14} className="mr-1.5" />
                  Sort: {sortBy === 'newest' ? 'New first' : 'Old first'}
                </button>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">
                  Updated: {formatLastUpdated()}
                </span>
                <button 
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Refresh orders"
                >
                  <RefreshCw 
                    size={16} 
                    className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} 
                  />
                </button>
              </div>
            </div>

            {/* Orders List - Scrollable area */}
            <div className="flex-1 bg-white rounded-xl p-4 overflow-y-auto shadow-sm" style={{ maxHeight: 'calc(100vh - 340px)' }}>
              <h2 className="text-black text-xl font-semibold mb-4">
                {activeTab === 'pending' ? 'Pending Orders' : 
                 activeTab === 'preparing' ? 'Orders in Preparation' : 'Order History'}
              </h2>
              
              {filteredOrders.length > 0 ? (
                <div className="space-y-4">
                  {filteredOrders.map(order => {
                    const restaurantName = restaurantMap[order.restaurant_id] || 'Unknown Restaurant';
                    return (
                      <OrderCard 
                        key={order.id}
                        order={order}
                        restaurantName={restaurantName}
                        isExpanded={expandedOrderId === order.id}
                        onClick={() => handleOrderClick(order.id)}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState tab={activeTab} />
              )}
            </div>

            {/* Order Summary */}
            <div className="mt-4 bg-white p-4 rounded-xl shadow-sm">
              <div className="flex items-center mb-3">
                <ShoppingBag size={20} className="text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
                  <p className="text-gray-600 text-xs md:text-sm mb-1">Pending</p>
                  <p className="text-xl md:text-2xl font-bold text-yellow-500">
                    {userOrders.filter(order => order.status === 'pending').length}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
                  <p className="text-gray-600 text-xs md:text-sm mb-1">Preparing</p>
                  <p className="text-xl md:text-2xl font-bold text-purple-500">
                    {userOrders.filter(order => order.status === 'preparing').length}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
                  <p className="text-gray-600 text-xs md:text-sm mb-1">Completed</p>
                  <p className="text-xl md:text-2xl font-bold text-green-500">
                    {userOrders.filter(order => ['completed', 'rejected', 'ready'].includes(order.status)).length}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Bottom Spacing */}
          </div>
        </div>
      </div>
    </div>
  );
};