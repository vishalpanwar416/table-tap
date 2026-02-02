import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ShoppingBag, User, CreditCard, Phone, HelpCircle, Shield, Globe, ChefHat, UtensilsCrossed, Coins, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/supabase';
import { useAuth } from '../../shared/config/AuthContext';
import { getSubdomainUrl } from '../../shared/utils/subdomainRouter';
import ContactPopup from './ContactPopup';

const Sidebar = ({ isSidebarOpen, toggleSidebar, onLogout }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [userData, setUserData] = useState({
    profileImg: '',
    userName: '',
    userEmail: '',
    profile_role: 'customer'
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);
  const sidebarRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const isAuthenticated = !!user;
  const isLoading = authLoading || profileLoading;

  // 1. Fetch user profile data only when sidebar is opened and user is authenticated
  useEffect(() => {
    if (!isSidebarOpen || !user) return;

    let isMounted = true;
    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true);
        // We already have user from context, just fetch profile

        // Attempt to fetch profile details
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email, profile_role, avatar_url')
          .eq('id', user.id)
          .single();

        if (isMounted) {
          setUserData({
            profileImg: profile?.avatar_url || user.user_metadata?.avatar_url || '',
            userName: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            userEmail: user.email || '',
            profile_role: profile?.profile_role || 'customer'
          });
        }
      } catch (error) {
        console.warn('Error in fetchUserProfile:', error);
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };
    fetchUserProfile();
    return () => { isMounted = false; };
  }, [isSidebarOpen, user]);

  // 4. Only subscribe to real-time updates when sidebar is open and user is authenticated
  useEffect(() => {
    if (!isSidebarOpen || !isAuthenticated) return;
    let channel;
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
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [isSidebarOpen, isAuthenticated, userData.userEmail]);

  // 2. Memoize menu options and handlers
  const menuOptions = React.useMemo(() => [
    { name: 'My Orders', icon: <ShoppingBag className="w-6 h-6" />, path: '/my-orders' },
    { name: 'My Profile', icon: <User className="w-6 h-6" />, path: '/profile' },
    { name: 'Change Restaurant', icon: <Globe className="w-6 h-6" />, path: '/restaurant-selection' },
    { name: 'Contact Us', icon: <Phone className="w-6 h-6" />, path: '/contact' },
    { name: 'Help & FAQs', icon: <HelpCircle className="w-6 h-6" />, path: '/help' },
  ], []);

  const managerOption = {
    name: 'Manager Dashboard',
    icon: <Shield className="w-6 h-6" />,
    path: '/restaurant'
  };

  const adminOption = {
    name: 'Admin Dashboard',
    icon: <Shield className="w-6 h-6" />,
    path: '/admin'
  };

  // Smooth slide-only animation (right to left), no spring
  const slideVariants = {
    hidden: { x: '100%' },
    visible: {
      x: 0,
      transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] }
    },
    exit: {
      x: '100%',
      transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] }
    }
  };
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.25, ease: 'easeOut' }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  };

  const handleNavigation = React.useCallback((path) => {
    // Handle cross-app navigation (Admin or Restaurant dashboard)
    if (path.startsWith('/admin') || path.startsWith('/restaurant')) {
      // Treat localhost and Vercel preview deployments as "dev" environments for path-based routing
      const isDev = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('vercel.app');

      if (isDev) {
        // In dev/preview, use path-based routing
        window.location.href = path;
      } else {
        // In production custom domain, switch subdomains
        const newSubdomain = path.startsWith('/admin') ? 'admin' : 'restaurant';
        const hostParts = window.location.hostname.split('.');

        // Assuming format [subdomain, domain, tld] e.g., app.table-tap.in
        // If we are on app.table-tap.in, replace 'app' with target
        if (hostParts.length >= 3) {
          hostParts[0] = newSubdomain;
          const newUrl = `${window.location.protocol}//${hostParts.join('.')}`;
          window.location.href = newUrl;
        } else {
          // Fallback if domain structure is unexpected
          window.location.href = path;
        }
      }
      return;
    }

    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate('/login', { state: { from: path } });
    }
    toggleSidebar();
  }, [isAuthenticated, navigate, toggleSidebar]);

  const handleLogin = React.useCallback(() => {
    navigate('/login');
    toggleSidebar();
  }, [navigate, toggleSidebar]);

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

  // Skeleton shimmer style
  const Skeleton = ({ className }) => (
    <div className={`bg-gradient-to-r from-white/10 via-white/20 to-white/10 animate-pulse ${className}`}></div>
  );

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
                      <Skeleton className="w-12 h-12 rounded-full" />
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
                    <>
                      <Skeleton className="h-8 w-32 rounded mb-2" />
                      <Skeleton className="h-4 w-24 rounded mb-1" />
                    </>
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
                    {/* Show relevant dashboard based on role */}
                    {isAuthenticated && (userData.profile_role === 'admin') && (
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

                    {isAuthenticated && (userData.profile_role === 'manager') && (
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

                    {isAuthenticated && userData.profile_role === 'owner' && (
                      <div>
                        <button
                          onClick={() => handleNavigation(managerOption.path)}
                          className="w-full py-3 px-6 flex items-center text-left hover:bg-white/10 transition-all duration-200 group"
                        >
                          <div className="bg-gradient-to-r from-amber-500 to-yellow-600 backdrop-blur-md rounded-full p-3 mr-4 group-hover:from-amber-600 group-hover:to-yellow-700 transition-all border border-amber-400/30 shadow-xl">
                            <Crown className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-lg text-white font-medium drop-shadow-sm">Owner Dashboard</span>
                        </button>
                      </div>
                    )}

                    {isAuthenticated && userData.profile_role === 'chef' && (
                      <div>
                        <button
                          onClick={() => handleNavigation(managerOption.path)}
                          className="w-full py-3 px-6 flex items-center text-left hover:bg-white/10 transition-all duration-200 group"
                        >
                          <div className="bg-orange-600/80 backdrop-blur-md rounded-full p-3 mr-4 group-hover:bg-orange-700/80 transition-all border border-orange-400/30 shadow-xl">
                            <ChefHat className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-lg text-white font-medium drop-shadow-sm">Kitchen Dashboard</span>
                        </button>
                      </div>
                    )}

                    {isAuthenticated && userData.profile_role === 'waiter' && (
                      <div>
                        <button
                          onClick={() => handleNavigation(managerOption.path)}
                          className="w-full py-3 px-6 flex items-center text-left hover:bg-white/10 transition-all duration-200 group"
                        >
                          <div className="bg-green-600/80 backdrop-blur-md rounded-full p-3 mr-4 group-hover:bg-green-700/80 transition-all border border-green-400/30 shadow-xl">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-lg text-white font-medium drop-shadow-sm">Waiter Dashboard</span>
                        </button>
                      </div>
                    )}

                    {isAuthenticated && userData.profile_role === 'cashier' && (
                      <div>
                        <button
                          onClick={() => handleNavigation(managerOption.path)}
                          className="w-full py-3 px-6 flex items-center text-left hover:bg-white/10 transition-all duration-200 group"
                        >
                          <div className="bg-amber-600/80 backdrop-blur-md rounded-full p-3 mr-4 group-hover:bg-amber-700/80 transition-all border border-amber-400/30 shadow-xl">
                            <Coins className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-lg text-white font-medium drop-shadow-sm">Cashier Dashboard</span>
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