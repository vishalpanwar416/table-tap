import React from 'react';
import { Filter } from 'lucide-react';

const StaffTableHeader = ({ selectedRestaurantId, setSelectedRestaurantId, restaurants = [] }) => {
  return (
    <div className="p-6 border-b border-gray-200 font-spartan">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-spartan"
            >
              <option value="" className="font-spartan">All Restaurants</option>
              {restaurants && restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id} className="font-spartan">
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffTableHeader; 