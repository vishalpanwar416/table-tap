import React, { useState, useEffect, useCallback } from 'react';
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
  ShoppingBag,
  Building2,
  Map,
  Search,
  DollarSign,
  LogOut,
  Menu
} from 'lucide-react';
import tableTapLogo from '../../../../assets/icons/logott.png';
import ManagerNotificationsToast from './ManagerNotificationsToast';

const MobileNav = ({
  showMobileNav,
  setShowMobileNav,
  activeTab,
  setActiveTab,
  menuItems,
  handleLogout,
  currentUser,
  restaurantName,
  restaurantLogoUrl,
  userRole,
  searchTerm,
  setSearchTerm
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Close sidebar on Escape key
  useEffect(() => {
    if (!showMobileNav) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowMobileNav(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showMobileNav, setShowMobileNav]);

  // Lock body scroll while sidebar is open
  useEffect(() => {
    if (showMobileNav) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileNav]);

  const handleNavItemClick = useCallback((tabId) => {
    setActiveTab(tabId);
    setShowMobileNav(false);
  }, [setActiveTab, setShowMobileNav]);

  const handleBackdropClick = useCallback(() => {
    setShowMobileNav(false);
  }, [setShowMobileNav]);

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
      'ShoppingBag': ShoppingBag,
      'Building2': Building2,
      'Map': Map,
      'DollarSign': DollarSign
    };
    const IconComponent = icons[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" /> : null;
  };

  const getRoleDisplayName = (role) => {
    const map = {
      owner: 'Restaurant Owner',
      admin: 'Administrator',
      manager: 'Manager',
      captain: 'Captain',
      waiter: 'Waiter',
      chef: 'Chef',
      cashier: 'Cashier',
    };
    return map[role] ?? (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User');
  };

  return (
    <>
      {/* ── Mobile Header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white z-50 px-4 py-3 flex justify-between items-center shadow-lg border-b border-gray-800 h-16">
        {isSearchOpen ? (
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                className="w-full bg-gray-800 text-white pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-gray-500"
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm?.(e.target.value)}
              />
            </div>
            <button
              onClick={() => { setIsSearchOpen(false); setSearchTerm?.(''); }}
              className="p-2 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-bold flex items-center gap-3 flex-1 min-w-0 mr-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
                <img
                  key={restaurantLogoUrl || 'default'}
                  src={restaurantLogoUrl || currentUser?.restaurant_logo_url || tableTapLogo}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    if (e.target.src !== tableTapLogo) {
                      e.target.onerror = null;
                      e.target.src = tableTapLogo;
                    }
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate">{restaurantName || 'Dashboard'}</span>
                <span className="text-xs text-gray-400 font-normal truncate">
                  {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </span>
              </div>
            </h1>

            <div className="flex items-center gap-1">
              <ManagerNotificationsToast buttonClassName="text-gray-300 hover:text-white hover:bg-gray-800" />
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-md hover:bg-gray-800 text-gray-300 hover:text-white"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowMobileNav(!showMobileNav)}
                className="p-2 rounded-md hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                aria-label={showMobileNav ? 'Close menu' : 'Open menu'}
                aria-expanded={showMobileNav}
              >
                {showMobileNav ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Drawer + Backdrop ── */}
      {/*
        Always render so CSS transition plays on both open and close.
        pointer-events-none when closed prevents interaction with invisible layer.
      */}
      <div
        className={`md:hidden fixed inset-0 z-[60] flex justify-end transition-all duration-300 ${
          showMobileNav ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
            showMobileNav ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />

        {/* Drawer panel — slides in from the right */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`relative w-72 max-w-[85vw] h-full bg-gray-900 border-l border-gray-800 shadow-2xl
            flex flex-col overflow-y-auto transform transition-transform duration-300 ease-in-out
            ${showMobileNav ? 'translate-x-0' : 'translate-x-full'}
          `}
          style={{ marginTop: '64px' }} /* below the fixed header */
        >
          {/* Close button inside drawer */}
          <button
            onClick={() => setShowMobileNav(false)}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Nav items */}
          <nav className="flex-1 px-3 pt-10 pb-4">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavItemClick(item.id)}
                    className={`flex items-center w-full px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                      activeTab === item.id
                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {getIcon(item.icon)}
                    <span>{item.label}</span>
                    {activeTab === item.id && (
                      <span className="ml-auto w-1.5 h-5 bg-white/60 rounded-full" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer — user info + logout */}
          <div className="px-3 py-4 border-t border-gray-800">
            <div className="flex items-center gap-3 px-2 pb-4">
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt="User avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-600 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <p className="font-medium text-white text-sm truncate">
                  {restaurantName || 'Restaurant'}
                </p>
                <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
                <p className="text-xs text-primary-400 font-medium">{getRoleDisplayName(userRole)}</p>
              </div>
            </div>

            <button
              onClick={() => { setShowMobileNav(false); handleLogout?.(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-gray-800 hover:bg-red-600/20 hover:text-red-400 text-gray-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNav;