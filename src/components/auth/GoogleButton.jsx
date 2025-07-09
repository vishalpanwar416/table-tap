import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '../../supabase';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const GoogleButton = ({ loading = false, redirectTo = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Preserve URL parameters
      const urlParams = new URLSearchParams(location.search);
      const restaurant = urlParams.get('restaurant');
      const table = urlParams.get('table');
      
      let finalRedirectTo = redirectTo;
      if (!finalRedirectTo) {
        finalRedirectTo = '/auth-callback';
      }
      
      // Add parameters to redirect URL if they exist
      if (restaurant && table) {
        finalRedirectTo += `?restaurant=${restaurant}&table=${table}`;
      }
      
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${finalRedirectTo}`
        }
      });
    } catch (error) {
      alert(error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const buttonVariants = {
    initial: { scale: 1, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' },
    hover: { scale: 1.04, boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)' },
    tap: { scale: 0.97 },
    loading: { scale: 1, opacity: 0.7 }
  };
  const spinnerVariants = {
    initial: { rotate: 0 },
    animate: { rotate: 360 },
    bounce: { y: [0, -2, 0], transition: { repeat: Infinity, duration: 0.6 } }
  };

  return (
    <motion.button
      onClick={handleGoogleLogin}
      disabled={loading || isLoading}
      className="w-full bg-white text-gray-700 py-3 rounded-3xl font-medium flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors disabled:opacity-50 shadow"
      variants={buttonVariants}
      initial="initial"
      whileHover={!loading && !isLoading ? 'hover' : undefined}
      whileTap={!loading && !isLoading ? 'tap' : undefined}
      animate={loading || isLoading ? 'loading' : 'initial'}
      type="button"
    >
      <AnimatePresence mode="wait">
        {(isLoading || loading) ? (
          <motion.span
            key="spinner"
            className="inline-block h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full mr-1"
            variants={spinnerVariants}
            initial="initial"
            animate={["animate", "bounce"]}
            style={{ minWidth: 20 }}
          />
        ) : (
          <motion.span key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FcGoogle size={20} />
          </motion.span>
        )}
      </AnimatePresence>
      <motion.span
        key={isLoading || loading ? 'signing' : 'text'}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className="ml-1"
      >
        {(isLoading || loading) ? 'Signing in...' : 'Continue with Google'}
      </motion.span>
    </motion.button>
  );
};

export default GoogleButton;