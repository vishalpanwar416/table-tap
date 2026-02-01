import React from 'react';
import {
  MapPin,
  Phone,
  ChefHat,
  Users,
  CreditCard,
  FileText,
  Shield,
  Edit,
  Trash2,
  ExternalLink,
  Star,
  Clock,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Brain,
  ShoppingBag
} from 'lucide-react';

const RestaurantCard = ({
  restaurant,
  onToggleStatus,
  onToggleAI,
  onToggleAggregators,
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
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInDays / 365)} year${Math.floor(diffInDays / 365) > 1 ? 's' : ''} ago`;
  };

  // Get the most recent update timestamp
  const getLastUpdated = () => {
    // Priority: updated_at > created_at > fallback
    const timestamp = restaurant.updated_at || restaurant.created_at;
    return getTimeAgo(timestamp);
  };

  // Get restaurant age
  const getRestaurantAge = () => {
    if (!restaurant.created_at) return 'Recently added';

    const now = new Date();
    const createdAt = new Date(restaurant.created_at);
    const diffInDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Added today';
    } else if (diffInDays === 1) {
      return 'Added yesterday';
    } else if (diffInDays < 7) {
      return `Added ${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Added ${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `Added ${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `Added ${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    onToggleStatus(restaurant.id);
  };

  const handleToggleAI = (e) => {
    e.stopPropagation();
    onToggleAI(restaurant.id);
  };

  const handleToggleAggregators = (e) => {
    e.stopPropagation();
    onToggleAggregators(restaurant.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(restaurant);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      onDelete(restaurant.id);
    }
  };

  return (
    <div
      className={`group relative rounded-2xl shadow-lg overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-[1.02] ${restaurant.is_active
        ? 'bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 border border-gray-200'
        : 'bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 hover:from-red-100 hover:to-pink-100'
        }`}
      onClick={() => onClick(restaurant)}
    >
      {/* Header with Logo and Toggle */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-4">
            {restaurant.logo_url ? (
              <div className="relative">
                <img
                  src={restaurant.logo_url}
                  alt={`${restaurant.name} logo`}
                  className={`w-16 h-16 rounded-2xl object-contain bg-white border-2 transition-all duration-300 ${restaurant.is_active
                    ? 'border-blue-200 group-hover:border-blue-300'
                    : 'border-red-200 opacity-60'
                    }`}
                />
              </div>
            ) : (
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${restaurant.is_active
                ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                : 'bg-gradient-to-r from-red-400 to-pink-400'
                }`}>
                <ChefHat className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <h3 className={`text-xl font-bold transition-all duration-300 ${restaurant.is_active ? 'text-gray-900' : 'text-gray-700'
                }`}>
                {restaurant.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{getRestaurantAge()}</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">{restaurant.cuisine_type || 'Cuisine'}</span>
              </div>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-col space-y-2">
            {/* Status Toggle */}
            <div onClick={handleToggleStatus} className="relative z-10">
              <button
                className={`relative w-16 h-8 rounded-full focus:outline-none transition-all duration-300 shadow-lg group/btn overflow-hidden
                  ${restaurant.is_active
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-200'
                    : 'bg-gradient-to-r from-gray-300 to-gray-400 shadow-gray-200'
                  }
                `}
                aria-label={restaurant.is_active ? 'Deactivate restaurant' : 'Activate restaurant'}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-out
                    ${restaurant.is_active
                      ? 'translate-x-8 shadow-green-100'
                      : 'translate-x-1 shadow-gray-100'
                    }
                  `}
                >
                  {restaurant.is_active ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  ) : (
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  )}
                </div>
              </button>
            </div>

            {/* AI Toggle */}
            <div onClick={handleToggleAI} className="relative z-10">
              <button
                className={`relative w-16 h-8 rounded-full focus:outline-none transition-all duration-300 shadow-lg group/btn overflow-hidden
                  ${restaurant.ai_enabled
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-purple-200'
                    : 'bg-gradient-to-r from-gray-300 to-gray-400 shadow-gray-200'
                  }
                `}
                aria-label={restaurant.ai_enabled ? 'Disable AI analytics' : 'Enable AI analytics'}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-out
                    ${restaurant.ai_enabled
                      ? 'translate-x-8 shadow-purple-100'
                      : 'translate-x-1 shadow-gray-100'
                    }
                  `}
                >
                  {restaurant.ai_enabled ? (
                    <Brain className="w-3 h-3 text-purple-500" />
                  ) : (
                    <Brain className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </button>
            </div>

            {/* Aggregators Toggle */}
            <div onClick={handleToggleAggregators} className="relative z-10">
              <button
                className={`relative w-16 h-8 rounded-full focus:outline-none transition-all duration-300 shadow-lg group/btn overflow-hidden
                  ${restaurant.aggregators_enabled
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-200'
                    : 'bg-gradient-to-r from-gray-300 to-gray-400 shadow-gray-200'
                  }
                `}
                aria-label={restaurant.aggregators_enabled ? 'Disable aggregators' : 'Enable aggregators'}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                    ${restaurant.aggregators_enabled
                      ? 'translate-x-8 shadow-orange-100'
                      : 'translate-x-1 shadow-gray-100'
                    }
                  `}
                >
                  {restaurant.aggregators_enabled ? (
                    <ShoppingBag className="w-3 h-3 text-orange-500" />
                  ) : (
                    <ShoppingBag className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Restaurant Details */}
        <div className={`space-y-3 text-sm transition-all duration-300 ${restaurant.is_active ? 'text-gray-600' : 'text-gray-500'
          }`}>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span className="truncate">{restaurant.address || 'No address provided'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-green-500" />
            <span>{restaurant.contact_phone || 'No phone provided'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-500" />
            <span>{restaurant.staff_count || 0} staff members</span>
          </div>
          {restaurant.opening_hours && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-indigo-500" />
              <span className="truncate">{restaurant.opening_hours}</span>
            </div>
          )}
        </div>

        {/* Aggregator Details */}
        {(restaurant.swiggy_api_key || restaurant.zomato_api_key) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Aggregators</p>
            <div className="flex gap-2">
              {restaurant.swiggy_api_key && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 min-w-fit">
                  <img src="https://www.swiggy.com/favicon.ico" alt="Swiggy" className="w-3 h-3 grayscale group-hover:grayscale-0 transition-all" />
                  <span className="text-[10px] font-bold">Integrated</span>
                </div>
              )}
              {restaurant.zomato_api_key && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded-lg border border-red-100 min-w-fit">
                  <img src="https://www.zomato.com/favicon.ico" alt="Zomato" className="w-3 h-3 grayscale group-hover:grayscale-0 transition-all" />
                  <span className="text-[10px] font-bold">Integrated</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(restaurant.gst_number || restaurant.fssai_license) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Business Details</p>
            <div className="space-y-1">
              {restaurant.gst_number && (
                <div className="flex items-center text-xs text-gray-600">
                  <FileText className="h-3 w-3 mr-2 text-blue-500" />
                  GST: {restaurant.gst_number}
                </div>
              )}
              {restaurant.fssai_license && (
                <div className="flex items-center text-xs text-gray-600">
                  <Shield className="h-3 w-3 mr-2 text-green-500" />
                  FSSAI: {restaurant.fssai_license}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manager Info */}
        {restaurant.manager && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <p className="text-sm font-semibold text-gray-700 mb-2">Manager</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 font-medium">{restaurant.manager.name}</p>
              <p className="text-xs text-gray-500">{restaurant.manager.email}</p>
              {restaurant.manager.phone && (
                <p className="text-xs text-gray-500">{restaurant.manager.phone}</p>
              )}
              {!restaurant.manager.connected && (
                <div className="flex items-center space-x-1 mt-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-orange-600 font-medium">Not connected to user account</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-4 space-y-2">
          {restaurant.cuisine_type && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium mr-2">Cuisine:</span>
              <span>{restaurant.cuisine_type}</span>
            </div>
          )}
          {restaurant.contact_phone && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium mr-2">Phone:</span>
              <span>{restaurant.contact_phone}</span>
            </div>
          )}
          {restaurant.contact_email && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium mr-2">Email:</span>
              <span>{restaurant.contact_email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">
              Last updated: {getLastUpdated()}
            </span>
          </div>
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleEdit}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              title="Edit restaurant"
            >
              <Edit className="h-4 w-4" />
            </button>
            {restaurant.google_maps_link && (
              <a
                href={restaurant.google_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                title="View on Google Maps"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={handleDelete}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Delete restaurant"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard; 