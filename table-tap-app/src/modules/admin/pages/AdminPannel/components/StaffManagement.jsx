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
    <div className="space-y-8 font-spartan">
      {/* Enhanced Stats with Add Button */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 font-spartan">Overview</h3>
          <button
            onClick={onAddStaff}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md font-spartan"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="font-medium font-spartan">Add Staff</span>
          </button>
        </div>
        <StaffStats staff={staff} restaurants={restaurants} />
      </div>
      
      {/* View Mode Toggle */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 font-spartan">Staff Members</h3>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 font-spartan">
              {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('restaurant')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'restaurant'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Restaurant View"
              >
                <Building2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Restaurant View Mode Toggle */}
        {viewMode === 'restaurant' && (
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-700 font-spartan">Restaurant Staff</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRestaurantViewMode('table')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  restaurantViewMode === 'table'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRestaurantViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  restaurantViewMode === 'grid'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Staff Views */}
        {viewMode === 'restaurant' ? (
          restaurants.length > 0 ? (
            <div className="space-y-6">
              <div className="text-sm text-gray-500 font-spartan">
                {restaurants.length} restaurants
              </div>
              
              {restaurants.map((restaurant, index) => {
                const restaurantStaff = getRestaurantStaff(restaurant.id);

                return (
                  <div
                    key={restaurant.id}
                    className="transform transition-all duration-300 hover:scale-[1.02]"
                    style={{ animationDelay: `${index * 100}ms` }}
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
            <div className="text-center py-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Building2 className="h-16 w-16 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 font-spartan">No restaurants found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg font-spartan">
                You need to add restaurants before managing staff
              </p>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-spartan">
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

      {/* Enhanced No staff found message */}
      {restaurants.length > 0 && staff.length === 0 && (
        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
          <div className="w-32 h-32 bg-gradient-to-r from-gray-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Users className="h-16 w-16 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 font-spartan">No staff members found</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg font-spartan">
            Get started by adding your first staff member
          </p>
          <button
            onClick={onAddStaff}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-spartan"
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