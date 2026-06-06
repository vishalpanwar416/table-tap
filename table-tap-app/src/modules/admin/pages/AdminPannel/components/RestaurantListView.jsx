import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Building2,
  Edit,
  Trash2,
  ExternalLink,
  Brain,
  ShoppingBag,
  FileText,
  Loader2,
  ChevronUp,
} from 'lucide-react';

import tableTapLogo from '../../../../../assets/icons/logott.png';

const RestaurantListView = ({
  restaurants,
  onToggleStatus,
  onToggleAI,
  onToggleAggregators,
  onToggleOnlineBill,
  onEdit,
  onDelete,
  onClick,
  onLoadMore,
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
        setDisplayedRestaurants((prev) => [...prev, ...newRestaurants]);
        setCurrentPage(nextPage);
        setHasMore(endIndex < restaurants.length);
      } else {
        // If we need to fetch more data from server
        if (onLoadMore) {
          const newRestaurants = await onLoadMore(nextPage, itemsPerPage);
          if (newRestaurants && newRestaurants.length > 0) {
            setDisplayedRestaurants((prev) => [...prev, ...newRestaurants]);
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
      { threshold: 0.1 },
    );

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading]);

  // Observe the last item for infinite scroll
  const observeLastItem = useCallback(
    (index) => {
      if (index === displayedRestaurants.length - 1 && hasMore && !isLoading) {
        const lastItem = document.querySelector(`[data-restaurant-index="${index}"]`);
        if (lastItem && observerRef.current) {
          observerRef.current.observe(lastItem);
        }
      }
    },
    [displayedRestaurants.length, hasMore, isLoading],
  );

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

  // Row component with expand logic
  const RestaurantRow = ({ restaurant, index }) => {
    const [expanded, setExpanded] = useState(false);
    const isInactive = !restaurant.is_active;

    // Observe the last item for infinite scroll
    useEffect(() => {
      observeLastItem(index);
    }, [index]);

    const handleRowClick = (e) => {
      if (window.innerWidth < 768) {
        setExpanded(!expanded);
      } else {
        onClick(restaurant);
      }
    };

    return (
      <div
        className={`border-b transition-all cursor-pointer group ${isInactive ? 'bg-red-50/80 border-red-200 hover:bg-red-100/80' : 'border-gray-200 hover:bg-gray-50'}`}
        data-restaurant-index={index}
        onClick={handleRowClick}
      >
        {/* Desktop View (Grid Layout) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 items-center">
          {/* Restaurant Info */}
          <div className="col-span-2">
            <div className="flex items-center space-x-3">
              {restaurant.logo_url ? (
                <img
                  key={restaurant.logo_url}
                  src={restaurant.logo_url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-200"
                  onError={(e) => {
                    if (e.target.src !== tableTapLogo) {
                      e.target.onerror = null;
                      e.target.src = tableTapLogo;
                    }
                  }}
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${restaurant.is_active ? 'bg-gray-600' : 'bg-red-500'}`}
                >
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <h4
                  className={`font-medium font-spartan truncate ${isInactive ? 'text-red-800' : 'text-gray-900'}`}
                >
                  {restaurant.name}
                </h4>
                <p className="text-xs text-gray-500 font-spartan">{restaurant.cuisine_type}</p>
              </div>
            </div>
          </div>
          <div className="col-span-2 text-sm text-gray-600 font-spartan truncate">
            {restaurant.address}
          </div>
          <div className="col-span-2 text-sm text-gray-600 font-spartan truncate">
            {restaurant.contact_phone}
          </div>
          <div className="col-span-1 text-center text-sm">{restaurant.staff_count || 0}</div>
          {/* Toggles */}
          <div className="col-span-1 flex justify-center">
            <StatusToggle restaurant={restaurant} onClick={handleToggleStatus} />
          </div>
          <div className="col-span-1 flex justify-center">
            <FeatureIconToggle
              active={restaurant.ai_enabled}
              icon={Brain}
              color="purple"
              onClick={(e) => handleToggleAI(e, restaurant)}
            />
          </div>
          <div className="col-span-1 flex justify-center">
            <FeatureIconToggle
              active={restaurant.aggregators_enabled}
              icon={ShoppingBag}
              color="orange"
              onClick={(e) => handleToggleAggregators(e, restaurant)}
            />
          </div>
          <div className="col-span-1 flex justify-center">
            <FeatureIconToggle
              active={
                restaurant.billing_features_enabled !== false ||
                restaurant.online_bill_enabled !== false
              }
              icon={FileText}
              color="blue"
              onClick={(e) => handleToggleOnlineBill(e, restaurant)}
            />
          </div>
          <div className="col-span-1 flex justify-center space-x-2">
            <ActionButtons restaurant={restaurant} onEdit={handleEdit} onDelete={handleDelete} />
          </div>
        </div>

        {/* Mobile View (Collapsible) */}
        <div className="md:hidden p-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {restaurant.logo_url ? (
                <img
                  key={restaurant.logo_url}
                  src={restaurant.logo_url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-200"
                  onError={(e) => {
                    if (e.target.src !== tableTapLogo) {
                      e.target.onerror = null;
                      e.target.src = tableTapLogo;
                    }
                  }}
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${restaurant.is_active ? 'bg-gray-600' : 'bg-red-500'}`}
                >
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <h4
                  className={`font-medium font-spartan ${isInactive ? 'text-red-800' : 'text-gray-900'}`}
                >
                  {restaurant.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{restaurant.cuisine_type}</span>
                  <span>•</span>
                  <span>{restaurant.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
            <ChevronUp
              className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? '' : 'rotate-180'}`}
            />
          </div>

          {/* Expanded Content */}
          {expanded && (
            <div className="mt-2 space-y-3 border-t border-dashed border-gray-200 pt-2 animate-in fade-in slide-in-">
              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-gray-400 mb-1">Location</span>
                  <span className="text-gray-700">{restaurant.address || '-'}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400 mb-1">Contact</span>
                  <span className="text-gray-700">{restaurant.contact_phone || '-'}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400 mb-1">Staff</span>
                  <span className="text-gray-700">{restaurant.staff_count || 0} Members</span>
                </div>
              </div>

              {/* Features */}
              <div>
                <span className="block text-xs text-gray-400 mb-2">Features</span>
                <div className="flex gap-2">
                  <FeatureIconToggle
                    active={restaurant.ai_enabled}
                    icon={Brain}
                    color="purple"
                    onClick={(e) => handleToggleAI(e, restaurant)}
                    label="AI"
                  />
                  <FeatureIconToggle
                    active={restaurant.aggregators_enabled}
                    icon={ShoppingBag}
                    color="orange"
                    onClick={(e) => handleToggleAggregators(e, restaurant)}
                    label="Aggr"
                  />
                  <FeatureIconToggle
                    active={restaurant.billing_features_enabled !== false}
                    icon={FileText}
                    color="blue"
                    onClick={(e) => handleToggleOnlineBill(e, restaurant)}
                    label="Bill"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => onClick(restaurant)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-2 rounded-lg"
                >
                  Open Dashboard <ExternalLink className="w-3 h-3" />
                </button>
                <div className="flex gap-2">
                  <ActionButtons
                    restaurant={restaurant}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper Components
  const StatusToggle = ({ restaurant, onClick }) => (
    <button
      onClick={(e) => onClick(e, restaurant)}
      className={`relative w-12 h-6 rounded-full transition-colors ${restaurant.is_active ? 'bg-green-500' : 'bg-red-500'}`}
    >
      <div
        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${restaurant.is_active ? 'translate-x-6' : 'translate-x-0'}`}
      />
    </button>
  );

  const FeatureIconToggle = ({ active, icon: Icon, color, onClick, label }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg border ${active ? `bg-${color}-50 border-${color}-200 text-${color}-600` : 'bg-gray-50 border-gray-200 text-gray-400'} flex items-center gap-2`}
    >
      <Icon className="w-4 h-4" />
      {label && <span className="text-xs font-medium">{label}</span>}
    </button>
  );

  const ActionButtons = ({ restaurant, onEdit, onDelete }) => (
    <>
      <button
        onClick={(e) => onEdit(e, restaurant)}
        className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-50 rounded-lg"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => onDelete(e, restaurant)}
        className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  );

  // Loading indicator component
  const LoadingIndicator = () => (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-2 text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-spartan">Loading more restaurants...</span>
      </div>
    </div>
  );

  // End of list indicator - hidden
  const EndOfListIndicator = () => null;

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2 font-spartan">
          No restaurants found
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-md font-medium text-gray-700 font-spartan">All Restaurants</h4>
          <p className="text-sm text-gray-500 font-spartan">
            Showing {displayedRestaurants.length} of {restaurants.length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header - Desktop Only */}
        <div className="hidden md:grid bg-gray-50 px-6 py-4 border-b border-gray-200 grid-cols-12 gap-4 text-sm font-medium text-gray-700 font-spartan">
          <div className="col-span-2">Restaurant</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-1 text-center">Staff</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-center">AI</div>
          <div className="col-span-1 text-center">Agg</div>
          <div className="col-span-1 text-center">Bill</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>

        {/* List */}
        <div className="bg-white divide-y divide-gray-100">
          {displayedRestaurants.map((restaurant, index) => (
            <RestaurantRow key={restaurant.id} restaurant={restaurant} index={index} />
          ))}
        </div>

        {/* Loading */}
        {isLoading && <LoadingIndicator />}
        {!hasMore && displayedRestaurants.length > 0 && <EndOfListIndicator />}
      </div>

      {displayedRestaurants.length > 20 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} // Simple scroll to top
          className="fixed bottom-6 right-6 p-3 bg-gray-600 text-white rounded-full shadow-lg z-50"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default RestaurantListView;
