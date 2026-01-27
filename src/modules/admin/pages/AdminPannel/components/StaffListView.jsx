import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Users, Building2, Mail, Phone, Edit, Trash2, Plus, Loader2, ChevronUp } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';

const StaffListView = ({ staff, restaurants, onEdit, onDelete, onAddStaff, onLoadMore }) => {
  // Infinite scroll state
  const [displayedStaff, setDisplayedStaff] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const listRef = useRef(null);
  const observerRef = useRef(null);

  // Initialize displayed staff
  useEffect(() => {
    const initialStaff = staff.slice(0, itemsPerPage);
    setDisplayedStaff(initialStaff);
    setHasMore(staff.length > itemsPerPage);
    setCurrentPage(1);
  }, [staff, itemsPerPage]);

  // Load more staff members
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    try {
      const nextPage = currentPage + 1;
      const startIndex = (nextPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      // If we have local data, use it
      if (staff.length >= endIndex) {
        const newStaff = staff.slice(startIndex, endIndex);
        setDisplayedStaff(prev => [...prev, ...newStaff]);
        setCurrentPage(nextPage);
        setHasMore(endIndex < staff.length);
      } else {
        // If we need to fetch more data from server
        if (onLoadMore) {
          const newStaff = await onLoadMore(nextPage, itemsPerPage);
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
  }, [isLoading, hasMore, currentPage, itemsPerPage, staff, onLoadMore]);

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
    if (index === displayedStaff.length - 1 && hasMore && !isLoading) {
      const lastItem = document.querySelector(`[data-staff-index="${index}"]`);
      if (lastItem && observerRef.current) {
        observerRef.current.observe(lastItem);
      }
    }
  }, [displayedStaff.length, hasMore, isLoading]);

  const getRestaurantName = (restaurantId) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    return restaurant ? restaurant.name : 'Unknown Restaurant';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'captain':
        return 'bg-blue-100 text-blue-800 border-blue-200';
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

  // Virtualized row component with intersection observer
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
        className="border-b border-gray-100 hover:bg-blue-50/60 transition-colors group"
        data-staff-index={index}
      >
        <div className="grid grid-cols-6 gap-4 px-4 py-4 min-w-[900px]">
          {/* Staff Member */}
          <div className="flex items-center min-w-[180px]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 flex items-center justify-center shadow-sm">
              {member.name ? (
                <span className="text-white font-bold text-lg">
                  {member.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </span>
              ) : (
              <Users className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="ml-4">
              <div className="text-sm font-semibold text-gray-900 font-spartan">
                {member.name || 'Unnamed Staff'}
              </div>
              <div className="text-xs text-gray-500 font-spartan">
                {member.email}
              </div>
            </div>
          </div>

          {/* Restaurant */}
          <div className="flex items-center min-w-[140px]">
            <Building2 className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-900 font-spartan">
              {getRestaurantName(member.restaurant_id)}
            </span>
          </div>

          {/* Role */}
          <div className="min-w-[100px]">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${getRoleColor(member.role)}`}>
            {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Unknown'}
          </span>
          </div>

          {/* Contact */}
          <div className="space-y-1 min-w-[180px]">
            {member.email && (
              <div className="flex items-center text-xs text-gray-600">
                <Mail className="w-3 h-3 mr-1" />
                {member.email}
              </div>
            )}
            {member.phone_number && (
              <div className="flex items-center text-xs text-gray-600">
                <Phone className="w-3 h-3 mr-1" />
                {member.phone_number}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="min-w-[120px]">
          {getConnectionStatus(member.connected)}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 min-w-[100px]">
            <button
              onClick={() => onEdit(member)}
              className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 transition-colors shadow group-hover:scale-110"
              title="Edit staff member"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(member.id)}
              className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 transition-colors shadow group-hover:scale-110"
              title="Delete staff member"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }, [displayedStaff, getRestaurantName, getRoleColor, getConnectionStatus, onEdit, onDelete, observeLastItem]);

  // Loading indicator component
  const LoadingIndicator = useCallback(() => (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-2 text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-spartan">Loading more staff members...</span>
      </div>
    </div>
  ), []);

  // End of list indicator
  const EndOfListIndicator = useCallback(() => (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-600 font-spartan">All staff members loaded</p>
        <p className="text-xs text-gray-500 font-spartan mt-1">
          Showing {displayedStaff.length} of {staff.length} total members
        </p>
      </div>
    </div>
  ), [displayedStaff.length, staff.length]);

  if (staff.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 font-spartan">No staff members found</h3>
        <p className="text-gray-600 mb-4 font-spartan">Get started by adding your first staff member</p>
        <button
          onClick={onAddStaff}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-spartan"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
        <h4 className="text-md font-medium text-gray-700 font-spartan">All Staff Members</h4>
          <p className="text-sm text-gray-500 font-spartan">
            Showing {displayedStaff.length} of {staff.length} staff members
            {hasMore && (
              <span className="ml-2 text-blue-600">
                • Scroll to load more
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Virtualized Table */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-white/80 sticky top-0 z-10 backdrop-blur border-b border-gray-200">
          <div className="grid grid-cols-6 gap-4 px-4 py-4 min-w-[900px]">
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider font-spartan min-w-[180px]">Staff Member</div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider font-spartan min-w-[140px]">Restaurant</div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider font-spartan min-w-[100px]">Role</div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider font-spartan min-w-[180px]">Contact</div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider font-spartan min-w-[120px]">Status</div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider font-spartan min-w-[100px]">Actions</div>
                      </div>
                    </div>

        {/* Virtualized List */}
        <div className="bg-white">
          <List
            ref={listRef}
            height={Math.min(600, displayedStaff.length * 80)}
            itemCount={displayedStaff.length}
            itemSize={80}
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

      {/* Scroll to top button */}
      {displayedStaff.length > 20 && (
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

export default StaffListView; 