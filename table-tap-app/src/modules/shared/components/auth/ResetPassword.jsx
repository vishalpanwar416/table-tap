import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase';
import { ChevronLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const cardVariants = {
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 60, damping: 16 } },
  exit: { y: 40, opacity: 0, transition: { duration: 0.2 } },
};
const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
};
const messageVariants = {
  initial: { opacity: 0, x: 0 },
  animate: { opacity: 1, x: [0, -8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.5 } },
  exit: { opacity: 0 },
};
const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.04 },
  tap: { scale: 0.97 },
  loading: { scale: 1, opacity: 0.7 },
};

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePasswordReset = async () => {
      setVerifying(true);

      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Check for query parameters (PKCE flow)
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        const tokenHash = queryParams.get('token_hash');
        const queryType = queryParams.get('type');

        // Handle hash fragment flow (type=recovery)
        if (accessToken && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            throw new Error('Invalid or expired reset link. Please request a new one.');
          }

          setSessionReady(true);
          setVerifying(false);
          return;
        }

        // Handle PKCE code exchange flow
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw new Error('Invalid or expired reset link. Please request a new one.');
          }

          setSessionReady(true);
          setVerifying(false);
          return;
        }

        // Handle token_hash flow (email OTP verification)
        if (tokenHash && queryType === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (error) {
            throw new Error('Invalid or expired reset link. Please request a new one.');
          }

          setSessionReady(true);
          setVerifying(false);
          return;
        }

        // Check if there's already an active session (user may have clicked link already)
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setSessionReady(true);
          setVerifying(false);
          return;
        }

        // No valid token found
        setMessage({
          text: 'Invalid password reset link. Please request a new one.',
          type: 'error',
        });
        setVerifying(false);
      } catch (error) {
        setMessage({
          text: error.message || 'Invalid or expired password reset link.',
          type: 'error',
        });
        setVerifying(false);
      }
    };

    handlePasswordReset();
  }, [location]);

  const validatePassword = (pwd) => {
    if (pwd.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setMessage({ text: passwordError, type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: '', type: '' });

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      // Sign out to ensure clean state
      await supabase.auth.signOut();

      setMessage({
        text: 'Password updated successfully! Redirecting to login...',
        type: 'success',
      });

      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      let errorMessage = 'Failed to update password';

      if (error.message?.includes('expired')) {
        errorMessage = 'Your reset link has expired. Please request a new one.';
      } else if (error.message?.includes('same')) {
        errorMessage = 'New password must be different from the old password.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while verifying
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show error state if not session ready and has error
  if (!sessionReady && message.type === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Link Invalid</h2>
          <p className="text-gray-600 mb-6">{message.text}</p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium transition-colors"
          >
            Request New Reset Link
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 mt-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Back to Login
          </button>
        </motion.div>
      </div>
    );
  }

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
            className="absolute left-4 text-orange-500 hover:text-orange-600 transition-all duration-300 p-2 rounded-full hover:bg-orange-500/10 active:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/30 z-10"
            onClick={() => navigate('/login')}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            aria-label="Go back to login"
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
                className={`mb-6 p-4 rounded-xl text-center font-medium flex items-center justify-center gap-2 ${
                  message.type === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}
                variants={messageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                key={message.text}
              >
                {message.type === 'success' && <CheckCircle size={20} />}
                {message.type === 'error' && <AlertCircle size={20} />}
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setMessage({ text: '', type: '' });
                  }}
                  className="w-full p-4 bg-white rounded-xl border-0 focus:ring-2 focus:ring-orange-500 text-black pr-12"
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setMessage({ text: '', type: '' });
                  }}
                  className="w-full p-4 bg-white rounded-xl border-0 focus:ring-2 focus:ring-orange-500 text-black pr-12"
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
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
                disabled={loading || !password || !confirmPassword}
                className={`w-full py-3 rounded-full font-medium text-white text-lg mt-2 ${
                  loading || !password || !confirmPassword
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
