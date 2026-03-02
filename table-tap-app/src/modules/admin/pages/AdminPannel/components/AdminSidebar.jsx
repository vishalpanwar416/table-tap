import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Camera,
  Building2,
  CreditCard,
  MessageSquare,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Bell,
  Activity,
  Settings
} from 'lucide-react';
import { supabase } from '../../../../shared/supabase';
// Import the existing TableTap logo
import tableTapLogo from '../../../../../assets/icons/logott.png';

const AdminSidebar = ({
  activeTab,
  setActiveTab,
  menuItems,
  currentUser,
  restaurantName,
  userRole,
  onProfilePhotoClick,
  showMobileNav,
  setShowMobileNav,
  collapsed = false,
  onToggleCollapsed
}) => {
  const navigate = useNavigate();

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
      case 'Users':
        return <Users className="w-5 h-5" />;
      case 'Tag':
        return <Tag className="w-5 h-5" />;
      case 'QrCode':
        return <QrCode className="w-5 h-5" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5" />;
      case 'Building2':
        return <Building2 className="w-5 h-5" />;
      case 'CreditCard':
        return <CreditCard className="w-5 h-5" />;
      case 'MessageSquare':
        return <MessageSquare className="w-5 h-5" />;
      case 'ClipboardList':
        return <ClipboardList className="w-5 h-5" />;
      case 'Bell':
        return <Bell className="w-5 h-5" />;
      case 'Activity':
        return <Activity className="w-5 h-5" />;
      case 'Settings':
        return <Settings className="w-5 h-5" />;
      default:
        return null;
    }
  };

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
      {/* Mobile menu button removed - handled by MobileAdminHeader */}

      {/* Sidebar - Fixed position */}
      <div className={`
        fixed inset-y-0 left-0 z-40
        ${collapsed ? 'md:w-20' : 'md:w-56'} w-64 md:w-56 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white
        transform transition-all duration-300 ease-in-out
        ${showMobileNav ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        shadow-2xl font-spartan
      `}>
        <div className="flex flex-col h-full">
          {/* Logo & Collapse Toggle */}
          <div className="p-3 border-b border-slate-700/50">


            {/* Collapse toggle button (desktop only) */}
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-end'} mb-2 hidden md:flex`}>
              <button
                type="button"
                onClick={() => onToggleCollapsed?.()}
                className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>

            <div className={`flex ${collapsed ? 'flex-col items-center' : 'items-center space-x-3'}`}>
              <div className={`${collapsed ? 'w-12 h-12' : 'w-10 h-10'} bg-white rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200`}>
                <img
                  src={tableTapLogo}
                  alt="TableTap Logo"
                  className={`${collapsed ? 'w-10 h-10' : 'w-8 h-8'} object-contain`}
                />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-spartan">
                    TableTap
                  </h1>
                  <p className="text-xs text-slate-400 font-spartan">Admin Console</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 md:py-4">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabChange(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center w-full ${collapsed ? 'justify-center p-2.5' : 'p-2.5 md:p-3'} rounded-xl transition-all duration-200 group font-spartan ${activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
                      }`}
                  >
                    <div className={`p-1.5 md:p-2 rounded-lg transition-all duration-200 ${activeTab === item.id
                      ? 'bg-white/20'
                      : 'group-hover:bg-slate-600/50'
                      }`}>
                      {getIcon(item.icon)}
                    </div>
                    {!collapsed && <span className="ml-2 md:ml-3 text-sm font-medium font-spartan">{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User profile and logout */}
          <div className="p-3 border-t border-slate-700/50">
            <div className={`admin-profile flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-2.5 bg-slate-800/50 rounded-xl`}>
              <div className="relative group">
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt="User avatar"
                    className={`${collapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl object-cover border-2 border-slate-600 cursor-pointer transition-transform group-hover:scale-105`}
                    onClick={onProfilePhotoClick}
                    title={collapsed ? (currentUser?.email || 'Profile') : undefined}
                  />
                ) : (
                  <div
                    className={`${collapsed ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'} rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold cursor-pointer transition-transform group-hover:scale-105 font-spartan`}
                    onClick={onProfilePhotoClick}
                    title={collapsed ? (currentUser?.email || 'Profile') : undefined}
                  >
                    {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}

                {/* Camera icon overlay */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-3 h-3 text-white" />
                </div>
              </div>

              {!collapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="restaurant-name font-semibold text-white text-sm truncate font-spartan">
                    {restaurantName || 'Restaurant'}
                  </p>
                  <p className="user-email text-xs text-slate-400 truncate font-spartan">
                    {currentUser?.email || 'No email available'}
                  </p>
                  <p className="user-role text-xs text-blue-400 font-medium font-spartan">
                    {getRoleDisplayName(userRole)}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`w-full mt-3 px-3 py-2.5 text-sm md:text-sm text-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-all duration-200 flex items-center justify-center gap-2 group font-spartan ${collapsed ? 'md:px-2' : ''}`}
              title={collapsed ? 'Log Out' : undefined}
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
              {!collapsed && 'Log Out'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {showMobileNav && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setShowMobileNav(false)}
        />
      )}
    </>
  );
};

export default AdminSidebar;