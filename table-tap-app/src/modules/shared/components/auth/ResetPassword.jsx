import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const verifyToken = async () => {
      const params = new URLSearchParams(location.search);
      const tokenHash = params.get('token_hash');
      const type = params.get('type');

      if (!tokenHash || type !== 'recovery') {
        setMessage({
          text: 'Invalid password reset link. Please request a new one.',
          type: 'error',
        });
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });

        if (error) throw error;
        setTokenVerified(true);
      } catch (error) {
        // setMessage({
        //   text: 'Invalid or expired password reset link. Please request a new one.',
        //   type: 'error',
        // });
      }
    };

    verifyToken();
  }, [location]);

  // Animation variants
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
  const messageVariants = {
    initial: { opacity: 0, x: 0 },
    animate: { opacity: 1, x: [0, -8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.5 } },
    exit: { opacity: 0 }
  };
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.04 },
    tap: { scale: 0.97 },
    loading: { scale: 1, opacity: 0.7 }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setMessage({
        text: 'Password updated successfully! Redirecting to login...',
        type: 'success',
      });

      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage({ text: error.message || 'Failed to update password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col bg-black relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl flex-1 flex flex-col min-h-0 z-10 mx-auto">
        {/* Header */}
        <div className="w-full px-6 py-8 relative flex items-center justify-center">
          <motion.button
            className="absolute left-4 text-orange-500 hover:text-orange-600"
            onClick={() => navigate('/login')}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ChevronLeft size={30} />
          </motion.button>
          <motion.h1
            className="text-white text-2xl font-medium font-spartan"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Reset Password
          </motion.h1>
        </div>
        {/* Card/Form Container */}
        <motion.div
          className="bg-gray-200 flex-1 flex flex-col min-h-0 rounded-t-3xl px-6 pt-8 pb-6"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.p className="text-gray-600 text-center mb-6" variants={itemVariants}>
            Enter your new password below
          </motion.p>
          <AnimatePresence>
            {message.text && (
              <motion.div
                className={`mb-6 p-4 rounded-xl text-center font-medium ${message.type === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
                  }`}
                variants={messageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                key={message.text}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 bg-white rounded-xl border-0 focus:ring-2 focus:ring-orange-500 text-black pr-12"
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-4 bg-white rounded-xl border-0 focus:ring-2 focus:ring-orange-500 text-black pr-12"
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-full font-medium text-white text-lg mt-2 ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                variants={buttonVariants}
                whileHover={!loading ? 'hover' : undefined}
                whileTap={!loading ? 'tap' : undefined}
                animate={loading ? 'loading' : 'initial'}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </motion.button>
            </motion.div>
          </motion.form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResetPassword;