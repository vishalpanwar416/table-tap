import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Users, Loader2, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
import RestaurantStaffHeader from './RestaurantStaffHeader';
import StaffTableRow from './StaffTableRow';
import EmptyStaffState from './EmptyStaffState';

const RestaurantStaffSection = ({ 
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
  const [itemsPerPage] = useState(10); // Show 10 staff per page
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const listRef = useRef(null);
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
      { threshold: 0.1, rootMargin: '50px' }
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

  // Virtualized row component
  const VirtualizedRow = useCallback(({ index, style }) => {
    const member = displayedStaff[index];
    if (!member) return null;

    // Observe the last item for infinite scroll
    useEffect(() => {
      observeLastItem(index);
    }, [index, observeLastItem]);

    return (
      <div 
        style={style} 
        className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
        data-staff-index={`${restaurant.id}-${index}`}
      >
        <div className="grid grid-cols-5 gap-4 px-4 py-4 items-center">
          {/* Staff Member */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-semibold text-gray-900 font-spartan">
                {member.name || 'Unnamed Staff'}
              </div>
              <div className="text-sm text-gray-500 font-spartan">
                {member.email}
              </div>
            </div>
          </div>

          {/* Role */}
          <div>
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border font-spartan ${getRoleColor(member.role)}`}>
              {getRoleDisplayName(member.role)}
            </span>
          </div>

          {/* Contact */}
          <div className="text-sm text-gray-600 font-spartan">
            {member.phone_number || 'No phone'}
          </div>

          {/* Status */}
          <div className="flex items-center">
            {member.connected ? (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 border border-green-200 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 rounded-full">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                Disconnected
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(member)}
              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
              title="Edit staff member"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(member.id)}
              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Delete staff member"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }, [displayedStaff, restaurant.id, onEdit, onDelete, observeLastItem]);

  // Helper functions
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'manager':
        return 'Manager';
      case 'captain':
        return 'Captain';
      case 'waiter':
        return 'Waiter';
      case 'chef':
        return 'Chef';
      case 'cashier':
        return 'Cashier';
      default:
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Staff';
    }
  };

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

  // Loading indicator component
  const LoadingIndicator = useCallback(() => (
    <div className="flex items-center justify-center py-6">
      <div className="flex items-center space-x-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-spartan">Loading more staff...</span>
      </div>
    </div>
  ), []);

  // End of list indicator
  const EndOfListIndicator = useCallback(() => (
    <div className="flex items-center justify-center py-6">
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
            <div className="overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                <div className="grid grid-cols-5 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                  <div>Staff Member</div>
                  <div>Role</div>
                  <div>Contact</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
              </div>

              {/* Virtualized List */}
              <div className="bg-white">
                <List
                  ref={listRef}
                  height={Math.min(400, displayedStaff.length * 60)}
                  itemCount={displayedStaff.length}
                  itemSize={60}
                  width="100%"
                  itemData={displayedStaff}
                >
                  {VirtualizedRow}
                </List>
              </div>

              {/* Loading and End Indicators */}
              {isLoading && <LoadingIndicator />}
              {!hasMore && displayedStaff.length > 0 && <EndOfListIndicator />}
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

export default RestaurantStaffSection; 