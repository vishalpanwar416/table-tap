import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ShoppingBag, Loader, Filter, RefreshCw, Search, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../shared/context/OrderContext';
import OrderCard from '../components/OrderCard';
import { getActiveRestaurants } from '../../restaurant/pages/RestaurantSelection/restaurantSelectionService';
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from '../../shared/components/LoadingScreen';

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
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
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
          <path d="M12 2v4M12 22v-4M6.314 6.314L4.9 4.9M17.686 6.314L19.1 4.9M6.314 17.69L4.9 19.1M17.686 17.69L19.1 19.1M12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" />
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
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
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

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all'); // 'all', 'online', 'upi', 'cash'
  const [filterDateRange, setFilterDateRange] = useState('all'); // 'all', 'today', 'week', 'month'
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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

  // Reset displayed count when search or filters change
  useEffect(() => {
    setDisplayedCount(10);
  }, [searchQuery, filterPaymentMethod, filterDateRange, sortBy]);

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
    setDisplayedCount(10); // Reset to show first 10 orders
  };

  // Order card click handler
  const handleOrderClick = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortBy(sortBy === 'newest' ? 'oldest' : 'newest');
  };

  // Filter and sort orders based on active tab, search, and filters
  const getFilteredAndSortedOrders = () => {
    // First filter by status
    let filtered = userOrders.filter(order => {
      switch (activeTab) {
        case 'pending': return order.status === 'pending';
        case 'preparing': return order.status === 'preparing';
        case 'completed': return ['completed', 'rejected', 'ready'].includes(order.status);
        default: return false;
      }
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const orderNumber = (order.order_number || '').toString().toLowerCase();
        const restaurantName = (restaurantMap[order.restaurant_id] || '').toLowerCase();
        const customerName = (order.customer_name || '').toLowerCase();
        const items = (order.items || []).map(item => (item.name || '').toLowerCase()).join(' ');

        return orderNumber.includes(query) ||
          restaurantName.includes(query) ||
          customerName.includes(query) ||
          items.includes(query);
      });
    }

    // Apply payment method filter
    if (filterPaymentMethod !== 'all') {
      filtered = filtered.filter(order => {
        const method = (order.payment_method || '').toLowerCase();
        if (filterPaymentMethod === 'online') return method.includes('razorpay') || method.includes('online');
        if (filterPaymentMethod === 'upi') return method.includes('upi');
        if (filterPaymentMethod === 'cash') return method.includes('cash') || method.includes('restaurant');
        return true;
      });
    }

    // Apply date range filter
    if (filterDateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        if (filterDateRange === 'today') {
          return orderDate.toDateString() === now.toDateString();
        }
        if (filterDateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        }
        if (filterDateRange === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        }
        return true;
      });
    }

    // Then sort by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  // Infinite scroll state
  const [displayedCount, setDisplayedCount] = useState(10); // Start with 10 orders
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Get filtered and sorted orders, then slice for infinite scroll
  const filteredOrders = getFilteredAndSortedOrders();
  const displayedOrders = filteredOrders.slice(0, displayedCount);
  const hasMore = displayedCount < filteredOrders.length;

  // Load more orders when scrolling
  const loadMoreOrders = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + 10, filteredOrders.length));
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMore, filteredOrders.length]);

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
    return <LoadingScreen message="Loading your orders..." variant="page" />;
  }


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
        <div className="w-full px-6 py-8 relative flex items-center justify-between">
          <button
            className="text-orange-500 hover:text-orange-600 transition-all duration-300 p-2 rounded-full hover:bg-orange-500/10 active:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/30 z-10"
            onClick={() => navigate('/home')}
            aria-label="Go back to home"
          >
            <ChevronLeft size={30} />
          </button>

          <div className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-gray-100 text-3xl font-medium">
              My Orders
            </h1>
            <p className="text-orange-100/60 text-sm mt-1 text-center">Track and manage your food orders</p>
          </div>

          {/* Search Icon */}
          <button
            onClick={() => setIsSearchActive(!isSearchActive)}
            className="text-white hover:text-orange-400 transition-all duration-300 p-2 rounded-full hover:bg-white/10 active:bg-white/20 focus:outline-none z-10"
            aria-label="Search orders"
          >
            <Search size={24} />
          </button>
        </div>

        {/* Search Bar (appears when search is active) */}
        <AnimatePresence>
          {isSearchActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-6 pb-4"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by order #, restaurant, items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-md text-white placeholder-gray-400 rounded-full px-5 py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-white/20"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content - Gray block with rounded top corners */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col bg-gray-200 rounded-t-3xl overflow-hidden min-h-[500px] px-4 pt-10 pb-6">
            {/* Tabs */}
            <div className="flex justify-center mb-6">
              <SegmentedTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            {/* Filter and Refresh Bar */}
            <div className="flex items-center justify-between mb-4 bg-white rounded-xl py-2 px-2 shadow-sm relative">
              <div className="flex items-center gap-1.5">
                {/* Sort Button */}
                <button
                  onClick={toggleSortOrder}
                  className="flex items-center text-[10px] sm:text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg px-2 py-1.5 hover:bg-gray-200 transition-colors"
                >
                  <Filter size={12} className="mr-1" />
                  {sortBy === 'newest' ? 'New' : 'Old'}
                </button>

                {/* Advanced Filters Button */}
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center text-[10px] sm:text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg px-2 py-1.5 hover:bg-gray-200 transition-colors"
                >
                  <Filter size={12} className="sm:mr-1" />
                  <span className="hidden sm:inline">Filters</span>
                  <ChevronDown size={12} className={`ml-0.5 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Active Filter Badges */}
                {(filterPaymentMethod !== 'all' || filterDateRange !== 'all') && (
                  <div className="flex items-center gap-1">
                    {filterPaymentMethod !== 'all' && (
                      <span className="text-[9px] sm:text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                        {filterPaymentMethod}
                      </span>
                    )}
                    {filterDateRange !== 'all' && (
                      <span className="text-[9px] sm:text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                        {filterDateRange}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-xs text-gray-500 hidden sm:inline">
                  {formatLastUpdated()}
                </span>
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Refresh orders"
                >
                  <RefreshCw
                    size={14}
                    className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>

              {/* Filter Dropdown Menu */}
              <AnimatePresence>
                {showFilterMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-20 w-72"
                  >
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Filter Options</h3>

                    {/* Payment Method Filter */}
                    <div className="mb-4">
                      <label className="text-xs text-gray-600 mb-2 block">Payment Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['all', 'online', 'upi', 'cash'].map((method) => (
                          <button
                            key={method}
                            onClick={() => setFilterPaymentMethod(method)}
                            className={`text-xs px-3 py-2 rounded-lg border transition-colors ${filterPaymentMethod === method
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                          >
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <label className="text-xs text-gray-600 mb-2 block">Date Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['all', 'today', 'week', 'month'].map((range) => (
                          <button
                            key={range}
                            onClick={() => setFilterDateRange(range)}
                            className={`text-xs px-3 py-2 rounded-lg border transition-colors ${filterDateRange === range
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                          >
                            {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    {(filterPaymentMethod !== 'all' || filterDateRange !== 'all') && (
                      <button
                        onClick={() => {
                          setFilterPaymentMethod('all');
                          setFilterDateRange('all');
                        }}
                        className="w-full mt-4 text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Orders List - Scrollable area with infinite scroll */}
            <div
              className="flex-1 bg-white rounded-xl p-4 overflow-y-auto shadow-sm"
              style={{ maxHeight: 'calc(100vh - 340px)' }}
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                // Load more when user scrolls to bottom (with 100px threshold)
                if (scrollHeight - scrollTop - clientHeight < 100) {
                  loadMoreOrders();
                }
              }}
            >
              <h2 className="text-black text-xl font-semibold mb-4">
                {activeTab === 'pending' ? 'Pending Orders' :
                  activeTab === 'preparing' ? 'Orders in Preparation' : 'Order History'}
              </h2>

              {displayedOrders.length > 0 ? (
                <>
                  {displayedOrders.map((order) => (
                    <div key={order.id} className="mb-3">
                      <OrderCard
                        order={order}
                        restaurantName={restaurantMap[order.restaurant_id] || 'Loading...'}
                        isExpanded={expandedOrderId === order.id}
                        onToggleExpand={() => setExpandedOrderId(
                          expandedOrderId === order.id ? null : order.id
                        )}
                      />
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoadingMore && (
                    <div className="flex justify-center items-center py-4">
                      <Loader className="animate-spin text-orange-500" size={24} />
                      <span className="ml-2 text-gray-500 text-sm">Loading more orders...</span>
                    </div>
                  )}

                  {/* End of list indicator */}
                  {!hasMore && displayedOrders.length > 10 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      You've reached the end
                    </div>
                  )}
                </>
              ) : (
                <EmptyState tab={activeTab} />
              )}
            </div>

            {/* Order Summary - Only show on Order History tab */}
            {activeTab === 'completed' && (
              <div className="mt-3 bg-white p-3 rounded-xl shadow-sm">
                <div className="flex items-center mb-2">
                  <ShoppingBag size={16} className="text-gray-600 mr-1.5" />
                  <h2 className="text-sm font-semibold text-gray-800">Summary</h2>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                    <p className="text-gray-600 text-[10px] mb-0.5">Pending</p>
                    <p className="text-lg font-bold text-yellow-500">
                      {userOrders.filter(order => order.status === 'pending').length}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                    <p className="text-gray-600 text-[10px] mb-0.5">Preparing</p>
                    <p className="text-lg font-bold text-purple-500">
                      {userOrders.filter(order => order.status === 'preparing').length}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                    <p className="text-gray-600 text-[10px] mb-0.5">Done</p>
                    <p className="text-lg font-bold text-green-500">
                      {userOrders.filter(order => ['completed', 'rejected', 'ready'].includes(order.status)).length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Spacing */}
          </div>
        </div>
      </div>
    </div>
  );
};