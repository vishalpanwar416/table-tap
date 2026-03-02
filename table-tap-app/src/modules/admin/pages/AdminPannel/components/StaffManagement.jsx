import React, { useState, useMemo } from 'react';
import { Users, Plus, List, Grid, Building2, CheckCircle, XCircle } from 'lucide-react';
import StaffStats from './StaffStats';
import RestaurantStaffSection from './RestaurantStaffSection';
import RestaurantStaffGrid from './RestaurantStaffGrid';
import StaffListView from './StaffListView';
import StaffGrid from './StaffGrid';

const StaffManagement = ({
  staff,
  restaurants,
  total,
  selectedRestaurantId,
  setSelectedRestaurantId,
  onAddStaff,
  onEdit,
  onDelete,
  onLoadMore
}) => {
  const [viewMode, setViewMode] = useState('restaurant'); // 'restaurant', 'list', 'grid'
  const [restaurantViewMode, setRestaurantViewMode] = useState('table'); // 'table', 'grid'

  // Filter staff based on selected restaurant
  const filteredStaff = useMemo(() => {
    return staff.filter(member =>
      (!selectedRestaurantId || member.restaurant_id === selectedRestaurantId)
    );
  }, [staff, selectedRestaurantId]);

  // Group staff by restaurant
  const getRestaurantStaff = (restaurantId) => {
    return staff.filter(s => s.restaurant_id === restaurantId);
  };

  // Check if restaurant should be shown
  const shouldShowRestaurant = (restaurant) => {
    if (selectedRestaurantId && restaurant.id !== selectedRestaurantId) return false;
    return true;
  };

  // Calculate stats
  const stats = {
    total: staff.length,
    managers: staff.filter(s => s.role === 'manager').length,
    captains: staff.filter(s => s.role === 'captain').length,
    connected: staff.filter(s => s.connected).length,
    disconnected: staff.filter(s => !s.connected).length,
    byRestaurant: restaurants.reduce((acc, restaurant) => {
      acc[restaurant.id] = getRestaurantStaff(restaurant.id).length;
      return acc;
    }, {})
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-spartan px-2 sm:px-0">
      {/* Overview section with stats and Add Staff CTA */}
      {/* Action & Stats Toolbar - Compact Single Line */}
      {/* Action & Stats Toolbar - Compact Single Line */}
      <div className="grid grid-cols-5 gap-1.5 md:flex md:items-center md:justify-between md:gap-4 mb-6">
        {/* Add Staff Button - Compact on Mobile */}
        <button
          onClick={onAddStaff}
          className="col-span-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 py-1.5 md:px-4 md:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg md:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow font-semibold text-[9px] md:text-sm font-spartan h-full md:h-auto"
        >
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="leading-tight text-center md:text-left">Add</span>
        </button>

        {/* Stats - 4 Columns */}
        {/* Total Staff */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start md:gap-2 px-1 py-1.5 md:px-3 md:py-1.5 bg-white rounded-lg border border-gray-100 shadow-sm">
          <span className="text-[9px] md:text-xs text-gray-500 font-bold uppercase tracking-wider text-center">Total</span>
          <span className="text-[10px] md:text-sm font-bold text-gray-900 leading-tight">{staff.length}</span>
        </div>

        {/* Restaurants */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start md:gap-2 px-1 py-1.5 md:px-3 md:py-1.5 bg-purple-50 rounded-lg border border-purple-100">
          <span className="text-[9px] md:text-xs text-purple-600 font-bold uppercase tracking-wider text-center">Rest.</span>
          <span className="text-[10px] md:text-sm font-bold text-purple-700 leading-tight">{restaurants.length}</span>
        </div>

        {/* Connected */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start md:gap-2 px-1 py-1.5 md:px-3 md:py-1.5 bg-green-50 rounded-lg border border-green-100">
          <span className="text-[9px] md:text-xs text-green-600 font-bold uppercase tracking-wider text-center">Online</span>
          <span className="text-[10px] md:text-sm font-bold text-green-700 leading-tight">{staff.filter(s => s.connected).length}</span>
        </div>

        {/* Disconnected */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start md:gap-2 px-1 py-1.5 md:px-3 md:py-1.5 bg-red-50 rounded-lg border border-red-100">
          <span className="text-[9px] md:text-xs text-red-600 font-bold uppercase tracking-wider text-center">Offline</span>
          <span className="text-[10px] md:text-sm font-bold text-red-700 leading-tight">{staff.filter(s => !s.connected).length}</span>
        </div>
      </div>

      {/* Staff Members section with view toggles */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-spartan">Staff Members</h2>
              <p className="text-sm text-gray-500 font-spartan mt-0.5">
                {filteredStaff.length} member{filteredStaff.length !== 1 ? 's' : ''}
                {viewMode === 'restaurant' && restaurants.length > 0 && ` · ${restaurants.length} restaurant${restaurants.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Main view: Restaurant / Grid */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('restaurant')}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'restaurant'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  <Building2 className="w-3.5 h-3.5 mr-1.5" />
                  Restaurant
                </button>
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  <Grid className="w-3.5 h-3.5 mr-1.5" />
                  Grid
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Staff content */}
        <div className="p-4 sm:p-6">
          {viewMode === 'restaurant' ? (
            restaurants.length > 0 ? (
              <div className="space-y-5">
                {restaurants.map((restaurant) => {
                  const restaurantStaff = getRestaurantStaff(restaurant.id);

                  return (
                    <div
                      key={restaurant.id}
                      className="transition-all duration-300"
                    >
                      {restaurantViewMode === 'table' ? (
                        <RestaurantStaffSection
                          restaurant={restaurant}
                          restaurantStaff={restaurantStaff}
                          filteredRestaurantStaff={restaurantStaff}
                          selectedRestaurantId={selectedRestaurantId}
                          setSelectedRestaurantId={setSelectedRestaurantId}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onAddStaff={() => onAddStaff(restaurant.id)}
                          onLoadMore={onLoadMore}
                        />
                      ) : (
                        <RestaurantStaffGrid
                          restaurant={restaurant}
                          restaurantStaff={restaurantStaff}
                          filteredRestaurantStaff={restaurantStaff}
                          selectedRestaurantId={selectedRestaurantId}
                          setSelectedRestaurantId={setSelectedRestaurantId}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onAddStaff={() => onAddStaff(restaurant.id)}
                          onLoadMore={onLoadMore}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20 px-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200">
                {/* ... existing empty state ... */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Building2 className="h-12 w-12 sm:h-14 sm:w-14 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 font-spartan">No restaurants yet</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto text-sm sm:text-base font-spartan">
                  Add restaurants first to manage staff per location
                </p>
                <button className="inline-flex items-center min-h-[44px] px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold font-spartan touch-manipulation">
                  Add Restaurant
                </button>
              </div>
            )
          ) : viewMode === 'list' ? (
            <StaffListView
              staff={filteredStaff}
              restaurants={restaurants}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddStaff={onAddStaff}
              onLoadMore={onLoadMore}
            />
          ) : (
            <StaffGrid
              staff={filteredStaff}
              restaurants={restaurants}
              onEdit={onEdit}
              onDelete={onDelete}
              onLoadMore={onLoadMore}
            />
          )}

          {/* Load More Button */}
          {staff.length < (total || staff.length) && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={onLoadMore}
                className="px-8 py-3 bg-white border-2 border-blue-100 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-sm flex items-center gap-2"
              >
                <span>Load More Staff</span>
                {/* Small indicator showing progress */}
                <span className="text-xs font-normal text-blue-400">
                  ({staff.length} of {total})
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* No staff found overlay */}
      {restaurants.length > 0 && staff.length === 0 && (
        <div className="text-center py-16 sm:py-20 px-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-r from-slate-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Users className="h-12 w-12 sm:h-14 sm:w-14 text-slate-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 font-spartan">No staff members yet</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto text-sm sm:text-base font-spartan">
            Add your first staff member to get started
          </p>
          <button
            onClick={onAddStaff}
            className="inline-flex items-center min-h-[44px] px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold font-spartan touch-manipulation"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Staff Member
          </button>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;