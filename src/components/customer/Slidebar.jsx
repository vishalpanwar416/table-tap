import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ShoppingBag, User, CreditCard, Phone, HelpCircle, Shield } from 'lucide-react';
import { useNavigate} from 'react-router-dom';
import { supabase } from '../../supabase';

const Sidebar = ({ isSidebarOpen, toggleSidebar, onLogout }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    profileImg: '',
    userName: 'Loading...',
    userEmail: 'Loading...',
    isAdmin: false
  });


  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user && !error) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, is_admin, avatar_url')
          .eq('id', user.id)
          .single();

        setUserData({
          profileImg: profile?.avatar_url || '',
          userName: profile?.full_name || user.user_metadata.name,
          userEmail: user.email,
          isAdmin: profile?.is_admin || false
        });
      }
    };
    fetchUserData();

    const channel = supabase.channel('sidebar-profile')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, (payload) => {
        if (userData.userEmail === payload.old.email) {
          setUserData(prev => ({
            ...prev,
            userName: payload.new.full_name,
            userEmail: payload.new.email,
            profileImg: payload.new.avatar_url,
            isAdmin: payload.new.is_admin
          }));
        }
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, [userData.userEmail]);

  const slideVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { x: '100%', opacity: 0, transition: { duration: 0.3 } }
  };
  
  const menuOptions = [
    // Fix the path from '/Myorder' to '/my-orders' to match the route in App.js
    { name: 'My Orders', icon: <ShoppingBag className="w-6 h-6" />, path: '/my-orders' }, 
    { name: 'My Profile', icon: <User className="w-6 h-6" />, path: '/profile' },
    { name: 'Payment Methods', icon: <CreditCard className="w-6 h-6" />, path: '/payment-methods' },
    { name: 'Contact Us', icon: <Phone className="w-6 h-6" />, path: '/contact' },
    { name: 'Help & FAQs', icon: <HelpCircle className="w-6 h-6" />, path: '/help' },
   // { name: 'Settings', icon: <Settings className="w-6 h-6" />, path: '/settings' },
  ];
  
  // Admin-only menu option
  const adminOption = { 
    name: 'Admin Dashboard', 
    icon: <Shield className="w-6 h-6" />, 
    path: '/admindashboard' 
  };
  
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };
  
  const handleNavigation = (path) => {
    navigate(path);
    toggleSidebar();
  };
  
  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div
            key="sidebar-content"
            className="fixed top-1 right-0 h-full w-full bg-black z-50 rounded-l-[80px] flex flex-col overflow-hidden"
            style={{ maxWidth: '70%' }}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* User profile section - fixed at top */}
            <div className="pt-16 pb-6 px-6 flex flex-col items-center border-b border-gray-800 flex-shrink-0">
              <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-purple-500">
              <img 
                src={userData.profileImg || "/default-avatar.png"} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
              </div>
              <h2 className="text-2xl font-bold text-white truncate max-w-full">
                {userData.userName === 'Loading...' || !userData.userName ? 'Guest' : userData.userName}
              </h2>
              <p className="text-gray-400 text-sm mt-1 truncate max-w-full">
                {userData.userName === 'Loading...' || !userData.userName ? 'guest' : userData.userEmail}
              </p>
              {(userData.userName === 'Loading...' || !userData.userName) && (
                <button
                  className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors duration-200"
                  onClick={() => window.location.href = '/login'}
                >
                  Login
                </button>
              )}
              {userData.isAdmin && (
                <div className="mt-2 px-3 py-1 bg-purple-600 rounded-full">
                  <span className="text-xs font-semibold text-white">Admin</span>
                </div>
              )}
            </div>

            {/* Scrollable menu section */}
            <div className="flex-1 overflow-y-auto" style={{ 
              scrollbarWidth: 'thin', 
              scrollbarColor: '#4B5563 transparent',
              msOverflowStyle: 'auto'
            }}>
              <div className="py-4">
                {userData.isAdmin && (
                  <div>
                    <button 
                      onClick={() => handleNavigation(adminOption.path)}
                      className="w-full py-3 px-6 flex items-center text-left hover:bg-gray-800 transition-colors duration-200 group"
                    >
                      <div className="bg-purple-600 rounded-full p-3 mr-4 group-hover:bg-purple-700 transition-colors">
                        {React.cloneElement(adminOption.icon, { className: "w-5 h-5 text-white" })}
                      </div>
                      <span className="text-lg text-white font-medium">{adminOption.name}</span>
                    </button>
                  </div>
                )}
                
                {/* Standard menu options */}
                {menuOptions.map((option, index) => (
                  <div key={index}>
                    <button 
                      onClick={() => handleNavigation(option.path)}
                      className="w-full py-3 px-6 flex items-center text-left hover:bg-gray-800 transition-colors duration-200 group"
                    >
                      <div className="bg-gray-700 rounded-full p-3 mr-4 group-hover:bg-purple-500 transition-colors">
                        {React.cloneElement(option.icon, { className: "w-5 h-5 text-gray-300 group-hover:text-white" })}
                      </div>
                      <span className="text-lg text-gray-300 group-hover:text-white">{option.name}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Logout button - always visible inside scroll area */}
              <div className="px-6 py-4 mb-6">
                <button 
                  className="w-full py-5 px-4 flex items-center text-left rounded-full hover:bg-gray-800 transition-colors duration-200 group"
                  onClick={() => {
                    toggleSidebar();
                    onLogout();
                  }}
                >
                  <div className="bg-gray-700 rounded-full p-3 mr-4 group-hover:bg-red-500 transition-colors">
                    <LogOut className="w-5 h-5 text-gray-300 group-hover:text-white" />
                  </div>
                  <span className="text-lg text-gray-300 group-hover:text-white">Log Out</span>
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            key="sidebar-overlay"
            className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={toggleSidebar}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;