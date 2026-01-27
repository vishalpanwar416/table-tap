import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Users, Building2, Mail, Phone, Edit, Trash2, Loader2, ChevronUp } from 'lucide-react';
import RestaurantStaffHeader from './RestaurantStaffHeader';
import EmptyStaffState from './EmptyStaffState';

const RestaurantStaffGrid = ({ 
  restaurant, 
  restaurantStaff, 
  filteredRestaurantStaff, 
  selectedRestaurantId, 
  setSelectedRestaurantId, 
  onEdit, 
  onDelete, 
  onAddStaff,
  onLoadMore 
}) => {
  const isExpanded = selectedRestaurantId === restaurant.id;
  
  // Infinite scroll state
  const [displayedStaff, setDisplayedStaff] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // Show 8 staff per page (2 rows of 4)
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const gridRef = useRef(null);
  const observerRef = useRef(null);

  // Initialize displayed staff when restaurant is expanded
  useEffect(() => {
    if (isExpanded) {
      const initialStaff = filteredRestaurantStaff.slice(0, itemsPerPage);
      setDisplayedStaff(initialStaff);
      setHasMore(filteredRestaurantStaff.length > itemsPerPage);
      setCurrentPage(1);
    }
  }, [isExpanded, filteredRestaurantStaff, itemsPerPage]);

  // Load more staff members
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !isExpanded) return;

    setIsLoading(true);
    
    try {
      const nextPage = currentPage + 1;
      const startIndex = (nextPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      // If we have local data, use it
      if (filteredRestaurantStaff.length >= endIndex) {
        const newStaff = filteredRestaurantStaff.slice(startIndex, endIndex);
        setDisplayedStaff(prev => [...prev, ...newStaff]);
        setCurrentPage(nextPage);
        setHasMore(endIndex < filteredRestaurantStaff.length);
      } else {
        // If we need to fetch more data from server
        if (onLoadMore) {
          const newStaff = await onLoadMore(restaurant.id, nextPage, itemsPerPage);
          if (newStaff && newStaff.length > 0) {
            setDisplayedStaff(prev => [...prev, ...newStaff]);
            setCurrentPage(nextPage);
            setHasMore(newStaff.length === itemsPerPage);
          } else {
            setHasMore(false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading more staff:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, isExpanded, currentPage, itemsPerPage, filteredRestaurantStaff, restaurant.id, onLoadMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!isExpanded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading, isExpanded]);

  // Observe the last item for infinite scroll
  const observeLastItem = useCallback((index) => {
    if (index === displayedStaff.length - 1 && hasMore && !isLoading && isExpanded) {
      const lastItem = document.querySelector(`[data-staff-index="${restaurant.id}-${index}"]`);
      if (lastItem && observerRef.current) {
        observerRef.current.observe(lastItem);
      }
    }
  }, [displayedStaff.length, hasMore, isLoading, isExpanded, restaurant.id]);

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'captain':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'waiter':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'chef':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cashier':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConnectionStatus = (connected) => {
    return connected ? (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 border border-green-200 rounded-full">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
        Connected
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 rounded-full">
        <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
        Disconnected
      </span>
    );
  };

  // Staff Card Component
  const StaffCard = useCallback(({ member, index }) => (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-300 group"
      data-staff-index={`${restaurant.id}-${index}`}
      ref={(el) => {
        if (el && index === displayedStaff.length - 1) {
          observeLastItem(index);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 flex items-center justify-center shadow-sm">
            {member.name ? (
              <span className="text-white font-bold text-sm">
                {member.name.split(' ').map(n => n[0]).join('').slice(0,2)}
              </span>
            ) : (
              <Users className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 font-spartan">
              {member.name || 'Unnamed Staff'}
            </h4>
            <p className="text-xs text-gray-500 font-spartan">
              {member.email}
            </p>
          </div>
        </div>
        {getConnectionStatus(member.connected)}
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(member.role)}`}>
            {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Staff'}
          </span>
        </div>

        {member.phone_number && (
          <div className="flex items-center space-x-2">
            <Phone className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600 font-spartan">
              {member.phone_number}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onEdit(member)}
          className="p-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 transition-colors"
          title="Edit staff member"
        >
          <Edit className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(member.id)}
          className="p-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 transition-colors"
          title="Delete staff member"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  ), [displayedStaff.length, restaurant.id, getRoleColor, getConnectionStatus, onEdit, onDelete, observeLastItem]);

  // Loading indicator component
  const LoadingIndicator = useCallback(() => (
    <div className="col-span-full flex items-center justify-center py-6">
      <div className="flex items-center space-x-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-spartan">Loading more staff...</span>
      </div>
    </div>
  ), []);

  // End of list indicator
  const EndOfListIndicator = useCallback(() => (
    <div className="col-span-full flex items-center justify-center py-6">
      <div className="text-center">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Users className="w-4 h-4 text-gray-400" />
        </div>
        <p className="text-xs text-gray-600 font-spartan">All staff loaded</p>
        <p className="text-xs text-gray-500 font-spartan">
          Showing {displayedStaff.length} of {filteredRestaurantStaff.length} staff members
        </p>
      </div>
    </div>
  ), [displayedStaff.length, filteredRestaurantStaff.length]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 font-spartan">
      <RestaurantStaffHeader
        restaurant={restaurant}
        restaurantStaff={restaurantStaff}
        selectedRestaurantId={selectedRestaurantId}
        setSelectedRestaurantId={setSelectedRestaurantId}
      />
      
      {isExpanded && (
        <div className="border-t border-gray-100">
          {filteredRestaurantStaff.length > 0 ? (
            <div className="p-4">
              {/* Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" ref={gridRef}>
                {displayedStaff.map((member, index) => (
                  <div
                    key={member.id}
                    className="transform transition-all duration-300 hover:scale-[1.02]"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <StaffCard member={member} index={index} />
                  </div>
                ))}

                {/* Loading and End Indicators */}
                {isLoading && <LoadingIndicator />}
                {!hasMore && displayedStaff.length > 0 && <EndOfListIndicator />}
              </div>
            </div>
          ) : (
            <EmptyStaffState
              restaurantName={restaurant.name}
              onAddStaff={onAddStaff}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantStaffGrid; 