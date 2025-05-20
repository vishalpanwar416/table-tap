import React from 'react';
import { LayoutDashboard, Utensils, ShoppingCart, Users, Settings, Tag } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, menuItems, handleLogout, currentUser }) => {
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
    <div className="hidden md:flex flex-col w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="p-5 border-b border-gray-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-orange-500" />
          <span>Admin Dashboard</span>
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
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
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="admin-profile flex items-center gap-4 p-2">
          {currentUser?.avatar_url ? (
            <img 
              src={currentUser.avatar_url} 
              alt="Admin avatar" 
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-500"
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
    </div>
  );
};

export default Sidebar;