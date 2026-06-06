import React, { useState } from 'react';
import {
  MapPin,
  ChefHat,
  Users,
  CreditCard,
  FileText,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Brain,
  ShoppingBag,
  Power,
  Crown,
  Zap,
  Package,
  AlertTriangle,
} from 'lucide-react';

const RestaurantCard = ({
  restaurant,
  onToggleStatus,
  onToggleAI,
  onToggleAggregators,
  onToggleOnlineBill,
  onEdit,
  onDelete,
  onClick,
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
    if (diffInDays < 30)
      return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    if (diffInDays < 365)
      return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInDays / 365)} year${Math.floor(diffInDays / 365) > 1 ? 's' : ''} ago`;
  };

  // Get the most recent update timestamp
  const getLastUpdated = () => {
    const timestamp = restaurant.updated_at || restaurant.created_at;
    return getTimeAgo(timestamp);
  };

  const handleClick = (e) => {
    // On mobile, toggle expansion
    if (window.innerWidth < 768) {
      setExpanded(!expanded);
    } else {
      // On desktop, navigate
      onClick(restaurant);
    }
  };

  const [expanded, setExpanded] = useState(false);

  // Get restaurant age
  const getRestaurantAge = () => {
    if (!restaurant.created_at) return 'Recently added';
    const now = new Date();
    const createdAt = new Date(restaurant.created_at);
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

  const handleAction = (e, action) => {
    e.stopPropagation();
    action(restaurant.id);
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

  const FeatureToggle = ({
    icon: Icon,
    label,
    active,
    onClick,
    colorClass,
    activeBg,
    activeText,
  }) => (
    <button
      onClick={(e) => handleAction(e, onClick)}
      className={`group flex items-center justify-between p-2 rounded-lg border transition-all duration-200 w-full hover:shadow-md
        ${active ? `${activeBg} ${activeText} border-${colorClass}-200` : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}
      title={active ? `Disable ${label}` : `Enable ${label}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`p-1.5 rounded-md ${active ? 'bg-white/60' : 'bg-gray-200'} transition-colors`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div
        className={`w-8 h-4 rounded-full relative transition-colors ${active ? `bg-${colorClass}-500` : 'bg-gray-300'}`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${active ? 'left-[18px]' : 'left-0.5'}`}
        />
      </div>
    </button>
  );

  const isInactive = !restaurant.is_active;

  return (
    <div
      className={`group relative rounded-2xl shadow-lg overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-[1.01] flex flex-col h-full ${isInactive ? 'bg-red-50/80 border-2 border-red-200' : 'bg-white border border-gray-100'} ${expanded ? 'bg-white z-10' : ''}`}
      onClick={handleClick}
    >
      {/* Status Bar (Top) */}
      <div className={`h-1.5 w-full ${restaurant.is_active ? ' ' : ' '}`} />

      <div className="p-4 flex-1 flex flex-col">
        {/* Header content */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={`${restaurant.name} logo`}
                className="w-12 h-12 rounded-xl object-contain bg-gray-50 border border-gray-100"
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${restaurant.is_active ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-500'}`}
              >
                <ChefHat className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3
                className={`font-bold leading-tight ${isInactive ? 'text-red-800' : 'text-gray-900'}`}
              >
                {restaurant.name}
              </h3>
              <div className="flex items-center text-xs text-gray-500 mt-0.5 gap-1">
                <span className="truncate max-w-[100px]">
                  {restaurant.cuisine_type || 'Cuisine'}
                </span>
                <span>•</span>
                <span>{restaurant.staff_count || 0} Staff</span>
              </div>
            </div>
          </div>

          {/* Main Status Toggle (Compact) */}
          <button
            onClick={(e) => handleAction(e, onToggleStatus)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
              restaurant.is_active
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            <Power className="w-3 h-3" />
            {restaurant.is_active ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {/* Expandable Content (Mobile: Hidden unless expanded, Desktop: Always visible) */}
      <div className={`${expanded ? 'block' : 'hidden'} md:block px-4 pb-4`}>
        {/* Active Plan Badge - Dynamic */}
        {restaurant.subscription ? (
          <div
            className={`mb-3 flex items-center justify-between p-2.5 rounded-xl border ${
              restaurant.subscription.plan_name?.toLowerCase().includes('enterprise')
                ? '  border-amber-200'
                : restaurant.subscription.plan_name?.toLowerCase().includes('pro')
                  ? '  border-orange-200'
                  : '  border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {restaurant.subscription.plan_name?.toLowerCase().includes('enterprise') ? (
                <Crown className="w-4 h-4 text-amber-600" />
              ) : restaurant.subscription.plan_name?.toLowerCase().includes('pro') ? (
                <Zap className="w-4 h-4 text-orange-600" />
              ) : (
                <Package className="w-4 h-4 text-gray-600" />
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold capitalize ${
                      restaurant.subscription.plan_name?.toLowerCase().includes('enterprise')
                        ? 'text-amber-700'
                        : restaurant.subscription.plan_name?.toLowerCase().includes('pro')
                          ? 'text-orange-700'
                          : 'text-gray-700'
                    }`}
                  >
                    {restaurant.subscription.plan_name} Plan
                  </span>
                  {restaurant.subscription.billing_cycle && (
                    <span className="text-[10px] text-gray-500">
                      ({restaurant.subscription.billing_cycle})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {restaurant.subscription.status === 'grace_period' && (
                    <span className="flex items-center gap-1 text-[9px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Grace
                    </span>
                  )}
                  {restaurant.subscription.end_date && (
                    <span className="text-[9px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(restaurant.subscription.end_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">No active plan</span>
          </div>
        )}

        {/* Info Grid */}
        <div className="space-y-2 mb-4">
          {restaurant.address && (
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
              <span className="line-clamp-1">{restaurant.address}</span>
            </div>
          )}
          {/* Owner/Manager Info */}
          {restaurant.manager && (
            <div className="flex flex-col gap-1 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-gray-600" />
                <span className="font-bold text-gray-700">
                  {restaurant.manager.role === 'owner' ||
                  restaurant.manager.name?.includes('(Owner)')
                    ? 'Owner:'
                    : 'Manager:'}
                </span>
                <span className="font-medium truncate">{restaurant.manager.name}</span>
              </div>
              <div className="pl-5 text-gray-400 text-[10px] truncate">
                {restaurant.manager.email}
              </div>
            </div>
          )}
        </div>

        {/* Feature Toggles Grid */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <FeatureToggle
            icon={Brain}
            label="AI Features"
            active={restaurant.ai_enabled}
            onClick={onToggleAI}
            colorClass="purple"
            activeBg="bg-orange-50"
            activeText="text-orange-700"
          />
          <FeatureToggle
            icon={ShoppingBag}
            label="Aggregators"
            active={restaurant.aggregators_enabled}
            onClick={onToggleAggregators}
            colorClass="orange"
            activeBg="bg-orange-50"
            activeText="text-orange-700"
          />
          <FeatureToggle
            icon={FileText}
            label="Online Bill"
            active={
              restaurant.billing_features_enabled !== false ||
              restaurant.online_bill_enabled !== false
            }
            onClick={onToggleOnlineBill}
            colorClass="blue"
            activeBg="bg-gray-50"
            activeText="text-gray-700"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div
        className={`${expanded ? 'flex' : 'hidden'} md:flex px-4 py-3 bg-gray-50 border-t border-gray-100 justify-between items-center text-xs`}
      >
        <span className="text-gray-400">{getLastUpdated()}</span>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Add explicit navigate button for mobile expanded view */}
          <button
            onClick={() => onClick(restaurant)}
            className="md:hidden p-1.5 hover:bg-white hover:text-gray-600 rounded-md transition-colors border border-transparent hover:border-gray-200"
            title="Open Dashboard"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleEdit}
            className="p-1.5 hover:bg-white hover:text-gray-600 rounded-md transition-colors border border-transparent hover:border-gray-200"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          {restaurant.google_maps_link && (
            <a
              href={restaurant.google_maps_link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-white hover:text-green-600 rounded-md transition-colors border border-transparent hover:border-gray-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-white hover:text-red-600 rounded-md transition-colors border border-transparent hover:border-gray-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
