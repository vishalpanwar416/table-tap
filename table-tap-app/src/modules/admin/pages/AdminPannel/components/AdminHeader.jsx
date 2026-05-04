import React, { useState } from 'react';
import {
  Search,
  Bell,
  Building2,
  Users,
  X,
  Filter,
  ChevronDown,
  RefreshCw,
  ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminNotificationBell from './AdminNotificationBell';

const AdminHeader = ({
  activeTab,
  searchTerm,
  setSearchTerm,
  restaurants = [],
  staff = [],
  currentUser,
  selectedRestaurantId,
  setSelectedRestaurantId,
  selectedCuisineType,
  setSelectedCuisineType,
  selectedStaffRole,
  setSelectedStaffRole,
  selectedConnectionStatus,
  setSelectedConnectionStatus,
  onTabChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Calculate real-time statistics
  const getStats = () => {
    const totalRestaurants = restaurants.length;
    const activeRestaurants = restaurants.filter((r) => r.is_active).length;
    const totalStaff = staff.length;
    const connectedStaff = staff.filter((s) => s.connected).length;

    return {
      totalRestaurants,
      activeRestaurants,
      totalStaff,
      connectedStaff,
    };
  };

  const stats = getStats();

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedRestaurantId('');
    setSelectedCuisineType('');
    if (setSelectedStaffRole) {
      setSelectedStaffRole('');
    }
    if (setSelectedConnectionStatus) {
      setSelectedConnectionStatus('');
    }
  };

  const hasFilters =
    searchTerm ||
    selectedRestaurantId ||
    selectedCuisineType ||
    selectedStaffRole ||
    selectedConnectionStatus;

  // Get unique cuisine types from restaurants
  const cuisineTypes = [...new Set(restaurants.map((r) => r.cuisine_type).filter(Boolean))];

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const searchMatch =
      !searchTerm ||
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.contact_phone?.includes(searchTerm) ||
      restaurant.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch =
      !selectedRestaurantId ||
      (selectedRestaurantId === 'active' && restaurant.is_active) ||
      (selectedRestaurantId === 'inactive' && !restaurant.is_active);

    return searchMatch && statusMatch;
  });

  const filteredStaff = staff.filter((staffMember) => {
    const searchMatch =
      !searchTerm ||
      staffMember.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staffMember.phone_number &&
        typeof staffMember.phone_number === 'string' &&
        staffMember.phone_number.includes(searchTerm)) ||
      staffMember.role?.toLowerCase().includes(searchTerm.toLowerCase());

    const restaurantMatch =
      !selectedRestaurantId || staffMember.restaurant_id === selectedRestaurantId;

    return searchMatch && restaurantMatch;
  });

  return (
    <div className="bg-white border-b border-gray-200 z-20 px-4 py-3 relative font-spartan">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-orange-500 transition-colors p-1.5 rounded-lg hover:bg-orange-50"
            title="Go Back"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-spartan leading-tight">
              {{
                restaurants: 'Restaurants',
                registrations: 'Registrations',
                staff: 'Staff Management',
                inquiries: 'Lead Inquiries',
                subscriptions: 'Subscriptions',
                notifications: 'Notifications',
                activity: 'Activity Logs',
                settings: 'System Settings',
              }[activeTab] || 'Admin Panel'}
            </h2>
            <p className="text-xs text-gray-500 font-spartan">
              {activeTab === 'restaurants' &&
                `${stats.totalRestaurants} restaurants • ${stats.activeRestaurants} active`}
              {activeTab === 'staff' &&
                `${stats.totalStaff} staff • ${stats.connectedStaff} connected`}
              {activeTab === 'registrations' && 'Manage registration requests'}
              {activeTab === 'inquiries' && 'View and manage lead inquiries'}
              {activeTab === 'subscriptions' && 'Manage subscription plans'}
              {activeTab === 'activity' && 'System events and admin activities'}
              {activeTab === 'settings' && 'API keys and global configuration'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Unified Search and Filter Section */}
          {/* Unified Search and Filter Section - Only for Restaurants, Staff, Registrations, Inquiries, Notifications and Activity */}
          {(activeTab === 'restaurants' ||
            activeTab === 'staff' ||
            activeTab === 'registrations' ||
            activeTab === 'inquiries' ||
            activeTab === 'notifications' ||
            activeTab === 'activity') && (
            <div className="flex items-center space-x-2">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="search"
                  placeholder={`Search ${activeTab === 'restaurants' ? 'restaurants' : activeTab === 'staff' ? 'staff' : activeTab === 'registrations' ? 'registrations' : activeTab === 'notifications' ? 'notifications' : activeTab === 'activity' ? 'activities' : 'leads'}...`}
                  className="block w-full pl-8 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 bg-gray-50 transition-all duration-200 font-spartan"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 font-spartan ${
                    hasFilters
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span className="font-medium font-spartan">Filter</span>
                  {hasFilters && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Filter Dropdown */}
                {showFilters && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4 font-spartan">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-900 font-spartan">
                          {{
                            restaurants: 'Filter Restaurants',
                            staff: 'Filter Staff',
                            registrations: 'Search Registrations',
                            inquiries: 'Search Leads',
                            notifications: 'Filter Notifications',
                            activity: 'Filter Activities',
                          }[activeTab] || 'Filters'}
                        </h3>
                        {hasFilters && (
                          <button
                            onClick={handleClearFilters}
                            className="text-sm text-gray-600 hover:text-gray-700 font-spartan"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Status/Restaurant Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                            {activeTab === 'restaurants' ? 'Status' : 'Restaurant'}
                          </label>
                          <select
                            value={selectedRestaurantId}
                            onChange={(e) => setSelectedRestaurantId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent font-spartan"
                          >
                            <option value="" className="font-spartan">
                              {activeTab === 'restaurants' ? 'All Status' : 'All Restaurants'}
                            </option>
                            {activeTab === 'restaurants' ? (
                              <>
                                <option value="active" className="font-spartan">
                                  Active Only
                                </option>
                                <option value="inactive" className="font-spartan">
                                  Inactive Only
                                </option>
                              </>
                            ) : (
                              restaurants.map((restaurant) => (
                                <option
                                  key={restaurant.id}
                                  value={restaurant.id}
                                  className="font-spartan"
                                >
                                  {restaurant.name}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* Cuisine Type Filter (Restaurants only) */}
                        {activeTab === 'restaurants' && cuisineTypes.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                              Cuisine Type
                            </label>
                            <select
                              value={selectedCuisineType}
                              onChange={(e) => setSelectedCuisineType(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent font-spartan"
                            >
                              <option value="" className="font-spartan">
                                All Cuisines
                              </option>
                              {cuisineTypes.map((cuisine) => (
                                <option key={cuisine} value={cuisine} className="font-spartan">
                                  {cuisine}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Staff Role Filter (Staff only) */}
                        {activeTab === 'staff' && setSelectedStaffRole && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                              Role
                            </label>
                            <select
                              value={selectedStaffRole}
                              onChange={(e) => setSelectedStaffRole(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent font-spartan"
                            >
                              <option value="" className="font-spartan">
                                All Roles
                              </option>
                              <option value="manager" className="font-spartan">
                                Manager
                              </option>
                              <option value="captain" className="font-spartan">
                                Captain
                              </option>
                            </select>
                          </div>
                        )}

                        {/* Connection Status Filter (Staff only) */}
                        {activeTab === 'staff' && setSelectedConnectionStatus && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                              Connection Status
                            </label>
                            <select
                              value={selectedConnectionStatus}
                              onChange={(e) => setSelectedConnectionStatus(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent font-spartan"
                            >
                              <option value="" className="font-spartan">
                                All Status
                              </option>
                              <option value="connected" className="font-spartan">
                                Connected
                              </option>
                              <option value="disconnected" className="font-spartan">
                                Disconnected
                              </option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-500 font-spartan">
            {activeTab === 'restaurants' ? (
              <>
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                <span>
                  {stats.activeRestaurants}/{stats.totalRestaurants} Active
                </span>
              </>
            ) : (
              <>
                <Users className="h-3.5 w-3.5 text-orange-400" />
                <span>
                  {stats.connectedStaff}/{stats.totalStaff} Connected
                </span>
              </>
            )}
          </div>

          {/* Admin Notifications */}
          <AdminNotificationBell onTabChange={onTabChange} />
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
