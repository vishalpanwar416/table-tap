import React, { useState } from 'react';
import { useNavigate }      from 'react-router-dom';
import { ArrowLeft }        from 'lucide-react';
import { authService }      from '../../api/authService';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword = () => {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
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

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await authService.sendPasswordResetEmail(email);
      setMessage({ text: 'Password reset link sent to your email!', type: 'success' });
    } catch (error) {
      setMessage({ text: error.message || 'Failed to send reset link', type: 'error' });
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
        <div className="w-full px-6 py-8 relative flex justify-center">
          <motion.button
            className="absolute left-4 top-8 text-orange-500 hover:text-orange-600"
            onClick={() => navigate('/login')}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ArrowLeft size={30} />
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
          <motion.p className="text-gray-600 text-center mb-6" variants={itemVariants}>
            Enter your email to receive a password reset link
          </motion.p>
          <AnimatePresence>
            {message.text && (
              <motion.div
                className={`mb-6 p-4 rounded-xl text-center font-medium ${
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
            <motion.input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full p-4 bg-white rounded-xl focus:ring-2 focus:ring-orange-500"
              variants={itemVariants}
            />
            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-full font-medium text-white text-lg mt-2 ${
                  loading ? 'bg-gray-400' : 'bg-gray-600 hover:bg-gray-700'
                }`}
                variants={buttonVariants}
                whileHover={!loading ? 'hover' : undefined}
                whileTap={!loading ? 'tap' : undefined}
                animate={loading ? 'loading' : 'initial'}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </motion.button>
            </motion.div>
          </motion.form>
          <motion.div className="mt-6 text-center" variants={itemVariants}>
            <button
              onClick={() => navigate('/login')}
              className="text-gray-700 hover:text-gray-800"
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
