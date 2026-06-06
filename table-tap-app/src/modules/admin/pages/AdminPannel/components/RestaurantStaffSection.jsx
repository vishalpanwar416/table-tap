import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Users, Loader2, Edit, Trash2 } from 'lucide-react';
import RestaurantStaffHeader from './RestaurantStaffHeader';
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
  onLoadMore,
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
        setDisplayedStaff((prev) => [...prev, ...newStaff]);
        setCurrentPage(nextPage);
        setHasMore(endIndex < filteredRestaurantStaff.length);
      } else {
        // If we need to fetch more data from server
        if (onLoadMore) {
          const newStaff = await onLoadMore(restaurant.id, nextPage, itemsPerPage);
          if (newStaff && newStaff.length > 0) {
            setDisplayedStaff((prev) => [...prev, ...newStaff]);
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
  }, [
    isLoading,
    hasMore,
    isExpanded,
    currentPage,
    itemsPerPage,
    filteredRestaurantStaff,
    restaurant.id,
    onLoadMore,
  ]);

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
      { threshold: 0.1, rootMargin: '50px' },
    );

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading, isExpanded]);

  // Observe the last item for infinite scroll
  const observeLastItem = useCallback(
    (index) => {
      if (index === displayedStaff.length - 1 && hasMore && !isLoading && isExpanded) {
        const lastItem = document.querySelector(`[data-staff-index="${restaurant.id}-${index}"]`);
        if (lastItem && observerRef.current) {
          observerRef.current.observe(lastItem);
        }
      }
    },
    [displayedStaff.length, hasMore, isLoading, isExpanded, restaurant.id],
  );

  // Virtualized row component
  const VirtualizedRow = useCallback(
    ({ index, style }) => {
      const member = displayedStaff[index];
      if (!member) return null;

      // Trigger observation synchronously during render (no hook needed)
      observeLastItem(index);

      return (
        <div
          style={style}
          className="border-b border-gray-100 hover:bg-orange-50 transition-all duration-200"
          data-staff-index={`${restaurant.id}-${index}`}
        >
          <div className="grid grid-cols-5 gap-4 px-4 py-4 items-center">
            {/* Staff Member */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-semibold text-gray-900 font-spartan">
                  {member.name || 'Unnamed Staff'}
                </div>
                <div className="text-sm text-gray-500 font-spartan">{member.email}</div>
              </div>
            </div>

            {/* Role */}
            <div>
              <span
                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border font-spartan ${getRoleColor(member.role)}`}
              >
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
            <div className="flex items-center justify-end gap-1 sm:gap-2">
              <button
                onClick={() => onEdit(member)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 touch-manipulation"
                title="Edit staff member"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(member.id)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 touch-manipulation"
                title="Delete staff member"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    },
    [displayedStaff, restaurant.id, onEdit, onDelete, observeLastItem],
  );

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
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'captain':
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
  const LoadingIndicator = useCallback(
    () => (
      <div className="flex items-center justify-center py-5 border-t border-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span className="text-sm font-spartan">Loading more...</span>
        </div>
      </div>
    ),
    [],
  );

  // End of list indicator
  const EndOfListIndicator = useCallback(
    () => (
      <div className="flex items-center justify-center py-5 border-t border-gray-50 bg-gray-50/30">
        <div className="text-center">
          <p className="text-xs font-medium text-gray-500 font-spartan">
            {displayedStaff.length} of {filteredRestaurantStaff.length} staff shown
          </p>
        </div>
      </div>
    ),
    [displayedStaff.length, filteredRestaurantStaff.length],
  );

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 font-spartan">
      <RestaurantStaffHeader
        restaurant={restaurant}
        restaurantStaff={restaurantStaff}
        selectedRestaurantId={selectedRestaurantId}
        setSelectedRestaurantId={setSelectedRestaurantId}
      />

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/10">
          {filteredRestaurantStaff.length > 0 ? (
            <div className="overflow-hidden">
              {/* Desktop Table Header - Only on md+ */}
              <div className="hidden md:block bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                <div className="grid grid-cols-12 gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest font-spartan">
                  <div className="col-span-4">Staff Member</div>
                  <div className="col-span-2 text-center">Role</div>
                  <div className="col-span-3">Contact Info</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
              </div>

              {/* Staff List / Grid Container */}
              <div className="p-4 md:p-0">
                <div className="space-y-4 md:space-y-0">
                  {displayedStaff.map((member, index) => (
                    <div
                      key={member.id || index}
                      data-staff-index={`${restaurant.id}-${index}`}
                      className="group bg-white md:bg-transparent rounded-xl md:rounded-none border border-gray-100 md:border-0 md:border-b md:border-gray-50 p-4 md:px-6 md:py-4 md:hover:bg-gray-50/40 transition-all duration-200 shadow-sm md:shadow-none"
                    >
                      {/* Mobile Layout: Card Structure */}
                      <div className="md:hidden space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {member.name ? member.name.charAt(0) : <Users className="w-4 h-4" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 leading-tight">
                                {member.name || 'Unnamed Staff'}
                              </h4>
                              <span
                                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleColor(member.role)}`}
                              >
                                {getRoleDisplayName(member.role).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => onEdit(member)}
                              className="p-2 bg-gray-50 text-gray-600 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(member.id)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 border-t border-gray-50 pt-3">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 flex items-center justify-center rounded bg-gray-50">
                              <span className="text-[10px] font-bold text-gray-400">@</span>
                            </div>
                            <span className="truncate">{member.email}</span>
                          </div>
                          {member.phone_number && (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 flex items-center justify-center rounded bg-gray-50">
                                <span className="text-[10px] font-bold text-gray-400">#</span>
                              </div>
                              <span>{member.phone_number}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-gray-400 font-medium">Network Status</span>
                          {member.connected ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg border border-green-100 text-xs font-bold">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                              ONLINE
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg border border-gray-100 text-xs font-bold">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                              OFFLINE
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop Layout: Table-like Row */}
                      <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
                        {/* Member Info */}
                        <div className="col-span-4 flex items-center min-w-0">
                          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                            {member.name ? member.name.charAt(0) : <Users className="w-4 h-4" />}
                          </div>
                          <div className="ml-4 min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate font-spartan">
                              {member.name || 'Unnamed Staff'}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{member.email}</div>
                          </div>
                        </div>

                        {/* Role */}
                        <div className="col-span-2 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm ${getRoleColor(member.role)}`}
                          >
                            {getRoleDisplayName(member.role).toUpperCase()}
                          </span>
                        </div>

                        {/* Contact */}
                        <div className="col-span-3 text-sm text-gray-600 font-medium truncate">
                          {member.phone_number || (
                            <span className="text-gray-300 italic">No contact info</span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="col-span-2 flex justify-center">
                          {member.connected ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-[10px] font-bold">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                              ONLINE
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 text-gray-500 rounded-full border border-gray-100 text-[10px] font-bold">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                              OFFLINE
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(member)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(member.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loading and End Indicators */}
              {isLoading && <LoadingIndicator />}
              {!hasMore && displayedStaff.length > 0 && <EndOfListIndicator />}
            </div>
          ) : (
            <EmptyStaffState restaurantName={restaurant.name} onAddStaff={onAddStaff} />
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantStaffSection;
