import React from 'react';
import { LayoutDashboard, Utensils, ShoppingCart, Users, Settings, Tag, X } from 'lucide-react';

const MobileNav = ({ showMobileNav, setShowMobileNav, activeTab, setActiveTab, menuItems, handleLogout, currentUser }) => {
  // Map icon strings to actual components
  const getIcon = (iconName) => {
    const icons = {
      'LayoutDashboard': LayoutDashboard,
      'Utensils': Utensils,
      'ShoppingCart': ShoppingCart,
      'Users': Users,
      'Tag': Tag,
      'Settings': Settings
    };
    
    const IconComponent = icons[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5 mr-3" /> : null;
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white z-20 px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-orange-500" />
          <span>Admin Dashboard</span>
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
                    className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                      activeTab === item.id 
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
                    alt="Admin avatar" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-medium">
                    {currentUser?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <p className="admin-name font-medium text-gray-800 dark:text-white">
                    {currentUser?.full_name || currentUser?.email}
                  </p>
                  <p className="admin-role text-xs text-gray-500 dark:text-gray-400">
                    Administrator
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