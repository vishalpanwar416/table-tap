import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ShoppingBag, User, CreditCard, Phone, HelpCircle, Shield } from 'lucide-react';
import { useNavigate} from 'react-router-dom';
import { supabase } from '../../supabase';
import ContactPopup from './ContactPopup';

const Sidebar = ({ isSidebarOpen, toggleSidebar, onLogout }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    profileImg: '',
    userName: '',
    userEmail: '',
    profile_role: 'customer'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);
  const sidebarRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (user && !error) {
          setIsAuthenticated(true);
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, profile_role, avatar_url')
            .eq('id', user.id)
            .single();

          setUserData({
            profileImg: profile?.avatar_url || '',
            userName: profile?.full_name || user.user_metadata?.name || user.email,
            userEmail: user.email,
            profile_role: profile?.profile_role || 'customer'
          });
        } else {
          setIsAuthenticated(false);
          setUserData({
            profileImg: '',
            userName: '',
            userEmail: '',
            profile_role: 'customer'
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsAuthenticated(false);
        setUserData({
          profileImg: '',
          userName: '',
          userEmail: '',
          profile_role: 'customer'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // Set up real-time subscription only if user is authenticated
    let channel;
    if (isAuthenticated) {
      channel = supabase.channel('sidebar-profile')
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
              profile_role: payload.new.profile_role
            }));
          }
        })
        .subscribe();
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [isAuthenticated]);

  const slideVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { 
      x: '100%', 
      opacity: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 40,
        duration: 0.4
      } 
    }
  };
  
  const menuOptions = [
    { name: 'My Orders', icon: <ShoppingBag className="w-6 h-6" />, path: '/my-orders' }, 
    { name: 'My Profile', icon: <User className="w-6 h-6" />, path: '/profile' },
    { name: 'Payment Methods', icon: <CreditCard className="w-6 h-6" />, path: '/payment-methods' },
    { name: 'Contact Us', icon: <Phone className="w-6 h-6" />, path: '/contact' },
    { name: 'Help & FAQs', icon: <HelpCircle className="w-6 h-6" />, path: '/help' },
  ];
  
  const managerOption = { 
    name: 'Manager Dashboard', 
    icon: <Shield className="w-6 h-6" />, 
    path: '/managerdashboard' 
  };
  
  const adminOption = { 
    name: 'Admin Dashboard', 
    icon: <Shield className="w-6 h-6" />, 
    path: '/Admin-Pannel'
  };
  
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 0.3,
        ease: 'easeOut'
      } 
    }
  };
  
  const handleNavigation = (path) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      // Redirect to login with return path
      navigate('/login', { state: { from: path } });
    }
    toggleSidebar();
  };

  const handleLogin = () => {
    navigate('/login');
    toggleSidebar();
  };

  const handleCloseContactPopup = () => {
    setIsContactPopupOpen(false);
  };

  // Swipe detection
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50; // Minimum swipe distance
    const swipeDistance = touchEndX.current - touchStartX.current;
    
    // If swiped right (positive distance) and distance is significant
    if (swipeDistance > swipeThreshold) {
      toggleSidebar();
    }
  }, [toggleSidebar]);

  // Add keyboard support for escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        toggleSidebar();
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen, toggleSidebar]);
  
  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              ref={sidebarRef}
              key="sidebar-content"
              className="fixed top-0 right-0 h-full w-full z-50 rounded-l-[80px] flex flex-col overflow-hidden"
              style={{ maxWidth: '70%' }}
              variants={slideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Enhanced glassy background with multiple layers */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>
              
              {/* Glass effect layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20"></div>
              <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/5 to-transparent"></div>
              
              {/* Additional glass highlights */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              
              {/* Border glow effect */}
              <div className="absolute inset-0 rounded-l-[80px] border border-white/20 shadow-2xl"></div>
              
              {/* Inner glass border */}
              <div className="absolute inset-1 rounded-l-[75px] border border-white/10"></div>
              
              {/* Main content */}
              <div className="relative h-full flex flex-col">
                {/* User profile section - fixed at top */}
                <div className="pt-16 pb-6 px-6 flex flex-col items-center border-b border-white/20 flex-shrink-0">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-purple-500 bg-white/10 backdrop-blur-md flex items-center justify-center shadow-xl">
                    {isLoading ? (
                      <div className="w-12 h-12 border-2 border-white/40 border-t-transparent rounded-full animate-spin"></div>
                    ) : userData.profileImg ? (
                      <img 
                        src={userData.profileImg} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white/60" />
                    )}
                  </div>
                  
                  {isLoading ? (
                    <div className="h-8 w-32 bg-white/10 rounded animate-pulse mb-2"></div>
                  ) : isAuthenticated ? (
                    <>
                      <h2 className="text-2xl font-bold text-white truncate max-w-full drop-shadow-lg">
                        {userData.userName || 'User'}
                      </h2>
                      <p className="text-white/60 text-sm mt-1 truncate max-w-full drop-shadow-sm">
                        {userData.userEmail}
                      </p>
                      {userData.profile_role === 'manager' && (
                        <div className="mt-2 px-3 py-1 bg-purple-600/80 backdrop-blur-md rounded-full border border-purple-400/30 shadow-lg">
                          <span className="text-xs font-semibold text-white">Manager</span>
                        </div>
                      )}
                      {userData.profile_role === 'admin' && (
                        <div className="mt-2 px-3 py-1 bg-red-600/80 backdrop-blur-md rounded-full border border-red-400/30 shadow-lg">
                          <span className="text-xs font-semibold text-white">Admin</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-white drop-shadow-lg">Guest</h2>
                      <p className="text-white/60 text-sm mt-1 drop-shadow-sm">Not signed in</p>
                      <button
                        className="mt-2 px-4 py-2 bg-orange-500/80 backdrop-blur-md text-white rounded hover:bg-orange-600/80 transition-all border border-orange-400/30 shadow-lg"
                        onClick={handleLogin}
                      >
                        Login
                      </button>
                    </>
                  )}
                </div>

                {/* Scrollable menu section */}
                <div className="flex-1 overflow-y-auto" style={{ 
                  scrollbarWidth: 'thin', 
                  scrollbarColor: '#4B5563 transparent',
                  msOverflowStyle: 'auto'
                }}>
                  <div className="py-4">
                    {/* Show menu options for both authenticated and non-authenticated users */}
                    {isAuthenticated && userData.profile_role === 'manager' && (
                      <div>
                        <button 
                          onClick={() => handleNavigation(managerOption.path)}
                          className="w-full py-3 px-6 flex items-center text-left hover:bg-white/10 transition-all duration-200 group"
                        >
                          <div className="bg-purple-600/80 backdrop-blur-md rounded-full p-3 mr-4 group-hover:bg-purple-700/80 transition-all border border-purple-400/30 shadow-xl">
                            {React.cloneElement(managerOption.icon, { className: "w-5 h-5 text-white" })}
                          </div>
                          <span className="text-lg text-white font-medium drop-shadow-sm">{managerOption.name}</span>
                        </button>
                      </div>
                    )}
                    
                    {isAuthenticated && userData.profile_role === 'admin' && (
                      <div>
                        <button 
                          onClick={() => handleNavigation(adminOption.path)}
                          className="w-full py-3 px-6 flex items-center text-left hover:bg-white/10 transition-all duration-200 group"
                        >
                          <div className="bg-red-600/80 backdrop-blur-md rounded-full p-3 mr-4 group-hover:bg-red-700/80 transition-all border border-red-400/30 shadow-xl">
                            {React.cloneElement(adminOption.icon, { className: "w-5 h-5 text-white" })}
                          </div>
                          <span className="text-lg text-white font-medium drop-shadow-sm">{adminOption.name}</span>
                        </button>
                      </div>
                    )}

                    {isAuthenticated && userData.profile_role === 'captain' && (
                      <div>
                        <button 
                          onClick={() => handleNavigation(managerOption.path)}
                          className="w-full py-3 px-6 flex items-center text-left hover:bg-white/10 transition-all duration-200 group"
                        >
                          <div className="bg-yellow-600/80 backdrop-blur-md rounded-full p-3 mr-4 group-hover:bg-yellow-700/80 transition-all border border-yellow-400/30 shadow-xl">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-lg text-white font-medium drop-shadow-sm">Captain Dashboard</span>
                        </button>
                      </div>
                    )}
                    
                    {/* Standard menu options - show for all users */}
                    {menuOptions.map((option, index) => (
                      <div key={index}>
                        <button 
                          onClick={() => handleNavigation(option.path)}
                          className="w-full py-3 px-6 flex items-center text-left hover:bg-white/10 transition-all duration-200 group"
                        >
                          <div className="bg-white/20 backdrop-blur-md rounded-full p-3 mr-4 group-hover:bg-purple-500/80 transition-all border border-white/30 shadow-xl">
                            {React.cloneElement(option.icon, { className: "w-5 h-5 text-white/80 group-hover:text-white" })}
                          </div>
                          <span className="text-lg text-white/80 group-hover:text-white drop-shadow-sm">
                            {option.name}
                          </span>
                        </button>
                      </div>
                    ))}

                    {/* Logout button - only show if authenticated */}
                    {isAuthenticated && (
                      <div className="px-6 py-4 mb-6">
                        <button 
                          className="w-full py-5 px-4 flex items-center text-left rounded-full hover:bg-white/10 transition-all duration-200 group"
                          onClick={() => {
                            toggleSidebar();
                            onLogout();
                          }}
                        >
                          <div className="bg-white/20 backdrop-blur-md rounded-full p-3 mr-4 group-hover:bg-red-500/80 transition-all border border-white/30 shadow-xl">
                            <LogOut className="w-5 h-5 text-white/80 group-hover:text-white" />
                          </div>
                          <span className="text-lg text-white/80 group-hover:text-white drop-shadow-sm">Log Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              key="sidebar-overlay"
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={toggleSidebar}
            />
          </>
        )}
      </AnimatePresence>

      {/* Contact Popup - outside sidebar AnimatePresence */}
      <ContactPopup 
        isOpen={isContactPopupOpen}
        onClose={handleCloseContactPopup}
      />
    </>
  );
};

export default Sidebar;