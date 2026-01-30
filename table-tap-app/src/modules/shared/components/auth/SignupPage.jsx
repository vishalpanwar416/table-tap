import React, { useState, useEffect } from 'react';
import { ChevronLeft, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../../api/authService';
import GoogleButton from './auth/GoogleButton';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeProfileImage } from '../../../shared/utils/imageOptimization';
import { User as UserIcon } from 'lucide-react';
import { validatePassword, validateEmail, validatePhoneNumber, sanitizeInput, rateLimiter } from '../../../shared/utils/security';

export default function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
    email: '',
    mobileNumber: '+91 ',
    dateOfBirth: ''
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = React.useRef();

  // Get URL parameters
  const urlParams = new URLSearchParams(location.search);
  const urlRestaurant = urlParams.get('restaurant');
  const urlTable = urlParams.get('table');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          // Preserve URL parameters when redirecting
          const params = urlRestaurant && urlTable ? `?restaurant=${urlRestaurant}&table=${urlTable}` : '';
          navigate(`/home${params}`);
        }
      } catch (err) {
        // User not logged in, stay on signup page
      }
    };
    checkSession();
  }, [navigate, urlRestaurant, urlTable]);

  // Helper: get initials from full name
  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    if (name === 'mobileNumber') {
      if (e.nativeEvent.inputType === 'deleteContentBackward') {
        if (value.length <= 4) {
          setFormData(prev => ({ ...prev, [name]: '+91 ' }));
          return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
        return;
      }
      const digits = value.replace(/\D/g, '');
      if (!value.startsWith('+91') && digits.length > 0) {
        const newDigits = digits.slice(0, 10);
        setFormData(prev => ({ ...prev, [name]: `+91 ${newDigits}` }));
        return;
      }
      const newDigits = digits.slice(2, 12);
      const formatted = newDigits.length > 5
        ? `+91 ${newDigits.slice(0, 5)} ${newDigits.slice(5)}`
        : `+91 ${newDigits}`;

      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }

    setFormData(updatedFormData);

    if (
      (name === 'password' || name === 'confirmPassword') &&
      updatedFormData.password &&
      updatedFormData.confirmPassword
    ) {
      if (updatedFormData.password !== updatedFormData.confirmPassword) {
        setError('Passwords do not match');
      } else {
        setError('');
      }
    }
  };

  const validateForm = () => {
    // Sanitize inputs
    const sanitizedFullName = sanitizeInput(formData.fullName.trim());
    const sanitizedEmail = sanitizeInput(formData.email.trim());

    if (!sanitizedFullName) {
      setError('Full name is required');
      return false;
    }

    if (!sanitizedEmail) {
      setError('Email is required');
      return false;
    }

    // Validate email
    if (!validateEmail(sanitizedEmail)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }

    // Validate password with enhanced security
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(', '));
      return false;
    }

    // Validate phone number
    const cleanPhone = formData.mobileNumber.replace(/\D/g, '');
    if (!validatePhoneNumber(cleanPhone)) {
      setError('Please enter a valid mobile number');
      return false;
    }

    if (!formData.dateOfBirth) {
      setError('Date of birth is required');
      return false;
    }

    // Age check
    const today = new Date();
    const dob = new Date(formData.dateOfBirth);
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
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      await authService.signUp({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        mobileNumber: formData.mobileNumber,
        dateOfBirth: formData.dateOfBirth,
        avatar_url: avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(formData.fullName) + '&background=random'
      });

      // Show verification toast
      toast('Verify your profile by clicking on the email you receive.', {
        type: 'info',
        position: 'top-center',
        autoClose: 4000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        style: {
          background: '#fff',
          color: '#2563eb',
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

      setFormData({
        fullName: '',
        password: '',
        confirmPassword: '',
        email: '',
        mobileNumber: '+91 ',
        dateOfBirth: ''
      });

      // Do NOT navigate to /home here.
      // Optionally, you can redirect to a verify page:
      // navigate('/verify-email');
    } catch (err) {
      let errorMessage = 'Registration failed. Please check your details';

      // Handle specific error messages
      if (err.message.includes('duplicate')) {
        if (err.message.includes('email')) {
          errorMessage = 'Email is already registered';
        }
        else if (err.message.includes('profiles_mobile_number_key')) {
          errorMessage = 'Mobile number is already registered';
        }
      }

      toast(errorMessage, {
        type: 'error',
        position: 'top-center',
        autoClose: 3000,
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
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setError('');
      // Preserve URL parameters for Google auth
      const params = urlRestaurant && urlTable ? `?restaurant=${urlRestaurant}&table=${urlTable}` : '';
      const redirectTo = `/auth-callback${params}`;
      await authService.signUpWithGoogle(redirectTo);
    } catch (error) {
      setError('Google signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <motion.div
      className="flex justify-center items-start min-h-screen bg-black relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl flex flex-col z-10">
        {/* Header */}
        <div className="w-full px-6 py-8 relative flex items-center justify-center">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 text-orange-500 hover:text-orange-600 transition-all duration-300 p-2 rounded-full hover:bg-orange-500/10 active:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/30 z-10"
            aria-label="Go back"
          >
            <ChevronLeft size={30} />
          </button>
          <motion.h1
            className="text-white text-2xl font-medium font-spartan"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Create New Account
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
              ) : formData.fullName ? (
                <span className="text-3xl font-bold text-orange-600">{getInitials(formData.fullName)}</span>
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
        {/* Form Container */}
        <motion.div
          className="bg-gray-200 flex-1 rounded-t-3xl px-6 pt-8 pb-6 flex flex-col"
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
                <span className="block sm:inline">{error}</span>
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
            {/* Full Name */}
            <motion.div variants={itemVariants}>
              <label className="block text-black mb-2 font-medium font-spartan">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl bg-white text-black font-spartan"
                required
              />
            </motion.div>
            {/* Password */}
            <motion.div variants={itemVariants}>
              <label className="block text-black mb-2 font-medium font-spartan">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 rounded-xl bg-white text-black pr-12 font-spartan"
                  minLength="6"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </motion.div>
            {/* Confirm Password */}
            <motion.div variants={itemVariants}>
              <label className="block text-black mb-2 font-medium font-spartan">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 rounded-xl bg-white text-black pr-12 font-spartan"
                  minLength="6"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </motion.div>
            {/* Email */}
            <motion.div variants={itemVariants}>
              <label className="block text-black mb-2 font-medium font-spartan">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@domain.com"
                className="w-full px-4 py-3 rounded-xl bg-white text-black font-spartan"
                required
              />
            </motion.div>
            {/* Mobile Number */}
            <motion.div className="mb-4" variants={itemVariants}>
              <label className="block text-black mb-2 font-medium font-spartan">Mobile Number</label>
              <div className="relative">
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-colors font-spartan"
                  required
                />
              </div>
            </motion.div>
            {/* Date of Birth */}
            <motion.div variants={itemVariants}>
              <label className="block text-black mb-2 font-medium font-spartan">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white text-black font-spartan "
                required
              />
            </motion.div>
            {/* Terms Agreement */}
            <motion.div className="text-center mt-4 text-sm" variants={itemVariants}>
              <p className="text-gray-600 font-spartan">
                By continuing, you agree to our{' '}
                <Link
                  to="/terms"
                  className="text-red-500 font-medium hover:underline font-spartan"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  className="text-red-500 font-medium hover:underline font-spartan"
                >
                  Privacy Policy
                </Link>
              </p>
            </motion.div>
            {/* Sign Up Button */}
            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-600 text-white py-3 rounded-full mt-6 font-medium text-lg hover:bg-gray-700 transition-colors disabled:bg-orange-300"
                variants={buttonVariants}
                whileHover={!loading ? 'hover' : undefined}
                whileTap={!loading ? 'tap' : undefined}
                animate={loading ? 'loading' : 'initial'}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </motion.button>
            </motion.div>
          </motion.form>
          {/* Google Sign-In */}
          <motion.div className="mt-6 text-center" variants={itemVariants}>
            <p className="text-gray-600 text-sm mb-4 font-spartan">or continue with</p>
            <GoogleButton
              onClick={handleGoogleSignup}
              loading={loading}
              redirectTo="/complete-profile"
            />
          </motion.div>
          {/* Login Link */}
          <motion.div className="mt-6 text-center" variants={itemVariants}>
            <p className="text-black text-sm font-spartan">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-red-500 font-medium hover:underline font-spartan"
              >
                Login here
              </Link>
            </p>
          </motion.div>
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
          style={{ width: 'auto', minWidth: 0, maxWidth: 320 }}
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