import React, { useState } from 'react';
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
  ShoppingBag,
  Mail,
  MessageCircle,
  Power,
  Crown,
  Zap,
  Package,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RestaurantCard = ({
  restaurant,
  onToggleStatus,
  onToggleAI,
  onToggleAggregators,
  onToggleOnlineBill,
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

  const FeatureToggle = ({ icon: Icon, label, active, onClick, colorClass }) => {
    const colorMap = {
      primary: {
        bg: 'bg-primary-500',
        light: 'bg-primary-50',
        text: 'text-primary-600',
        border: 'border-primary-200',
        shadow: 'shadow-primary-100/50'
      },
      amber: {
        bg: 'bg-amber-500',
        light: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        shadow: 'shadow-amber-100/50'
      }
    };

    const colors = colorMap[colorClass] || colorMap.primary;

    return (
      <button
        onClick={(e) => handleAction(e, onClick)}
        className={`group flex items-center justify-between p-2.5 md:p-3 rounded-xl border transition-all duration-300 w-full
          ${active 
            ? `bg-white ${colors.border} shadow-sm ${colors.shadow}` 
            : 'bg-slate-50/50 text-slate-400 border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`}
      >
        <div className="flex items-center gap-2 md:gap-2.5">
          <div className={`p-1.5 md:p-2 rounded-lg transition-all duration-300 ${active ? `${colors.light} ${colors.text}` : 'bg-slate-100 text-slate-400'}`}>
            <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
          <span className={`text-[10px] md:text-xs font-bold transition-colors ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
        </div>
        
        <div className={`w-8 h-4.5 md:w-9 md:h-5 rounded-full relative transition-colors duration-300 p-1 ${active ? colors.bg : 'bg-slate-200'}`}>
          <motion.div
            animate={{ x: active ? (window.innerWidth < 768 ? 14 : 16) : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="w-2.5 h-2.5 md:w-3 md:h-3 bg-white rounded-full shadow-sm"
          />
        </div>
      </button>
    );
  };

  const isInactive = !restaurant.is_active;

  return (
    <div
      className={`group relative rounded-2xl shadow-lg overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-[1.01] flex flex-col h-full ${isInactive ? 'bg-red-50/80 border-2 border-red-200' : 'bg-white border border-slate-100'} ${expanded ? 'bg-white z-10' : ''}`}
      onClick={handleClick}
    >
      {/* Status Bar (Top) */}
      <div className={`h-1.5 w-full transition-colors duration-500 ${restaurant.is_active ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500' : 'bg-gradient-to-r from-rose-500 to-red-600'}`} />

      <div className="p-3 md:p-5 flex-1 flex flex-col">
        {/* Header content - Optimized for space */}
        <div className="flex justify-between items-center mb-2 md:mb-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={`${restaurant.name} logo`}
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-contain bg-slate-50 border border-slate-100 shadow-sm"
              />
            ) : (
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-colors ${restaurant.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>
                <ChefHat className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            )}
            <div className="overflow-hidden">
              <h3 className={`font-bold leading-tight truncate text-sm md:text-base ${isInactive ? 'text-rose-900' : 'text-slate-900'}`}>{restaurant.name}</h3>
              <div className="flex items-center text-[10px] md:text-xs text-slate-500 mt-0.5 gap-1.5">
                <span className="truncate max-w-[80px] md:max-w-[120px]">{restaurant.cuisine_type || 'Cuisine'}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {restaurant.staff_count || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Actions - Always visible on desktop, visible on expand for mobile */}
            <div className="hidden sm:flex items-center gap-1 mr-1">
              <button
                onClick={handleEdit}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                title="Edit Restaurant"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => handleAction(e, onToggleStatus)}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out shadow-inner ${
                  restaurant.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <motion.div
                  initial={false}
                  animate={{ 
                    x: restaurant.is_active ? 20 : 2,
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 600, 
                    damping: 35
                  }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Content (Mobile: Hidden unless expanded, Desktop: Always visible) */}
      <div className={`${expanded ? 'block' : 'hidden'} md:block px-3 pb-3 md:px-5 md:pb-5`}>
        {/* Active Plan Badge - Dynamic */}
        {restaurant.subscription ? (
          <div className={`mb-3 flex items-center justify-between p-2.5 rounded-xl border ${restaurant.subscription.plan_name?.toLowerCase().includes('enterprise')
              ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
              : restaurant.subscription.plan_name?.toLowerCase().includes('pro')
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                : 'bg-gradient-to-r from-primary-50 to-sky-50 border-primary-200'
            }`}>
            <div className="flex items-center gap-2">
              {restaurant.subscription.plan_name?.toLowerCase().includes('enterprise') ? (
                <Crown className="w-4 h-4 text-amber-600" />
              ) : restaurant.subscription.plan_name?.toLowerCase().includes('pro') ? (
                <Zap className="w-4 h-4 text-amber-500" />
              ) : (
                <Package className="w-4 h-4 text-primary-600" />
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold capitalize ${restaurant.subscription.plan_name?.toLowerCase().includes('enterprise')
                      ? 'text-amber-700'
                      : restaurant.subscription.plan_name?.toLowerCase().includes('pro')
                        ? 'text-amber-700'
                        : 'text-primary-700'
                    }`}>
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
                      {new Date(restaurant.subscription.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
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
            <div className="flex flex-col gap-1 text-xs text-gray-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-primary-500" />
                <span className="font-bold text-primary-700">
                  {(restaurant.manager.role === 'owner' || restaurant.manager.name?.includes('(Owner)')) ? 'Owner:' : 'Manager:'}
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
            colorClass="primary"
          />
          <FeatureToggle
            icon={ShoppingBag}
            label="Aggregators"
            active={restaurant.aggregators_enabled}
            onClick={onToggleAggregators}
            colorClass="primary"
          />
          <FeatureToggle
            icon={FileText}
            label="Online Bill"
            active={restaurant.billing_features_enabled !== false || restaurant.online_bill_enabled !== false}
            onClick={onToggleOnlineBill}
            colorClass="amber"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className={`${expanded ? 'flex' : 'hidden'} md:flex px-3 py-2 md:px-5 md:py-3 bg-slate-50 border-t border-slate-100 justify-between items-center text-xs`}>
        <span className="text-gray-400">{getLastUpdated()}</span>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Add explicit navigate button for mobile expanded view */}
          <button onClick={() => onClick(restaurant)} className="md:hidden p-1.5 hover:bg-white hover:text-primary-600 rounded-md transition-colors border border-transparent hover:border-slate-200" title="Open Dashboard">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleEdit} className="p-1.5 hover:bg-white hover:text-primary-600 rounded-md transition-colors border border-transparent hover:border-slate-200">
            <Edit className="w-3.5 h-3.5" />
          </button>
          {restaurant.google_maps_link && (
            <a href={restaurant.google_maps_link} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white hover:text-green-600 rounded-md transition-colors border border-transparent hover:border-slate-200">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button onClick={handleDelete} className="p-1.5 hover:bg-white hover:text-red-600 rounded-md transition-colors border border-transparent hover:border-slate-200">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div >
  );
};

export default RestaurantCard; 