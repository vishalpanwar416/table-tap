import React from 'react';
import { Building2, ChevronDown, ChevronRight, Users, Plus } from 'lucide-react';

const RestaurantStaffHeader = ({ 
  restaurant, 
  restaurantStaff, 
  selectedRestaurantId, 
  setSelectedRestaurantId 
}) => {
  const isExpanded = selectedRestaurantId === restaurant.id;

  return (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-5 border-b border-gray-100 font-spartan">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-sm">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-spartan">{restaurant.name}</h3>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center space-x-1 text-sm text-gray-600 font-spartan">
                <Users className="h-4 w-4" />
                <span>{restaurantStaff.length} staff member{restaurantStaff.length !== 1 ? 's' : ''}</span>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full font-spartan ${
                restaurant.is_active 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {restaurant.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSelectedRestaurantId(isExpanded ? '' : restaurant.id);
            }}
            className="p-2 rounded-lg bg-white/80 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantStaffHeader; 