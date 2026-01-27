import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import GoogleButton from './auth/GoogleButton';
import AuthForm from './auth/AuthForm';
import { authService } from '../../api/authService';
import { hasValidRestaurantSelection, getStoredRestaurantSelection } from '../../../shared/utils/restaurantCheck';
import { motion, AnimatePresence } from 'framer-motion';
import { validateEmail, sanitizeInput, rateLimiter, sessionManager } from '../../../shared/utils/security';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get URL parameters
  const urlParams = new URLSearchParams(location.search);
  const urlRestaurant = urlParams.get('restaurant');
  const urlTable = urlParams.get('table');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          // Check if user has restaurant selection
          if (hasValidRestaurantSelection()) {
            navigate('/home');
          } else {
            // Preserve URL parameters when redirecting to restaurant selection
            const params = urlRestaurant && urlTable ? `?restaurant=${urlRestaurant}&table=${urlTable}` : '';
            navigate(`/restaurant-selection${params}`);
          }
        }
      } catch (err) {
        // Only redirect to home if we have a valid session
        if (window.location.pathname === '/home') {
          navigate('/login');
        }
      }
    };
    checkSession();
  }, [navigate, urlRestaurant, urlTable]);

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
      await authService.signInWithPassword(sanitizedEmail, password);
      
      // Clear rate limiting on successful login
      rateLimiter.clearAttempts(rateLimitKey);
      
      // Update session activity
      sessionManager.updateActivity();
      
      // Check if user has restaurant selection after login
      if (hasValidRestaurantSelection()) {
        navigate('/home');
      } else {
        // Preserve URL parameters when redirecting to restaurant selection
        const params = urlRestaurant && urlTable ? `?restaurant=${urlRestaurant}&table=${urlTable}` : '';
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
      const params = urlRestaurant && urlTable ? `?restaurant=${urlRestaurant}&table=${urlTable}` : '';
      const redirectTo = `/auth-callback${params}`;
      await authService.signInWithGoogle(redirectTo);
    } catch (err) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  // Animation variants
  const bgVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 1 } }
  };
  const cardVariants = {
    initial: { y: 40, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 60, damping: 16 } },
    exit: { y: 40, opacity: 0, transition: { duration: 0.2 } }
  };
  const stagger = {
    animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
  };
  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } }
  };
  const errorVariants = {
    initial: { opacity: 0, x: 0 },
    animate: { opacity: 1, x: [0, -8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.5 } },
    exit: { opacity: 0 }
  };
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.04 },
    tap: { scale: 0.98 },
    loading: { scale: 1, opacity: 0.7 }
  };

  return (
    <motion.div
      className="flex justify-center items-start min-h-screen bg-black relative overflow-hidden"
      variants={bgVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Remove animated background gradient and floating shapes */}
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col z-10">
        {/* Header */}
        <div className="w-full px-6 py-8 relative flex justify-center">
          <button
            className="absolute left-4 top-8 text-orange-500"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={30} />
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
          <motion.h2
            className="justify-center text-center text-black text-3xl font-semibold mb-12"
            variants={itemVariants}
          >
            Welcome
          </motion.h2>
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
                <Link to="/forgot-password" className="text-black text-sm">Forget Password?</Link>
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
                  ) : 'Log In'}
                </AuthForm.Button>
              </motion.div>
            </motion.div>
          </motion.div>
          {/* Alternative Login */}
          <motion.div className="mt-4 text-center" variants={itemVariants}>
            <p className="text-gray-600 text-sm">or sign up with</p>
            <div className="flex justify-center mt-4">
              <GoogleButton 
                loading={loading}
              />
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
    </motion.div>
  );
}