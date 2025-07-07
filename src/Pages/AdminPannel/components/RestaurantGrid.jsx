import React from 'react';
import RestaurantCard from './RestaurantCard';
import { Plus } from 'lucide-react';

const RestaurantGrid = ({ 
  restaurants, 
  loading, 
  onAddRestaurant, 
  onToggleStatus, 
  onEdit, 
  onDelete, 
  onClick 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-spartan">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 font-spartan">
            Restaurant Management
          </h3>
          <p className="text-sm text-gray-600 font-spartan">
            Manage all restaurants in your network
          </p>
        </div>
        <button
          onClick={onAddRestaurant}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-spartan"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium font-spartan">Add Restaurant</span>
        </button>
      </div>

      {/* Grid */}
      {restaurants.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2 font-spartan">No restaurants yet</h3>
          <p className="text-gray-600 mb-4 font-spartan">
            Get started by adding your first restaurant
          </p>
          <button
            onClick={onAddRestaurant}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-spartan"
          >
            Add Restaurant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantGrid; 