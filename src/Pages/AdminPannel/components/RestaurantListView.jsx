import React from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Users, 
  Clock, 
  Calendar,
  Edit, 
  Trash2, 
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Brain
} from 'lucide-react';

const RestaurantListView = ({ 
  restaurants, 
  onToggleStatus, 
  onToggleAI,
  onEdit, 
  onDelete, 
  onClick 
}) => {
  // Function to format time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const now = new Date();
    const updatedAt = new Date(timestamp);
    const diffInMs = now - updatedAt;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
    return `${Math.floor(diffInDays / 365)}y ago`;
  };

  // Get restaurant age
  const getRestaurantAge = () => {
    if (!restaurants.created_at) return 'Recently added';
    
    const now = new Date();
    const createdAt = new Date(restaurants.created_at);
    const diffInDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Added today';
    if (diffInDays === 1) return 'Added yesterday';
    if (diffInDays < 7) return `Added ${diffInDays} days ago`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Added ${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `Added ${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(diffInDays / 365);
    return `Added ${years} year${years > 1 ? 's' : ''} ago`;
  };

  const handleToggleStatus = (e, restaurant) => {
    e.stopPropagation();
    onToggleStatus(restaurant.id);
  };

  const handleToggleAI = (e, restaurant) => {
    e.stopPropagation();
    onToggleAI(restaurant.id);
  };

  const handleEdit = (e, restaurant) => {
    e.stopPropagation();
    onEdit(restaurant);
  };

  const handleDelete = (e, restaurant) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      onDelete(restaurant.id);
    }
  };

  return (
    <div className="overflow-hidden">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 font-spartan">
            <div className="col-span-3">Restaurant</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-1">Staff</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">AI</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {restaurants.map((restaurant, index) => (
            <div
              key={restaurant.id}
              onClick={() => onClick(restaurant)}
              className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Restaurant Info */}
                <div className="col-span-3">
                  <div className="flex items-center space-x-3">
                    {restaurant.logo_url ? (
                      <img 
                        src={restaurant.logo_url} 
                        alt={`${restaurant.name} logo`}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        restaurant.is_active 
                          ? 'bg-blue-500' 
                          : 'bg-gray-400'
                      }`}>
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 font-spartan">
                        {restaurant.name}
                      </h4>
                      <p className="text-sm text-gray-500 font-spartan">
                        {restaurant.cuisine_type || 'Cuisine'}
                      </p>
                      <p className="text-xs text-gray-400 font-spartan">
                        {getTimeAgo(restaurant.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 font-spartan truncate">
                      {restaurant.address || 'No address'}
                    </span>
                  </div>
                </div>

                {/* Contact */}
                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 font-spartan">
                        {restaurant.contact_phone || 'No phone'}
                      </span>
                    </div>
                    {restaurant.contact_email && (
                      <p className="text-xs text-gray-500 font-spartan truncate">
                        {restaurant.contact_email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Staff Count */}
                <div className="col-span-1">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 font-spartan">
                      {restaurant.staff_count || 0}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                      restaurant.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        restaurant.is_active ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="font-spartan">
                        {restaurant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {/* Status Toggle */}
                    <button
                      onClick={(e) => handleToggleStatus(e, restaurant)}
                      className={`relative w-12 h-6 rounded-full focus:outline-none transition-all duration-300 ${
                        restaurant.is_active
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                          restaurant.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* AI Status */}
                <div className="col-span-1">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                      restaurant.ai_enabled
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Brain className={`w-3 h-3 ${
                        restaurant.ai_enabled ? 'text-purple-500' : 'text-gray-400'
                      }`} />
                      <span className="font-spartan">
                        {restaurant.ai_enabled ? 'AI On' : 'AI Off'}
                      </span>
                    </div>
                    
                    {/* AI Toggle */}
                    <button
                      onClick={(e) => handleToggleAI(e, restaurant)}
                      className={`relative w-12 h-6 rounded-full focus:outline-none transition-all duration-300 ${
                        restaurant.ai_enabled
                          ? 'bg-purple-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                          restaurant.ai_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleEdit(e, restaurant)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit restaurant"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, restaurant)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete restaurant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {restaurant.google_maps_link && (
                      <a
                        href={restaurant.google_maps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="View on Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {restaurants.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 font-spartan">
              No restaurants found
            </h3>
            <p className="text-gray-500 font-spartan">
              Get started by adding your first restaurant
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantListView; 