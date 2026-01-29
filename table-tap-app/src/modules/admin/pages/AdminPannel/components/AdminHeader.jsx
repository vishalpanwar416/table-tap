import React, { useState } from 'react';
import { Search, Bell, Building2, Users, X, Filter, ChevronDown, RefreshCw, ChevronLeft } from 'lucide-react';
import { useManagerNotifications } from '../../../../shared/context/ManagerNotificationContext';
import { useNavigate } from 'react-router-dom';

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
  setSelectedConnectionStatus
}) => {
  const { notifications, unreadCount, markAllAsRead } = useManagerNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Calculate real-time statistics
  const getStats = () => {
    const totalRestaurants = restaurants.length;
    const activeRestaurants = restaurants.filter(r => r.is_active).length;
    const totalStaff = staff.length;
    const connectedStaff = staff.filter(s => s.connected).length;

    return {
      totalRestaurants,
      activeRestaurants,
      totalStaff,
      connectedStaff
    };
  };

  const stats = getStats();

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

  const filteredRestaurants = restaurants.filter(restaurant => {
    const searchMatch = !searchTerm ||
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.contact_phone?.includes(searchTerm) ||
      restaurant.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = !selectedRestaurantId ||
      (selectedRestaurantId === 'active' && restaurant.is_active) ||
      (selectedRestaurantId === 'inactive' && !restaurant.is_active);

    return searchMatch && statusMatch;
  });

  const filteredStaff = staff.filter(staffMember => {
    const searchMatch = !searchTerm ||
      staffMember.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staffMember.phone_number && typeof staffMember.phone_number === 'string' && staffMember.phone_number.includes(searchTerm)) ||
      staffMember.role?.toLowerCase().includes(searchTerm.toLowerCase());

    const restaurantMatch = !selectedRestaurantId ||
      staffMember.restaurant_id === selectedRestaurantId;

    return searchMatch && restaurantMatch;
  });

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm z-20 p-4 md:p-6 relative font-spartan">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center px-2 py-1 mr-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition"
            title="Go Back"
          >
            <ChevronLeft className="mr-1" size={30} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-spartan">
              {activeTab === 'restaurants' ? 'Restaurants' : 'Staff Management'}
            </h2>
            <p className="text-sm text-gray-600 mt-1 font-spartan">
              {activeTab === 'restaurants'
                ? `${stats.totalRestaurants} restaurants • ${stats.activeRestaurants} active`
                : `${stats.totalStaff} staff members • ${stats.connectedStaff} connected`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Unified Search and Filter Section */}
          <div className="flex items-center space-x-3">
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

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-spartan ${hasFilters
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium font-spartan">Filter</span>
                {hasFilters && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Filter Dropdown */}
              {showFilters && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFilters(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4 font-spartan">
                    <div className="flex justify-between items-center mb-4">
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
                </>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center space-x-4">
            {activeTab === 'restaurants' ? (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span>{stats.activeRestaurants}/{stats.totalRestaurants} Active</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-purple-500" />
                <span>{stats.connectedStaff}/{stats.totalStaff} Connected</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors relative"
              >
                <Bell className="h-5 w-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-spartan">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
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
                        {unreadCount > 0 && (
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
                              <div className={`w-2 h-2 rounded-full mt-2 ${notification.read ? 'bg-gray-300' : 'bg-blue-500'
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
      </div>
    </div>
  );
};

export default AdminHeader; 