import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../api/authService';
import GoogleButton from '../../components/auth/GoogleButton';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SignUpPage() {
  const navigate = useNavigate();
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

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) navigate('/home');
      } catch (err) {
        // User not logged in, stay on signup page
      }
    };
    checkSession();
  }, [navigate]);

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
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password should be at least 6 characters');
      return false;
    }
    if (formData.mobileNumber.length < 12) {
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
        dateOfBirth: formData.dateOfBirth
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
      console.error("Signup error:", err);
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
      await authService.signUpWithGoogle();
    } catch (error) {
      console.error('Google signup error:', error);
      setError('Google signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-black">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
      {/* Header */}
      <div className="w-full px-6 py-8 relative flex justify-center">
        <button 
          onClick={() => navigate(-1)}
          className="absolute left-4 top-8 text-orange-500"
        >
          <ArrowLeft size={30} />
        </button>
        <h1 className="text-white text-2xl font-medium font-spartan">Create New Account</h1>
      </div>
      
      {/* Form Container */}
      <div className="bg-gray-200 flex-1 rounded-t-3xl px-6 pt-8 pb-6 flex flex-col">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
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
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-black mb-2 font-medium font-spartan  ">Password</label>
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
          </div>
          <div>
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
        </div>

          {/* Email */}
          <div>
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
          </div>
          
          {/* Mobile Number */}
          <div className="mb-4">
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
          </div>
          
          {/* Date of Birth */}
          <div>
            <label className="block text-black mb-2 font-medium font-spartan">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white text-black font-spartan "
              required
            />
          </div>
          
          {/* Terms Agreement */}
          <div className="text-center mt-4 text-sm">
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
          </div>
          
          {/* Sign Up Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gray-600 text-white py-3 rounded-full mt-6 font-medium text-lg hover:bg-gray-700 transition-colors disabled:bg-orange-300"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        {/* Google Sign-In */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm mb-4 font-spartan">or continue with</p>
          <GoogleButton 
            onClick={handleGoogleSignup} 
            loading={loading}
            redirectTo="/complete-profile"
          />
        </div>
        
        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-black text-sm font-spartan">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-red-500 font-medium hover:underline font-spartan"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
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
    </div>
  );
}