import React, { useState, useMemo } from 'react';
import { Users, Plus, List, Grid, Building2 } from 'lucide-react';
import StaffStats from './StaffStats';
import RestaurantStaffSection from './RestaurantStaffSection';
import RestaurantStaffGrid from './RestaurantStaffGrid';
import StaffListView from './StaffListView';
import StaffGrid from './StaffGrid';

const StaffManagement = ({ 
  staff, 
  restaurants, 
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-spartan">Staff Overview</h2>
            <p className="text-sm text-gray-500 font-spartan mt-0.5">Manage staff across restaurants</p>
          </div>
          <button
            onClick={onAddStaff}
            className="inline-flex items-center justify-center min-h-[44px] sm:min-h-[42px] px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 transition-all duration-200 shadow-md hover:shadow-lg font-semibold font-spartan touch-manipulation shrink-0"
          >
            <Plus className="w-5 h-5 mr-2 shrink-0" />
            Add Staff
          </button>
        </div>
        <div className="p-4 sm:p-6">
          <StaffStats staff={staff} restaurants={restaurants} />
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
              {/* Main view: Restaurant / List / Grid */}
              <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode('restaurant')}
                  className={`flex items-center min-h-[42px] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${
                    viewMode === 'restaurant'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  title="By Restaurant"
                >
                  <Building2 className="w-4 h-4 mr-2 shrink-0" />
                  Restaurant
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center min-h-[42px] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4 mr-2 shrink-0" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center min-h-[42px] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4 mr-2 shrink-0" />
                  Grid
                </button>
              </div>
              {/* Restaurant sub-view: Table / Grid (only when Restaurant view selected) */}
              {viewMode === 'restaurant' && (
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setRestaurantViewMode('table')}
                    className={`flex items-center min-h-[40px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      restaurantViewMode === 'table'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Table"
                  >
                    <List className="w-4 h-4 mr-1.5" />
                    Table
                  </button>
                  <button
                    onClick={() => setRestaurantViewMode('grid')}
                    className={`flex items-center min-h-[40px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      restaurantViewMode === 'grid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Grid"
                  >
                    <Grid className="w-4 h-4 mr-1.5" />
                    Grid
                  </button>
                </div>
              )}
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