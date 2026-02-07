import React, { useState } from 'react';
import { Search, Bell, Building2, Users, X, Filter, ChevronDown, RefreshCw, TrendingUp, MapPin, Clock, Star, Menu } from 'lucide-react';
import AdminNotificationBell from './AdminNotificationBell';

const MobileAdminHeader = ({
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
  onMenuToggle,
  onTabChange
}) => {
  const [showFilters, setShowFilters] = useState(false);

  // Calculate comprehensive restaurant statistics
  const getRestaurantStats = () => {
    const totalRestaurants = restaurants.length;
    const activeRestaurants = restaurants.filter(r => r.is_active).length;
    const inactiveRestaurants = totalRestaurants - activeRestaurants;

    // Cuisine type distribution
    const cuisineTypes = [...new Set(restaurants.map(r => r.cuisine_type).filter(Boolean))];
    const cuisineDistribution = cuisineTypes.length;

    // Location analysis
    const restaurantsWithLocation = restaurants.filter(r => r.location).length;
    const locationPercentage = totalRestaurants > 0 ? Math.round((restaurantsWithLocation / totalRestaurants) * 100) : 0;

    // Contact information completeness
    const restaurantsWithPhone = restaurants.filter(r => r.contact_phone).length;
    const restaurantsWithEmail = restaurants.filter(r => r.contact_email).length;
    const restaurantsWithCompleteContact = restaurants.filter(r => r.contact_phone && r.contact_email).length;

    // Recent activity (restaurants created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRestaurants = restaurants.filter(r => {
      const createdDate = new Date(r.created_at);
      return createdDate > thirtyDaysAgo;
    }).length;

    return {
      totalRestaurants,
      activeRestaurants,
      inactiveRestaurants,
      cuisineDistribution,
      restaurantsWithLocation,
      locationPercentage,
      restaurantsWithPhone,
      restaurantsWithEmail,
      restaurantsWithCompleteContact,
      recentRestaurants
    };
  };

  // Calculate staff statistics
  const getStaffStats = () => {
    const totalStaff = staff.length;
    const connectedStaff = staff.filter(s => s.connected).length;
    const disconnectedStaff = totalStaff - connectedStaff;

    // Role distribution - updated for manager and captain only
    const managers = staff.filter(s => s.role === 'manager').length;
    const captains = staff.filter(s => s.role === 'captain').length;
    const otherStaff = staff.filter(s => !['manager', 'captain'].includes(s.role)).length;

    return {
      totalStaff,
      connectedStaff,
      disconnectedStaff,
      managers,
      captains,
      otherStaff
    };
  };

  const restaurantStats = getRestaurantStats();
  const staffStats = getStaffStats();

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

  const hasFilters = searchTerm || selectedRestaurantId || selectedCuisineType || selectedStaffRole || selectedConnectionStatus;

  // Get unique cuisine types from restaurants
  const cuisineTypes = [...new Set(restaurants.map(r => r.cuisine_type).filter(Boolean))];

  return (
    <div className="md:hidden bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm z-20 sticky top-0 font-spartan">
      {/* Main Header Bar */}
      <div className="flex items-center justify-between p-4">
        {/* Left: Menu Button and Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>

          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-spartan">
              {{
                restaurants: 'Restaurants',
                registrations: 'Registrations',
                staff: 'Staff Management',
                inquiries: 'Lead Inquiries',
                subscriptions: 'Subscriptions'
              }[activeTab] || 'Admin Panel'}
            </h2>
            <p className="text-xs text-gray-600 font-spartan">
              {activeTab === 'restaurants' && `${restaurantStats.totalRestaurants} total • ${restaurantStats.activeRestaurants} active`}
              {activeTab === 'staff' && `${staffStats.totalStaff} total • ${staffStats.connectedStaff} online`}
              {activeTab === 'registrations' && 'Manage registration requests'}
              {activeTab === 'inquiries' && 'View lead inquiries'}
              {activeTab === 'subscriptions' && 'Manage subscriptions'}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Search Button */}
          {/* Search Button - Only for Restaurants, Staff, Registrations and Inquiries */}
          {(activeTab === 'restaurants' || activeTab === 'staff' || activeTab === 'registrations' || activeTab === 'inquiries') && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
          )}

          {/* Admin Notifications */}
          <AdminNotificationBell onTabChange={onTabChange} />
        </div>
      </div>

      {/* Search and Filter Section - Only for Restaurants, Staff, Registrations and Inquiries */}
      {showFilters && (activeTab === 'restaurants' || activeTab === 'staff' || activeTab === 'registrations' || activeTab === 'inquiries') && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 font-spartan">
                {activeTab === 'registrations' ? 'Search Registrations' : activeTab === 'inquiries' ? 'Search Leads' : `Filter ${activeTab === 'restaurants' ? 'Restaurants' : 'Staff'}`}
              </h3>
              {hasFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-spartan"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="search"
                  placeholder={`Search ${activeTab === 'restaurants' ? 'restaurants' : activeTab === 'staff' ? 'staff' : activeTab === 'registrations' ? 'registrations' : 'leads'}...`}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/70 font-spartan"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status/Restaurant Filter - Only for Restaurants and Staff */}
              {(activeTab === 'restaurants' || activeTab === 'staff') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                    {activeTab === 'restaurants' ? 'Status' : 'Restaurant'}
                  </label>
                  <select
                    value={selectedRestaurantId}
                    onChange={(e) => setSelectedRestaurantId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  >
                    <option value="" className="font-spartan">
                      {activeTab === 'restaurants' ? 'All Status' : 'All Restaurants'}
                    </option>
                    {activeTab === 'restaurants' ? (
                      <>
                        <option value="active" className="font-spartan">Active Only</option>
                        <option value="inactive" className="font-spartan">Inactive Only</option>
                      </>
                    ) : (
                      restaurants.map(restaurant => (
                        <option key={restaurant.id} value={restaurant.id} className="font-spartan">
                          {restaurant.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {/* Cuisine Type Filter (Restaurants only) */}
              {activeTab === 'restaurants' && cuisineTypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-spartan">
                    Cuisine Type
                  </label>
                  <select
                    value={selectedCuisineType}
                    onChange={(e) => setSelectedCuisineType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  >
                    <option value="" className="font-spartan">All Cuisines</option>
                    {cuisineTypes.map(cuisine => (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  >
                    <option value="" className="font-spartan">All Roles</option>
                    <option value="manager" className="font-spartan">Manager</option>
                    <option value="captain" className="font-spartan">Captain</option>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-spartan"
                  >
                    <option value="" className="font-spartan">All Status</option>
                    <option value="connected" className="font-spartan">Connected</option>
                    <option value="disconnected" className="font-spartan">Disconnected</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAdminHeader; 