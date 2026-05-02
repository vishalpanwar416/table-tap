import React, { useState } from 'react';
import { ChevronDown, ChevronRight, UserPlus, Users } from 'lucide-react';
import StaffMobileCard from './StaffMobileCard';

const StaffMobileView = ({ 
  restaurants, 
  staff, 
  searchTerm, 
  selectedRestaurantId, 
  setSelectedRestaurantId, 
  onEdit, 
  onDelete, 
  onAddStaff 
}) => {
  const [expandedRestaurants, setExpandedRestaurants] = useState(new Set());

  const toggleRestaurant = (restaurantId) => {
    const newExpanded = new Set(expandedRestaurants);
    if (newExpanded.has(restaurantId)) {
      newExpanded.delete(restaurantId);
    } else {
      newExpanded.add(restaurantId);
    }
    setExpandedRestaurants(newExpanded);
  };

  const getFilteredRestaurantStaff = (restaurant) => {
    const restaurantStaff = staff.filter(s => s.restaurant_id === restaurant.id);
    return restaurantStaff.filter(member =>
      (!selectedRestaurantId || member.restaurant_id === selectedRestaurantId) &&
      (
        (member?.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member?.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member?.restaurant_name && member.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );
  };

  const shouldShowRestaurant = (restaurant) => {
    const restaurantStaff = staff.filter(s => s.restaurant_id === restaurant.id);
    const filteredRestaurantStaff = getFilteredRestaurantStaff(restaurant);

    // Skip if no staff and we're filtering by restaurant
    if (selectedRestaurantId && restaurant.id !== selectedRestaurantId) return false;
    
    // Skip if no staff match the search criteria
    if (searchTerm && filteredRestaurantStaff.length === 0) return false;

    return true;
  };

  return (
    <div className="space-y-4">
      {restaurants
        .filter(shouldShowRestaurant)
        .map(restaurant => {
          const restaurantStaff = staff.filter(s => s.restaurant_id === restaurant.id);
          const filteredRestaurantStaff = getFilteredRestaurantStaff(restaurant);
          const isExpanded = expandedRestaurants.has(restaurant.id);

          return (
            <div key={restaurant.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Restaurant Header */}
              <div 
                className="p-4 bg-gray-50 border-b cursor-pointer"
                onClick={() => toggleRestaurant(restaurant.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                      <p className="text-sm text-gray-600">
                        {restaurantStaff.length} staff member{restaurantStaff.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      restaurant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {restaurant.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Staff Cards */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {filteredRestaurantStaff.length > 0 ? (
                    filteredRestaurantStaff.map(member => (
                      <StaffMobileCard
                        key={member.id}
                        member={member}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))
                  ) : restaurantStaff.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-r from-primary-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="h-8 w-8 text-primary-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        No staff members
                      </h4>
                      <p className="text-gray-600 mb-4">
                        No staff members have been added to {restaurant.name} yet.
                      </p>
                      <button
                        onClick={() => onAddStaff(restaurant.id)}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Staff Member
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No staff members match your search criteria.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default StaffMobileView; 