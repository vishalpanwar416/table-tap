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
  ShoppingBag,
  Mail,
  MessageCircle,
  Power
} from 'lucide-react';

const RestaurantCard = ({
  restaurant,
  onToggleStatus,
  onToggleAI,
  onToggleAggregators,
  onToggleEmailBill,
  onToggleWhatsAppBill,
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

  const FeatureToggle = ({ icon: Icon, label, active, onClick, colorClass, activeBg, activeText }) => (
    <button
      onClick={(e) => handleAction(e, onClick)}
      className={`group flex items-center justify-between p-2 rounded-lg border transition-all duration-200 w-full hover:shadow-md
        ${active ? `${activeBg} ${activeText} border-${colorClass}-200` : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}
      title={active ? `Disable ${label}` : `Enable ${label}`}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${active ? 'bg-white/60' : 'bg-gray-200'} transition-colors`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className={`w-8 h-4 rounded-full relative transition-colors ${active ? `bg-${colorClass}-500` : 'bg-gray-300'}`}>
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${active ? 'left-[18px]' : 'left-0.5'}`} />
      </div>
    </button>
  );

  return (
    <div
      className={`group relative rounded-2xl shadow-lg overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-[1.01] bg-white border border-gray-100 flex flex-col h-full`}
      onClick={() => onClick(restaurant)}
    >
      {/* Status Bar (Top) */}
      <div className={`h-1.5 w-full ${restaurant.is_active ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-200'}`} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header content */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={`${restaurant.name} logo`}
                className="w-12 h-12 rounded-xl object-contain bg-gray-50 border border-gray-100"
              />
            ) : (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${restaurant.is_active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                <ChefHat className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">{restaurant.name}</h3>
              <div className="flex items-center text-xs text-gray-500 mt-0.5 gap-1">
                <span className="truncate max-w-[100px]">{restaurant.cuisine_type || 'Cuisine'}</span>
                <span>•</span>
                <span>{restaurant.staff_count || 0} Staff</span>
              </div>
            </div>
          </div>

          {/* Main Status Toggle (Compact) */}
          <button
            onClick={(e) => handleAction(e, onToggleStatus)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${restaurant.is_active
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
          >
            <Power className="w-3 h-3" />
            {restaurant.is_active ? 'Active' : 'Inactive'}
          </button>
        </div>

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
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-bold text-blue-700">
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
            colorClass="purple"
            activeBg="bg-purple-50"
            activeText="text-purple-700"
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
            icon={Mail}
            label="Email Bill"
            active={restaurant.email_bill_enabled !== false}
            onClick={onToggleEmailBill}
            colorClass="blue"
            activeBg="bg-blue-50"
            activeText="text-blue-700"
          />
          <FeatureToggle
            icon={MessageCircle}
            label="WhatsApp"
            active={restaurant.whatsapp_bill_enabled !== false}
            onClick={onToggleWhatsAppBill}
            colorClass="green"
            activeBg="bg-green-50"
            activeText="text-green-700"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs">
        <span className="text-gray-400">{getLastUpdated()}</span>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={handleEdit} className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md transition-colors border border-transparent hover:border-gray-200">
            <Edit className="w-3.5 h-3.5" />
          </button>
          {restaurant.google_maps_link && (
            <a href={restaurant.google_maps_link} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white hover:text-green-600 rounded-md transition-colors border border-transparent hover:border-gray-200">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button onClick={handleDelete} className="p-1.5 hover:bg-white hover:text-red-600 rounded-md transition-colors border border-transparent hover:border-gray-200">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard; 