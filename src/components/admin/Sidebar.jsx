import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { supabase } from '../../supabase';

const Sidebar = ({ activeTab, setActiveTab, menuItems }) => {
  const navigate = useNavigate();
  const [showMobileNav, setShowMobileNav] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }
    };
    getCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Building2':
        return <Building2 className="w-5 h-5" />;
      case 'Users':
        return <Users className="w-5 h-5" />;
      default:
        return null;
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
        w-64 bg-gray-900 text-white
        transform transition-transform duration-200 ease-in-out
        ${showMobileNav ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-2">
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
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    {getIcon(item.icon)}
                    <span className="ml-3">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User profile and logout */}
          <div className="p-4 border-t border-gray-800">
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
                <p className="admin-name font-medium text-white">
                  {currentUser?.email}
                </p>
                <p className="admin-role text-xs text-gray-400">
                  Administrator
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-4 px-4 py-2 text-sm text-center rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Log Out
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