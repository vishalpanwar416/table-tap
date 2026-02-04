import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Users,
  Clock,
  Calendar,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Brain,
  ShoppingBag,
  FileText,
  Loader2,
  ChevronUp
} from 'lucide-react';
import { FixedSizeList as List } from 'react-window';

const RestaurantListView = ({
  restaurants,
  onToggleStatus,
  onToggleAI,
  onToggleAggregators,
  onToggleOnlineBill,
  onEdit,
  onDelete,
  onClick,
  onLoadMore
}) => {
  // Infinite scroll state
  const [displayedRestaurants, setDisplayedRestaurants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const listRef = useRef(null);
  const observerRef = useRef(null);

  // Initialize displayed restaurants
  useEffect(() => {
    const initialRestaurants = restaurants.slice(0, itemsPerPage);
    setDisplayedRestaurants(initialRestaurants);
    setHasMore(restaurants.length > itemsPerPage);
    setCurrentPage(1);
  }, [restaurants, itemsPerPage]);

  // Load more restaurants
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const nextPage = currentPage + 1;
      const startIndex = (nextPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      // If we have local data, use it
      if (restaurants.length >= endIndex) {
        const newRestaurants = restaurants.slice(startIndex, endIndex);
        setDisplayedRestaurants(prev => [...prev, ...newRestaurants]);
        setCurrentPage(nextPage);
        setHasMore(endIndex < restaurants.length);
      } else {
        // If we need to fetch more data from server
        if (onLoadMore) {
          const newRestaurants = await onLoadMore(nextPage, itemsPerPage);
          if (newRestaurants && newRestaurants.length > 0) {
            setDisplayedRestaurants(prev => [...prev, ...newRestaurants]);
            setCurrentPage(nextPage);
            setHasMore(newRestaurants.length === itemsPerPage);
          } else {
            setHasMore(false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading more restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, currentPage, itemsPerPage, restaurants, onLoadMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading]);

  // Observe the last item for infinite scroll
  const observeLastItem = useCallback((index) => {
    if (index === displayedRestaurants.length - 1 && hasMore && !isLoading) {
      const lastItem = document.querySelector(`[data-restaurant-index="${index}"]`);
      if (lastItem && observerRef.current) {
        observerRef.current.observe(lastItem);
      }
    }
  }, [displayedRestaurants.length, hasMore, isLoading]);

  // Function to format time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';

    const now = new Date();
    const updatedAt = new Date(timestamp);
    const diffInMs = now - updatedAt;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
    return `${Math.floor(diffInDays / 365)}y ago`;
  };

  const handleToggleStatus = (e, restaurant) => {
    e.stopPropagation();
    onToggleStatus(restaurant.id);
  };

  const handleToggleAI = (e, restaurant) => {
    e.stopPropagation();
    onToggleAI(restaurant.id);
  };

  const handleToggleAggregators = (e, restaurant) => {
    e.stopPropagation();
    onToggleAggregators(restaurant.id);
  };

  const handleToggleOnlineBill = (e, restaurant) => {
    e.stopPropagation();
    onToggleOnlineBill(restaurant.id);
  };

  const handleEdit = (e, restaurant) => {
    e.stopPropagation();
    onEdit(restaurant);
  };

  const handleDelete = (e, restaurant) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      onDelete(restaurant.id);
    }
  };

  // Virtualized row component
  const VirtualizedRow = useCallback(({ index, style }) => {
    const restaurant = displayedRestaurants[index];
    if (!restaurant) return null;

    // Observe the last item for infinite scroll
    useEffect(() => {
      observeLastItem(index);
    }, [index, observeLastItem]);

    const isInactive = !restaurant.is_active;

    return (
      <div
        style={style}
        className={`border-b transition-colors cursor-pointer group ${isInactive ? 'bg-red-50/80 border-red-200 hover:bg-red-100/80' : 'border-gray-200 hover:bg-gray-50'}`}
        data-restaurant-index={index}
        onClick={() => onClick(restaurant)}
      >
        <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
          {/* Restaurant Info */}
          <div className="col-span-2">
            <div className="flex items-center space-x-3">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={`${restaurant.name} logo`}
                  className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-200"
                />
              ) : (
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${restaurant.is_active
                  ? 'bg-blue-500'
                  : 'bg-red-500'
                  }`}>
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium font-spartan ${isInactive ? 'text-red-800' : 'text-gray-900'}`}>
                    {restaurant.name}
                  </h4>
                  <div className="flex gap-1">
                    {restaurant.swiggy_api_key && (
                      <img src="https://www.swiggy.com/favicon.ico" alt="Swiggy" className="w-3 h-3" title="Swiggy Integrated" />
                    )}
                    {restaurant.zomato_api_key && (
                      <img src="https://www.zomato.com/favicon.ico" alt="Zomato" className="w-3 h-3" title="Zomato Integrated" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 font-spartan">
                  {restaurant.cuisine_type || 'Cuisine'}
                </p>
                <p className="text-xs text-gray-400 font-spartan">
                  {getTimeAgo(restaurant.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="col-span-2">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 font-spartan truncate">
                {restaurant.address || 'No address'}
              </span>
            </div>
          </div>

          {/* Contact */}
          <div className="col-span-2">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 font-spartan">
                  {restaurant.contact_phone || 'No phone'}
                </span>
              </div>
              {restaurant.contact_email && (
                <p className="text-xs text-gray-500 font-spartan truncate">
                  {restaurant.contact_email}
                </p>
              )}
            </div>
          </div>

          {/* Staff Count */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 font-spartan">
                {restaurant.staff_count || 0}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="col-span-1">
            <div className="flex items-center justify-center">
              {/* Status Toggle */}
              <button
                onClick={(e) => handleToggleStatus(e, restaurant)}
                className={`relative w-16 h-8 rounded-full focus:outline-none transition-all duration-300 shadow-lg group/btn overflow-hidden ${restaurant.is_active
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-200'
                  : 'bg-gradient-to-r from-red-400 to-red-500 shadow-red-200'
                  }`}
                aria-label={restaurant.is_active ? 'Deactivate restaurant' : 'Activate restaurant'}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-out ${restaurant.is_active
                    ? 'translate-x-8 shadow-green-100'
                    : 'translate-x-1 shadow-red-100'
                    }`}
                >
                  {restaurant.is_active ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  ) : (
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* AI Status */}
          <div className="col-span-1">
            <div className="flex items-center justify-center">
              {/* AI Toggle */}
              <button
                onClick={(e) => handleToggleAI(e, restaurant)}
                className={`relative w-16 h-8 rounded-full focus:outline-none transition-all duration-300 shadow-lg group/btn overflow-hidden ${restaurant.ai_enabled
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-purple-200'
                  : 'bg-gradient-to-r from-gray-300 to-gray-400 shadow-gray-200'
                  }`}
                aria-label={restaurant.ai_enabled ? 'Disable AI analytics' : 'Enable AI analytics'}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-out ${restaurant.ai_enabled
                    ? 'translate-x-8 shadow-purple-100'
                    : 'translate-x-1 shadow-gray-100'
                    }`}
                >
                  {restaurant.ai_enabled ? (
                    <Brain className="w-3 h-3 text-purple-500" />
                  ) : (
                    <Brain className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Aggregator Status */}
          <div className="col-span-1">
            <div className="flex items-center justify-center">
              {/* Aggregator Toggle */}
              <button
                onClick={(e) => handleToggleAggregators(e, restaurant)}
                className={`relative w-16 h-8 rounded-full focus:outline-none transition-all duration-300 shadow-lg group/btn overflow-hidden ${restaurant.aggregators_enabled
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-200'
                  : 'bg-gradient-to-r from-gray-300 to-gray-400 shadow-gray-200'
                  }`}
                aria-label={restaurant.aggregators_enabled ? 'Disable aggregators' : 'Enable aggregators'}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-out ${restaurant.aggregators_enabled
                    ? 'translate-x-8 shadow-orange-100'
                    : 'translate-x-1 shadow-gray-100'
                    }`}
                >
                  {restaurant.aggregators_enabled ? (
                    <ShoppingBag className="w-3 h-3 text-orange-500" />
                  ) : (
                    <ShoppingBag className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Online Bill Status */}
          <div className="col-span-1">
            <div className="flex items-center justify-center">
              {/* Online Bill Toggle */}
              <button
                onClick={(e) => handleToggleOnlineBill(e, restaurant)}
                className={`relative w-16 h-8 rounded-full focus:outline-none transition-all duration-300 shadow-lg group/btn overflow-hidden ${(restaurant.billing_features_enabled !== false || restaurant.online_bill_enabled !== false)
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-200'
                  : 'bg-gradient-to-r from-gray-300 to-gray-400 shadow-gray-200'
                  }`}
                aria-label={(restaurant.billing_features_enabled !== false || restaurant.online_bill_enabled !== false) ? 'Disable Online Billing' : 'Enable Online Billing'}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-out ${(restaurant.billing_features_enabled !== false || restaurant.online_bill_enabled !== false)
                    ? 'translate-x-8 shadow-blue-100'
                    : 'translate-x-1 shadow-gray-100'
                    }`}
                >
                  {(restaurant.billing_features_enabled !== false || restaurant.online_bill_enabled !== false) ? (
                    <FileText className="w-3 h-3 text-blue-500" />
                  ) : (
                    <FileText className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => handleEdit(e, restaurant)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit restaurant"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleDelete(e, restaurant)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete restaurant"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {restaurant.google_maps_link && (
                <a
                  href={restaurant.google_maps_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="View on Google Maps"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [displayedRestaurants, getTimeAgo, handleToggleStatus, handleToggleAI, handleEdit, handleDelete, onClick, observeLastItem]);

  // Loading indicator component
  const LoadingIndicator = useCallback(() => (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-2 text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-spartan">Loading more restaurants...</span>
      </div>
    </div>
  ), []);

  // End of list indicator - hidden
  const EndOfListIndicator = useCallback(() => null, []);

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2 font-spartan">
          No restaurants found
        </h3>
        <p className="text-gray-500 font-spartan">
          Get started by adding your first restaurant
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-md font-medium text-gray-700 font-spartan">All Restaurants</h4>
          <p className="text-sm text-gray-500 font-spartan">
            Showing {displayedRestaurants.length} of {restaurants.length} restaurants
            {hasMore && (
              <span className="ml-2 text-blue-600">
                • Scroll to load more
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Virtualized Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 font-spartan">
            <div className="col-span-2">Restaurant</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-1 text-center">Staff</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-center">AI</div>
            <div className="col-span-1 text-center">Aggregators</div>
            <div className="col-span-1 text-center">Online Bill</div>
            <div className="col-span-1 text-center">Actions</div>
          </div>
        </div>

        {/* Virtualized List */}
        <div className="bg-white">
          <List
            ref={listRef}
            height={Math.min(600, displayedRestaurants.length * 80)}
            itemCount={displayedRestaurants.length}
            itemSize={80}
            width="100%"
            itemData={displayedRestaurants}
          >
            {VirtualizedRow}
          </List>
        </div>

        {/* Loading and End Indicators */}
        {isLoading && <LoadingIndicator />}
        {!hasMore && displayedRestaurants.length > 0 && <EndOfListIndicator />}
      </div>

      {/* Scroll to top button */}
      {displayedRestaurants.length > 20 && (
        <button
          onClick={() => {
            if (listRef.current) {
              listRef.current.scrollToItem(0, 'start');
            }
          }}
          className="fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
          title="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default RestaurantListView; 