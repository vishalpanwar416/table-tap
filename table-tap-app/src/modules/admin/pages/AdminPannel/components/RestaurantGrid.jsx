import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Building2, Loader2, ChevronUp } from 'lucide-react';
import RestaurantCard from './RestaurantCard';

const RestaurantGrid = ({
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
  const [itemsPerPage] = useState(12); // Show 12 restaurants per page (4 rows of 3)
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const gridRef = useRef(null);
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
      { threshold: 0.1, rootMargin: '100px' },
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

  // Loading indicator component
  const LoadingIndicator = useCallback(
    () => (
      <div className="col-span-full flex items-center justify-center py-12">
        <div className="flex items-center space-x-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-spartan">Loading more restaurants...</span>
        </div>
      </div>
    ),
    [],
  );

  // End of list indicator - hidden
  const EndOfListIndicator = useCallback(() => null, []);

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Building2 className="h-16 w-16 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3 font-spartan">No restaurants yet</h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg font-spartan">
          Get started by adding your first restaurant to your network
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-md font-medium text-gray-700 font-spartan">Restaurant Grid</h4>
          <p className="text-sm text-gray-500 font-spartan">
            Showing {displayedRestaurants.length} of {restaurants.length} restaurants
            {hasMore && <span className="ml-2 text-gray-600">• Scroll to load more</span>}
          </p>
        </div>
      </div>

      {/* Virtualized Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4" ref={gridRef}>
        {displayedRestaurants.map((restaurant, index) => (
          <div
            key={restaurant.id}
            className="transform transition-all duration-300 hover:scale-[1.02]"
            style={{ animationDelay: `${index * 100}ms` }}
            data-restaurant-index={index}
            ref={(el) => {
              if (el && index === displayedRestaurants.length - 1) {
                observeLastItem(index);
              }
            }}
          >
            <RestaurantCard
              restaurant={restaurant}
              onToggleStatus={onToggleStatus}
              onToggleAI={onToggleAI}
              onToggleAggregators={onToggleAggregators}
              onToggleOnlineBill={onToggleOnlineBill}
              onEdit={onEdit}
              onDelete={onDelete}
              onClick={onClick}
            />
          </div>
        ))}

        {/* Loading and End Indicators */}
        {isLoading && <LoadingIndicator />}
        {!hasMore && displayedRestaurants.length > 0 && <EndOfListIndicator />}
      </div>

      {/* Scroll to top button */}
      {displayedRestaurants.length > 12 && (
        <button
          onClick={() => {
            if (gridRef.current) {
              gridRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="fixed bottom-6 right-6 p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
          title="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default RestaurantGrid;
