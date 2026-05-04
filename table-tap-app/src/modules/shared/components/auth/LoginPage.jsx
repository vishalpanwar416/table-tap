import React, { useState, useEffect } from 'react';
import { ChevronLeft, Eye, EyeOff, AlertTriangle, LogOut, Home, ArrowRight } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import GoogleButton from './auth/GoogleButton';
import AuthForm from './auth/AuthForm';
import { authService } from '../../api/authService';
import { useAuth } from '../../../shared/config/AuthContext';
import {
  hasValidRestaurantSelection,
  getStoredRestaurantSelection,
} from '../../../shared/utils/restaurantCheck';
import { motion, AnimatePresence } from 'framer-motion';
import {
  validateEmail,
  sanitizeInput,
  rateLimiter,
  sessionManager,
} from '../../../shared/utils/security';

const RESTAURANT_ROLES = ['owner', 'manager', 'captain', 'chef', 'staff', 'waiter', 'cashier'];

export default function LoginPage() {
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingSession, setExistingSession] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [typingText, setTypingText] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const welcomeText = 'Welcome to Table-Tap';
  const missionText = "We missed you! Let's get you in.";

  useEffect(() => {
    const welcomeTimer = setTimeout(() => {
      setShowWelcome(false);
    }, 2000);

    return () => clearTimeout(welcomeTimer);
  }, []);

  useEffect(() => {
    if (!showWelcome) {
      let i = 0;
      const interval = setInterval(() => {
        setTypingText(missionText.slice(0, i + 1));
        i++;
        if (i >= missionText.length) clearInterval(interval);
      }, 40);
      return () => clearInterval(interval);
    }
  }, [showWelcome]);

  // Get URL parameters
  const urlParams = new URLSearchParams(location.search);
  const urlRestaurant = urlParams.get('restaurant');
  const urlTable = urlParams.get('table');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setExistingSession(user);
        }
      } catch (err) {
        // User not logged in, stay on login page
      }
    };
    checkSession();
  }, []);

  const handleContinue = () => {
    if (hasValidRestaurantSelection()) {
      navigate('/home');
    } else {
      const params =
        urlRestaurant && urlTable ? `?restaurant=${urlRestaurant}&table=${urlTable}` : '';
      navigate(`/restaurant-selection${params}`);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setExistingSession(null);
      // Optional: clear local storage if needed
      window.location.reload();
    } catch (error) {
      console.error('Logout failed', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email.trim());

    // Validate email
    if (!validateEmail(sanitizedEmail)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Check rate limiting
    const rateLimitKey = `login_${sanitizedEmail}`;
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      const remainingTime = Math.ceil(rateLimiter.getRemainingAttempts(rateLimitKey) / 60);
      setError(`Too many login attempts. Please try again in ${remainingTime} minutes.`);
      setLoading(false);
      return;
    }

    try {
      const { user: authUser } = await authService.signInWithPassword(sanitizedEmail, password);

      // Clear rate limiting on successful login
      rateLimiter.clearAttempts(rateLimitKey);

      // Update session activity
      sessionManager.updateActivity();

      // Ensure AuthContext has the user before navigating — prevents "Guest" flash
      await refreshUser();

      // Check if profile is complete before deciding where to go
      const profile = await authService.getProfile(authUser.id);
      const isComplete = Boolean(profile?.mobile_number && profile?.date_of_birth);

      if (!isComplete) {
        navigate('/complete-profile');
        return;
      }

      // ---------------------------------------------------------
      // STRICT PORTAL ACCESS CONTROL & REDIRECTION
      // ---------------------------------------------------------
      const h = (window.location.hostname || '').toLowerCase();
      const role = profile?.profile_role || profile?.role || 'customer';

      // 1. Admin Portal
      if (h.startsWith('admin.')) {
        if (role !== 'admin') {
          await authService.signOut();
          throw new Error('Access Denied: Only administrators can log in here.');
        }
        navigate('/', { replace: true });
        return;
      }

      // 2. Restaurant/Partner Portal
      if (h.startsWith('restaurant.') || h.startsWith('manager.') || h.startsWith('owner.')) {
        if (!RESTAURANT_ROLES.includes(role)) {
          await authService.signOut();
          throw new Error('Access Denied: Restricted to restaurant staff.');
        }
        navigate('/', { replace: true });
        return;
      }

      // 3. Customer App (app.table-tap.in or localhost)
      // All roles (including Admin/Staff) are allowed to log in here as customers.
      // They simply fall through to the standard customer navigation below.
      // No redirection to admin/restaurant dashboards from here.

      // Customer redirection
      if (location.state?.returnUrl) {
        navigate(location.state.returnUrl, { state: location.state });
        return;
      }

      if (hasValidRestaurantSelection()) {
        navigate('/home');
      } else {
        const params =
          urlRestaurant && urlTable ? `?restaurant=${urlRestaurant}&table=${urlTable}` : '';
        navigate(`/restaurant-selection${params}`);
      }
    } catch (err) {
      // Record failed attempt
      rateLimiter.recordAttempt(rateLimitKey);

      const remainingAttempts = rateLimiter.getRemainingAttempts(rateLimitKey);
      if (remainingAttempts <= 2) {
        setError(`Login failed. ${remainingAttempts} attempts remaining before temporary lockout.`);
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Preserve URL parameters for Google auth callback
      const params =
        urlRestaurant && urlTable ? `?restaurant=${urlRestaurant}&table=${urlTable}` : '';
      const redirectTo = `/auth-callback${params}`;
      await authService.signInWithGoogle(redirectTo);
    } catch (err) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  // Animation variants
  const bgVariants = {
    initial: { opacity: 0, scale: 1.1 },
    animate: { opacity: 1, scale: 1, transition: { duration: 1.2, ease: 'easeOut' } },
  };
  const cardVariants = {
    initial: { y: 120, opacity: 0, scale: 0.95 },
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 70,
        damping: 15,
        mass: 0.8,
      },
    },
    exit: { y: 100, opacity: 0, transition: { duration: 0.3 } },
  };
  const stagger = {
    animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
  };
  const errorVariants = {
    initial: { opacity: 0, x: 0 },
    animate: { opacity: 1, x: [0, -8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.5 } },
    exit: { opacity: 0 },
  };
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.04 },
    tap: { scale: 0.98 },
    loading: { scale: 1, opacity: 0.7 },
  };

  return (
    <motion.div
      className="flex justify-center items-start min-h-screen bg-black relative overflow-hidden"
      variants={bgVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {existingSession ? (
        <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col z-10">
          <div className="w-full px-6 py-8 relative flex items-center justify-center">
            <button className="absolute left-4 text-orange-500 p-2" onClick={() => navigate(-1)}>
              <ChevronLeft size={30} />
            </button>
            <h1 className="text-gray-100 text-3xl font-medium font-spartan">Account</h1>
          </div>

          <motion.div
            className="bg-gray-200 w-full flex-1 rounded-t-3xl px-6 pt-10 pb-6 flex flex-col font-spartan shadow-2xl z-10 items-center justify-center text-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="mb-6 bg-green-100 p-4 rounded-full">
              <LogOut size={48} className="text-green-600" />
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-2">You are already logged in</h2>
            <p className="text-gray-600 mb-8 max-w-xs">
              You are currently signed in as{' '}
              <span className="font-semibold">{existingSession.email}</span>.
            </p>

            <div className="w-full max-w-xs space-y-4">
              <button
                onClick={handleContinue}
                className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-medium text-lg flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-lg"
              >
                <Home size={20} />
                Go to Home
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full bg-gray-300 text-gray-800 py-3.5 rounded-xl font-medium text-lg flex items-center justify-center gap-2 hover:bg-gray-400 transition-colors"
              >
                {loading ? (
                  'Logging out...'
                ) : (
                  <>
                    <LogOut size={20} />
                    Log Out
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col z-10">
          {/* Header */}
          <div className="w-full px-6 py-8 relative flex items-center justify-center">
            <button
              className="absolute left-4 text-orange-500 hover:text-orange-600 transition-all duration-300 p-2 rounded-full hover:bg-orange-500/10 active:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/30 z-10"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ChevronLeft size={30} />
            </button>
            <motion.h1
              className="text-gray-100 text-3xl font-medium font-spartan"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Log In
            </motion.h1>
          </div>
          {/* Login Container */}
          <motion.div
            className="bg-gray-200 w-full flex-1 rounded-t-3xl px-6 pt-10 pb-6 flex flex-col font-spartan shadow-2xl z-10"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="h-20 flex items-center justify-center mb-6">
              <AnimatePresence mode="wait">
                {showWelcome ? (
                  <motion.h2
                    key="welcome"
                    className="text-black text-3xl font-bold text-center leading-tight"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    {welcomeText}
                  </motion.h2>
                ) : (
                  <motion.h2
                    key="typing"
                    className="text-black text-2xl font-medium text-center leading-tight max-w-[280px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {typingText}
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="inline-block w-[3px] h-6 bg-orange-500 ml-1 mb-[-2px]"
                    />
                  </motion.h2>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mb-4 text-red-500 text-center"
                  variants={errorVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  key={error}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            {/* Form */}
            <motion.div
              className="space-y-6"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={itemVariants}>
                <label className="block text-black mb-2 text-lg">Email or Mobile Number</label>
                <AuthForm.Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="Email"
                  required
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <label className="block text-black mb-2 text-lg">Password</label>
                <div className="relative">
                  <AuthForm.Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="flex justify-end mt-1">
                  <Link to="/forgot-password" className="text-black text-sm">
                    Forget Password?
                  </Link>
                </div>
              </motion.div>
              {/* Login Button */}
              <motion.div variants={itemVariants}>
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  animate={loading ? 'loading' : 'initial'}
                >
                  <AuthForm.Button
                    type="submit"
                    disabled={loading}
                    className="bg-gray-600 text-white py-3 rounded-full mt-8 font-medium text-lg w-full shadow-lg transition-all"
                    onClick={handleSubmit}
                  >
                    {loading ? (
                      <motion.span
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 1 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
                      >
                        Logging In...
                      </motion.span>
                    ) : (
                      'Log In'
                    )}
                  </AuthForm.Button>
                </motion.div>
              </motion.div>
            </motion.div>
            {/* Alternative Login */}
            <motion.div className="mt-4 text-center" variants={itemVariants}>
              <p className="text-gray-600 text-sm">or sign up with</p>
              <div className="flex justify-center mt-4">
                <GoogleButton loading={loading} />
              </div>
            </motion.div>
            {/* Sign Up Link */}
            <motion.div className="mt-auto pt-6 text-center" variants={itemVariants}>
              <p className="text-gray-600 text-xl pb-[150px]">
                Don't have an account?
                <button
                  onClick={() => navigate('/signup')}
                  className="text-red-600 font-medium ml-1"
                >
                  Sign Up
                </button>
              </p>
            </motion.div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
