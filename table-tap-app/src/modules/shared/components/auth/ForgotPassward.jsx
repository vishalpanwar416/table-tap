import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { authService } from '../../api/authService';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

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
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95 }
  };
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.04 },
    tap: { scale: 0.97 },
    loading: { scale: 1, opacity: 0.7 }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    const trimmedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!validateEmail(trimmedEmail)) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      await authService.sendPasswordResetEmail(trimmedEmail);
      setEmailSent(true);
      setMessage({
        text: 'Password reset link sent! Check your email inbox and spam folder.',
        type: 'success'
      });
    } catch (error) {
      let errorMessage = 'Failed to send reset link. Please try again.';

      if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (error.message?.includes('not found') || error.message?.includes('User not found')) {
        // Don't reveal if email exists for security
        setEmailSent(true);
        setMessage({
          text: 'If an account exists with this email, you will receive a password reset link.',
          type: 'success'
        });
        return;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await authService.sendPasswordResetEmail(email.trim().toLowerCase());
      setMessage({
        text: 'Reset link resent! Check your email inbox.',
        type: 'success'
      });
    } catch (error) {
      if (error.message?.includes('rate limit')) {
        setMessage({
          text: 'Please wait a few minutes before requesting another reset link.',
          type: 'error'
        });
      } else {
        setMessage({
          text: 'Failed to resend. Please try again.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Success state after email is sent
  if (emailSent && message.type === 'success') {
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
              className="absolute left-4 text-primary-500 hover:text-primary-600 transition-all duration-300 p-2 rounded-full hover:bg-primary-500/10 active:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-500/30 z-10"
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
              Check Your Email
            </motion.h1>
          </div>
          {/* Success Card */}
          <motion.div
            className="bg-gray-200 flex-1 flex flex-col min-h-0 rounded-t-3xl px-6 pt-8 pb-6"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
              >
                <Mail className="w-10 h-10 text-green-600" />
              </motion.div>

              <motion.h2
                className="text-2xl font-bold text-gray-900 mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Email Sent!
              </motion.h2>

              <motion.p
                className="text-gray-600 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                We've sent a password reset link to:
              </motion.p>

              <motion.p
                className="text-gray-900 font-medium mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {email}
              </motion.p>

              <motion.div
                className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8 w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-sm text-primary-800">
                  <strong>Tip:</strong> If you don't see the email, check your spam or junk folder.
                </p>
              </motion.div>

              <motion.div
                className="w-full space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className={`w-full py-3 rounded-full font-medium text-lg transition-colors ${loading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                >
                  {loading ? 'Sending...' : 'Resend Email'}
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Back to Login
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
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
            className="absolute left-4 text-primary-500 hover:text-primary-600 transition-all duration-300 p-2 rounded-full hover:bg-primary-500/10 active:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-500/30 z-10"
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
            Forgot Password
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
          <motion.div
            className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Mail className="w-8 h-8 text-primary-600" />
          </motion.div>

          <motion.p className="text-gray-600 text-center mb-6" variants={itemVariants}>
            Enter your email address and we'll send you a link to reset your password.
          </motion.p>

          <AnimatePresence>
            {message.text && (
              <motion.div
                className={`mb-6 p-4 rounded-xl text-center font-medium flex items-center justify-center gap-2 ${message.type === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                  }`}
                variants={messageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                key={message.text}
              >
                {message.type === 'error' && <AlertCircle size={20} />}
                {message.type === 'success' && <CheckCircle size={20} />}
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setMessage({ text: '', type: '' });
                }}
                placeholder="you@example.com"
                required
                className="w-full p-4 bg-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={loading || !email.trim()}
                className={`w-full py-3 rounded-full font-medium text-white text-lg mt-2 transition-colors ${loading || !email.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                variants={buttonVariants}
                whileHover={!loading && email.trim() ? 'hover' : undefined}
                whileTap={!loading && email.trim() ? 'tap' : undefined}
                animate={loading ? 'loading' : 'initial'}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </motion.button>
            </motion.div>
          </motion.form>

          <motion.div className="mt-6 text-center" variants={itemVariants}>
            <button
              onClick={() => navigate('/login')}
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Back to Login
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;
