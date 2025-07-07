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
  Building2
} from 'lucide-react';
import { supabase } from '../../../supabase';
// Import the existing TableTap logo
import tableTapLogo from '../../../assets/icons/logott.png';

const AdminSidebar = ({ activeTab, setActiveTab, menuItems, currentUser, restaurantName, userRole, onProfilePhotoClick, showMobileNav, setShowMobileNav }) => {
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
    <div className="relative w-72 h-full font-spartan">
      {/* Mobile menu button */}
      <button
        onClick={() => setShowMobileNav(!showMobileNav)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {showMobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar - Fixed position */}
      <div className={`
        fixed inset-y-0 left-0 z-40
        w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white
        transform transition-transform duration-300 ease-in-out
        ${showMobileNav ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        shadow-2xl font-spartan
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                <img 
                  src={tableTapLogo} 
                  alt="TableTap Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-spartan">
                  TableTap
                </h1>
                <p className="text-xs text-slate-400 font-spartan">Admin Console</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-2 px-3">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center w-full p-4 rounded-xl transition-all duration-200 group font-spartan ${
                      activeTab === item.id 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                        : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-all duration-200 ${
                      activeTab === item.id 
                        ? 'bg-white/20' 
                        : 'group-hover:bg-slate-600/50'
                    }`}>
                      {getIcon(item.icon)}
                    </div>
                    <span className="ml-3 font-medium font-spartan">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User profile and logout */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="admin-profile flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl">
              <div className="relative group">
                {currentUser?.avatar_url ? (
                  <img 
                    src={currentUser.avatar_url} 
                    alt="User avatar" 
                    className="w-12 h-12 rounded-xl object-cover border-2 border-slate-600 cursor-pointer transition-transform group-hover:scale-105"
                    onClick={onProfilePhotoClick}
                  />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg cursor-pointer transition-transform group-hover:scale-105 font-spartan"
                    onClick={onProfilePhotoClick}
                  >
                    {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                
                {/* Camera icon overlay */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-3 h-3 text-white" />
                </div>
              </div>
              
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
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-4 px-4 py-3 text-sm text-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-all duration-200 flex items-center justify-center gap-2 group font-spartan"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
              Log Out
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
    </div>
  );
};

export default AdminSidebar;