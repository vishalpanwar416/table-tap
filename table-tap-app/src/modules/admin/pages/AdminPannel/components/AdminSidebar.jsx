import React, { useEffect } from 'react';
import { useAuth } from '../../../../shared/config/AuthContext';
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
  Settings,
  Plug,
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
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore — clear cookies/localStorage regardless
    } finally {
      window.location.href = '/login';
    }
  };

  // email: prefer profile data, fall back to auth user email
  const displayEmail = currentUser?.email || user?.email || 'No email available';
  const displayName = currentUser?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Administrator';

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setShowMobileNav(false);
  };

  // Close on Escape key
  useEffect(() => {
    if (!showMobileNav) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowMobileNav(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showMobileNav, setShowMobileNav]);

  // Lock body scroll while mobile nav is open
  useEffect(() => {
    if (showMobileNav) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileNav]);

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
      case 'Plug':
        return <Plug className="w-5 h-5" />;
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
      {/* ── Desktop + Mobile Sidebar ── */}
      {/*
        Fixed sidebar. On mobile: slides in from left when showMobileNav=true.
        On desktop: always visible; width toggles between w-56 and w-20.
        z-[45] so the mobile backdrop (z-[44]) can sit just below it.
      */}
      <div
        role="navigation"
        aria-label="Admin sidebar"
        className={[
          'fixed inset-y-0 left-0 z-[45]',
          'bg-slate-900 text-white border-r border-slate-800',
          'transform transition-all duration-300 ease-in-out',
          'shadow-2xl font-spartan',
          // mobile width always 256px; desktop switches between 56 and 20
          collapsed ? 'w-64 md:w-20' : 'w-64 md:w-56',
          // mobile: hide by sliding left; desktop: always visible
          showMobileNav ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Collapse Toggle */}
          <div className="px-5 py-6 border-b border-slate-700/50">
            {/* Close button — mobile only */}
            <button
              type="button"
              onClick={() => setShowMobileNav(false)}
              className="md:hidden absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between">
              <div className={`flex ${collapsed ? 'md:flex-col md:items-center' : 'items-center space-x-4'}`}>
                <div className={`${collapsed ? 'md:w-12 md:h-12 w-10 h-10' : 'w-11 h-11'} bg-white rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200 flex-shrink-0 shadow-sm border border-slate-700/50`}>
                  <img
                    src={tableTapLogo}
                    alt="TableTap Logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                {/* Title: always visible on mobile; hidden when collapsed on desktop */}
                <div className={`${collapsed ? 'md:hidden' : ''} flex flex-col`}>
                  <h1 className="text-xl font-bold text-primary-400 font-spartan leading-none mb-1">
                    TableTap
                  </h1>
                  <p className="text-[10px] text-slate-400 font-spartan uppercase tracking-wider leading-none">Admin Console</p>
                </div>
              </div>

              {/* Collapse toggle — desktop only */}
              <button
                type="button"
                onClick={() => onToggleCollapsed?.()}
                className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 flex-shrink-0 ml-2"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
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
                    className={[
                      'flex items-center w-full rounded-xl transition-all duration-200 group font-spartan',
                      collapsed ? 'md:justify-center md:p-2.5 p-2.5' : 'p-2.5 md:p-3',
                      activeTab === item.id
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'hover:bg-slate-800 text-slate-400 hover:text-white',
                    ].join(' ')}
                  >
                    <div className={`p-1.5 md:p-2 rounded-lg transition-all duration-200 ${
                      activeTab === item.id ? 'bg-primary-600' : 'group-hover:bg-slate-700'
                    }`}>
                      {getIcon(item.icon)}
                    </div>
                    {/* Label: always on mobile; hidden when collapsed on desktop */}
                    <span className={`ml-2 md:ml-3 text-sm font-medium font-spartan ${
                      collapsed ? 'md:hidden' : ''
                    }`}>
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User profile and logout */}
          <div className="p-5 border-t border-slate-700/50">
            <div className={`admin-profile flex items-center ${
              collapsed ? 'md:justify-center' : ''
            } gap-3 p-3 bg-slate-800 rounded-xl`}>
              <div className="relative group flex-shrink-0">
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt="User avatar"
                    className="w-10 h-10 rounded-xl object-cover border-2 border-slate-700 cursor-pointer transition-transform group-hover:scale-105"
                    onClick={onProfilePhotoClick}
                    title={collapsed ? displayEmail : undefined}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-base cursor-pointer transition-transform group-hover:scale-105 font-spartan"
                    onClick={onProfilePhotoClick}
                    title={collapsed ? displayEmail : undefined}
                  >
                    {displayEmail?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-3 h-3 text-white" />
                </div>
              </div>
 
              <div className={`flex flex-col min-w-0 flex-1 ${
                collapsed ? 'md:hidden' : ''
              }`}>
                <p className="font-semibold text-white text-sm truncate font-spartan">
                  {restaurantName || 'Restaurant'}
                </p>
                <p className="text-xs text-slate-400 truncate font-spartan">{displayEmail}</p>
                <p className="text-xs text-primary-400 font-medium font-spartan">{getRoleDisplayName(userRole)}</p>
              </div>
            </div>
 
            <button
              onClick={handleLogout}
              className={`w-full mt-3 px-3 py-2.5 text-sm text-center rounded-xl bg-slate-800 hover:bg-rose-900 text-rose-100 transition-all duration-200 flex items-center justify-center gap-2 group font-spartan ${
                collapsed ? 'md:px-2' : ''
              }`}
              title={collapsed ? 'Log Out' : undefined}
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
              <span className={collapsed ? 'md:hidden' : ''}>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/*
        Mobile backdrop — z-[44] sits just BELOW the sidebar (z-[45]).
        Always rendered so the fade-out transition plays.
        pointer-events-none when nav is closed prevents blocking taps.
      */}
      <div
        className={[
          'md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[44]',
          'transition-opacity duration-300',
          showMobileNav ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={() => setShowMobileNav(false)}
        aria-hidden="true"
      />
    </>
  );
};

export default AdminSidebar;