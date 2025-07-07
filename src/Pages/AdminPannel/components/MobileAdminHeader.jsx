import React, { useState } from 'react';
import { Search, Bell, Building2, Users, X, Filter, ChevronDown, RefreshCw, TrendingUp, MapPin, Clock, Star, Menu } from 'lucide-react';
import { useManagerNotifications } from '../../../context/ManagerNotificationContext';

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
  onMenuToggle
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, markAllAsRead } = useManagerNotifications();

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

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setShowNotifications(false);
  };

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
              {activeTab === 'restaurants' ? 'Restaurants' : 'Staff'}
            </h2>
            <p className="text-xs text-gray-600 font-spartan">
              {activeTab === 'restaurants' 
                ? `${restaurantStats.totalRestaurants} total • ${restaurantStats.activeRestaurants} active` 
                : `${staffStats.totalStaff} total • ${staffStats.connectedStaff} online`
              }
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Search Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors relative"
            >
              <Bell className="h-5 w-5 text-gray-700" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-spartan">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden font-spartan">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 font-spartan">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-700 font-spartan"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 font-spartan">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification, index) => (
                        <div key={index} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.read ? 'bg-gray-300' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 font-spartan">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 font-spartan">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 font-spartan">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      {showFilters && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 font-spartan">
                Filter {activeTab === 'restaurants' ? 'Restaurants' : 'Staff'}
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
                  placeholder={`Search ${activeTab === 'restaurants' ? 'restaurants' : 'staff'}...`}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/70 font-spartan"
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

              {/* Status/Restaurant Filter */}
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