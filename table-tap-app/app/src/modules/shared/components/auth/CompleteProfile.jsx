import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { authService } from '../../api/authService';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeProfileImage } from '../../utils/imageOptimization';
import { User as UserIcon } from 'lucide-react';


export default function CompleteProfile() {
  const [mobileNumber, setMobileNumber] = useState('+91 ');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = React.useRef();

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const user = await authService.getCurrentUser();

        if (user) {
          const isComplete = await authService.isProfileComplete(user.id);
          if (isComplete) {
            navigate('/home');
          }
        } else {
          navigate('/login');
        }
      } catch (err) {
        navigate('/login');
      }
    };

    checkProfile();
  }, [navigate]);

  const handleMobileChange = (e) => {
    const value = e.target.value;
    if (e.nativeEvent.inputType === 'deleteContentBackward') {
      if (value.length <= 4) {
        setMobileNumber('+91 ');
        return;
      }
      setMobileNumber(value);
      return;
    }

    const digits = value.replace(/\D/g, '');
    if (!value.startsWith('+91') && digits.length > 0) {
      const newDigits = digits.slice(0, 10);
      setMobileNumber(`+91 ${newDigits}`);
      return;
    }

    const newDigits = digits.slice(2, 12);
    const formatted = newDigits.length > 5
      ? `+91 ${newDigits.slice(0, 5)} ${newDigits.slice(5)}`
      : `+91 ${newDigits}`;

    setMobileNumber(formatted);
  };

  // Helper: get initials from name only (not mobile)
  // Assume user's name is available as userName (if not, fallback to UserIcon)
  const userName = '';
  const getInitials = () => {
    if (!userName) return '';
    const parts = userName.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Handle avatar file select
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const optimized = await optimizeProfileImage(file, { maxSize: 256, quality: 0.7 });
      setAvatarUrl(optimized);
    } catch (err) {
      toast('Failed to process image', { type: 'error' });
    } finally {
      setAvatarLoading(false);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = () => setAvatarUrl('');

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
  const errorVariants = {
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
    if (mobileNumber.length < 12) {
      setError('Please enter a valid mobile number');
      return;
    }
    if (!dateOfBirth) {
      setError('Date of birth is required');
      return;
    }

    // Age check (same as SignupPage)
    const today = new Date();
    const dob = new Date(dateOfBirth);
    const age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    const isBirthdayPassed = m > 0 || (m === 0 && today.getDate() >= dob.getDate());
    const actualAge = isBirthdayPassed ? age : age - 1;
    if (actualAge < 13) {
      toast('You must be at least 13 years old to sign up.', {
        type: 'error',
        position: 'top-center',
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        style: {
          background: '#fff',
          color: '#e53e3e',
          borderRadius: '8px',
          fontWeight: 500,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          fontFamily: 'inherit',
          fontSize: '15px',
          padding: '12px 20px'
        },
        icon: false,
        transition: Slide,
      });
      return;
    }

    try {
      setLoading(true);
      setError('');

      await authService.updateProfile({
        mobile_number: mobileNumber,
        date_of_birth: dateOfBirth,
        avatar_url: avatarUrl || 'https://ui-avatars.com/api/?name=User&background=random'
      });

      navigate('/home');
    } catch (err) {
      setError(err.message || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="flex justify-center items-start min-h-screen bg-black relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl flex flex-col z-10">
        {/* Header */}
        <div className="w-full px-6 py-8 relative flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 top-8 text-orange-500"
          >
            <ArrowLeft size={30} />
          </button>
          <motion.h1
            className="text-white text-2xl font-medium font-spartan"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Complete Profile
          </motion.h1>
        </div>
        {/* Profile Photo Upload */}
        <motion.div
          className="flex justify-center items-center mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 120, damping: 12 }}
        >
          <motion.div
            className="relative group cursor-pointer"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{ width: 96, height: 96 }}
          >
            <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-gray-300 group-hover:border-orange-400 transition-all">
              {avatarLoading ? (
                <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : getInitials() ? (
                <span className="text-3xl font-bold text-orange-600">{getInitials()}</span>
              ) : (
                <UserIcon className="w-10 h-10 text-gray-400" />
              )}
            </div>
            {/* Remove button */}
            {avatarUrl && !avatarLoading && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleRemoveAvatar(); }}
                className="absolute -bottom-2 right-0 bg-white border border-gray-300 rounded-full px-2 py-0.5 text-xs text-gray-600 shadow hover:bg-red-100 hover:text-red-600 transition-all"
              >
                Remove
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              aria-label="Choose profile photo"
            />
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/80 px-2 py-0.5 rounded shadow mt-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">Change Photo</span>
          </motion.div>
        </motion.div>
        {/* Card/Form Container */}
        <motion.div
          className="bg-gray-200 flex-1 min-h-[calc(100vh-180px)] rounded-t-3xl px-4 pt-8 pb-6 flex flex-col"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <AnimatePresence>
            {error && (
              <motion.div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
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
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={itemVariants}>
              <label className="block text-black mb-2 font-spartan-medium">Mobile Number</label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={handleMobileChange}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-xl bg-white text-black"
                required
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <label className="block text-black mb-2 font-spartan-medium">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white text-black"
                required
              />
            </motion.div>
            <motion.div className="pt-10" variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-600 text-white py-3 rounded-full mt-6 font-spartan-bold text-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400"
                variants={buttonVariants}
                whileHover={!loading ? 'hover' : undefined}
                whileTap={!loading ? 'tap' : undefined}
                animate={loading ? 'loading' : 'initial'}
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </motion.button>
            </motion.div>
          </motion.form>
        </motion.div>
        <ToastContainer
          position="top-center"
          autoClose={2000}
          hideProgressBar
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable={false}
          pauseOnHover={false}
          theme="light"
          style={{ margin: '0 auto', left: 0, right: 0, width: 'auto', minWidth: 0, maxWidth: 320 }}
          toastStyle={{
            background: '#fff',
            color: '#e53e3e',
            borderRadius: '8px',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            fontFamily: 'inherit',
            fontSize: '15px',
            padding: '12px 20px'
          }}
          transition={Slide}
          closeButton={false}
        />
      </div>
    </motion.div>
  );
}