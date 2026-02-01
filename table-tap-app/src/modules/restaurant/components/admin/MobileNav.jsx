import React from 'react';
import {
  LayoutDashboard,
  Utensils,
  ShoppingCart,
  Users,
  Settings,
  Tag,
  X,
  QrCode,
  BarChart3,
  Package,
  Clock,
  ShoppingBag
} from 'lucide-react';
import tableTapLogo from '../../../../assets/icons/logott.png';

const MobileNav = ({ showMobileNav, setShowMobileNav, activeTab, setActiveTab, menuItems, handleLogout, currentUser, restaurantName, restaurantLogoUrl, userRole }) => {
  // Map icon strings to actual components
  const getIcon = (iconName) => {
    const icons = {
      'LayoutDashboard': LayoutDashboard,
      'Utensils': Utensils,
      'ShoppingCart': ShoppingCart,
      'Users': Users,
      'Tag': Tag,
      'QrCode': QrCode,
      'BarChart3': BarChart3,
      'Package': Package,
      'Clock': Clock,
      'Settings': Settings,
      'ShoppingBag': ShoppingBag
    };

    const IconComponent = icons[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5 mr-3" /> : null;
  };

  // Function to get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Manager';
      case 'captain':
        return 'Captain';
      case 'waiter':
        return 'Waiter';
      case 'chef':
        return 'Chef';
      case 'cashier':
        return 'Cashier';
      default:
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white z-20 px-4 py-3 flex justify-between items-center shadow-lg border-b border-gray-800">
        <h1 className="text-lg font-bold flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
            <img
              src={restaurantLogoUrl || currentUser?.restaurant_logo_url || tableTapLogo}
              alt="Logo"
              className="w-full h-full object-contain"
              onError={(e) => { e.target.src = tableTapLogo; }}
            />
          </div>
          <span className="truncate max-w-[150px]">{restaurantName || 'Dashboard'}</span>
        </h1>
        <button
          onClick={() => setShowMobileNav(!showMobileNav)}
          className="p-2 rounded-md hover:bg-gray-800"
        >
          {showMobileNav ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="space-y-1">
              <div className="w-6 h-0.5 bg-white"></div>
              <div className="w-6 h-0.5 bg-white"></div>
              <div className="w-6 h-0.5 bg-white"></div>
            </div>
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileNav && (
        <div className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-95 z-10 pt-16">
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowMobileNav(false);
                    }}
                    className={`flex items-center w-full p-3 rounded-lg transition-colors ${activeTab === item.id
                      ? 'bg-orange-500 text-white'
                      : 'hover:bg-gray-700 text-gray-300'
                      }`}
                  >
                    {getIcon(item.icon)}
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-5  border-t border-gray-700">
              <div className="admin-profile flex items-center gap-4 pb-4">
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt="User avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-medium">
                    {currentUser?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="restaurant-name font-medium text-white text-sm truncate">
                    {restaurantName || 'Restaurant'}
                  </p>
                  <p className="user-email text-xs text-gray-400 truncate">
                    {currentUser?.email}
                  </p>
                  <p className="user-role text-xs text-orange-400 font-medium">
                    {getRoleDisplayName(userRole)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-sm text-center rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Log Out
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default MobileNav;