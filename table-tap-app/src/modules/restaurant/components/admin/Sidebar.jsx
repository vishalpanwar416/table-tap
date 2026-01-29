import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Utensils,
  ShoppingCart,
  Tag,
  QrCode,
  BarChart3,
  Settings,
  Package,
  Clock,
  ShoppingBag,
  Camera,
  ChevronLeft,
  ChevronRight,
  Map
} from 'lucide-react';
import { supabase } from '../../../shared/supabase';
import tableTapLogo from '../../../../assets/icons/logott.png'; // Adjust path if needed

const Sidebar = ({
  activeTab,
  setActiveTab,
  menuItems,
  currentUser,
  restaurantName,
  userRole,
  onProfilePhotoClick,
  collapsed = false,
  onToggleCollapsed
}) => {
  const navigate = useNavigate();
  const [showMobileNav, setShowMobileNav] = React.useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      // Error handling without console
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setShowMobileNav(false);
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'LayoutDashboard':
        return <LayoutDashboard className="w-5 h-5" />;
      case 'Utensils':
        return <Utensils className="w-5 h-5" />;
      case 'ShoppingCart':
        return <ShoppingCart className="w-5 h-5" />;
      case 'Package':
        return <Package className="w-5 h-5" />;
      case 'Users':
        return <Users className="w-5 h-5" />;
      case 'Tag':
        return <Tag className="w-5 h-5" />;
      case 'QrCode':
        return <QrCode className="w-5 h-5" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5" />;
      case 'Settings':
        return <Settings className="w-5 h-5" />;
      case 'Building2':
        return <Building2 className="w-5 h-5" />;
      case 'Clock':
        return <Clock className="w-5 h-5" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5" />;
      case 'Map':
        return <Map className="w-5 h-5" />;
      default:
        return null;
    }
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
      {/* Mobile menu button */}
      <button
        onClick={() => setShowMobileNav(!showMobileNav)}
        className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-lg bg-gray-800 text-white"
      >
        {showMobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-10
        ${collapsed ? 'md:w-20' : 'md:w-64'} w-64 bg-gray-900 text-white
        transform transition-transform duration-200 ease-in-out
        ${showMobileNav ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-800">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} mb-3`}>
              {/* Collapse toggle (desktop only) */}
              <button
                type="button"
                onClick={() => onToggleCollapsed?.()}
                className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>

              {/* Spacer for collapsed centering */}
              {collapsed && (
                <div className="hidden md:block w-9 h-9" aria-hidden="true" />
              )}
            </div>

            <div className="flex flex-col items-center space-y-2">
              {currentUser?.restaurant_logo_url || restaurantName ? (
                currentUser?.restaurant_logo_url ? (
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow">
                    <img
                      src={currentUser.restaurant_logo_url}
                      alt={restaurantName || "Restaurant Logo"}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                )
              ) : (
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
              {!collapsed && (
                <>
                  <h1 className="text-lg font-extrabold text-white tracking-tight mt-2">
                    {restaurantName || 'Restaurant Name'}
                  </h1>
                  <span className="text-xs text-gray-400 font-semibold tracking-wide">
                    Admin Dashboard
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabChange(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center w-full p-3 rounded-lg transition-colors ${collapsed ? 'justify-center' : ''} ${activeTab === item.id
                      ? 'bg-orange-500 text-white'
                      : 'hover:bg-gray-800 text-gray-300'
                      }`}
                  >
                    {getIcon(item.icon)}
                    {!collapsed && <span className="ml-3">{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User profile and logout */}
          <div className="p-4 border-t border-gray-800">
            <div className={`admin-profile flex items-center ${collapsed ? 'justify-center' : 'gap-4'} p-2`}>
              <div className="relative group">
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt="User avatar"
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-500 cursor-pointer transition-transform group-hover:scale-105"
                    onClick={onProfilePhotoClick}
                    title={collapsed ? (currentUser?.email || 'Profile') : undefined}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-medium cursor-pointer transition-transform group-hover:scale-105"
                    onClick={onProfilePhotoClick}
                    title={collapsed ? (currentUser?.email || 'Profile') : undefined}
                  >
                    {currentUser?.email?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Camera icon overlay */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-3 h-3 text-white" />
                </div>
              </div>

              {!collapsed && (
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
              )}
            </div>

            <button
              onClick={handleLogout}
              className={`w-full mt-4 px-4 py-2 text-sm text-center rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 ${collapsed ? 'md:px-2' : ''}`}
              title={collapsed ? 'Log Out' : undefined}
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && 'Log Out'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {showMobileNav && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={() => setShowMobileNav(false)}
        />
      )}
    </>
  );
};

export default Sidebar;