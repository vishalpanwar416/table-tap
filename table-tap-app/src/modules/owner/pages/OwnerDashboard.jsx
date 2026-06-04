import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminRestaurant } from '../../shared/context/AdminRestaurantContext';
import { supabase } from '../../shared/supabase';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Plus,
  User,
  Store,
  ArrowLeft,
} from 'lucide-react';

// Components
import Sidebar from '../../restaurant/components/admin/Sidebar';
import MobileNav from '../../restaurant/components/admin/MobileNav';
import MultiRestaurantOverview from '../components/MultiRestaurantOverview';
import AllRestaurantsList from '../components/AllRestaurantsList';
import CentralizedBilling from '../components/CentralizedBilling';
import OwnerAppearanceSettings from '../components/OwnerAppearanceSettings';
import LogoutPopup from '../../shared/components/auth/auth/LogoutPopup';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    ownedRestaurants,
    loading: contextLoading,
    userRole,
    isAdmin: contextIsAdmin,
  } = useAdminRestaurant();

  const [activeTab, setActiveTabState] = useState('overview');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [period, setPeriod] = useState('weekly');

  // Keep URL in sync with active tab
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        if (tab && tab !== 'overview') next.set('tab', tab);
        else next.delete('tab');
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTabState(tab);

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser({ ...user, ...profile });
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Owner specific menu items
  const menuItems = [
    { id: 'overview', icon: 'LayoutDashboard', label: 'Company Overview' },
    { id: 'restaurants', icon: 'Building2', label: 'My Restaurants' },
    { id: 'billing', icon: 'CreditCard', label: 'Billing & Plans' },
    { id: 'settings', icon: 'Settings', label: 'Account Settings' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <MultiRestaurantOverview
            ownedRestaurants={ownedRestaurants}
            period={period}
            setPeriod={setPeriod}
            formatCurrency={formatCurrency}
          />
        );
      case 'restaurants':
        return <AllRestaurantsList restaurants={ownedRestaurants} />;
      case 'billing':
        return <CentralizedBilling restaurants={ownedRestaurants} />;
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 md:p-12 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="text-blue-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Owner Settings</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Update your personal information and security preferences.
              </p>
            </div>
            <OwnerAppearanceSettings restaurants={ownedRestaurants} />
          </div>
        );
      default:
        return (
          <MultiRestaurantOverview
            ownedRestaurants={ownedRestaurants}
            period={period}
            setPeriod={setPeriod}
            formatCurrency={formatCurrency}
          />
        );
    }
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar (Desktop) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        menuItems={menuItems}
        currentUser={currentUser}
        restaurantName="TableTap Owner"
        userRole="owner"
        handleLogout={() => setShowLogoutPopup(true)}
      />

      {/* Mobile Nav */}
      <MobileNav
        showMobileNav={showMobileNav}
        setShowMobileNav={setShowMobileNav}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        menuItems={menuItems}
        handleLogout={() => setShowLogoutPopup(true)}
        currentUser={currentUser}
        restaurantName="TableTap Owner"
        userRole="owner"
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {menuItems.find((i) => i.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Logged in as Owner
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Summary Stats in Header (Desktop) */}
            <div className="hidden lg:flex items-center gap-8 py-1.5 px-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Restaurants
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {ownedRestaurants?.length || 0}
                </span>
              </div>
              <div className="flex flex-col border-l border-gray-200 pl-8">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Status
                </span>
                <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                  <div className="w-1 h-1 bg-green-600 rounded-full"></div> Verified
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pr-2">
              <button className="p-2.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 border-2 border-white rounded-full"></span>
              </button>
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {currentUser?.full_name || currentUser?.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                    Enterprise Owner
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-100 group-hover:scale-105 transition-transform">
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 pt-20 md:pt-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-12">{renderTabContent()}</div>
        </main>
      </div>

      {/* Logout Confirmation */}
      <LogoutPopup
        isOpen={showLogoutPopup}
        onClose={() => setShowLogoutPopup(false)}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default OwnerDashboard;
