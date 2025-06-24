import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import GoogleButton from '../../components/auth/GoogleButton';
import AuthForm from '../../components/auth/AuthForm';
import { authService } from '../../api/authService';
import { hasValidRestaurantSelection, getStoredRestaurantSelection } from '../../utils/restaurantCheck';

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
    
    try {
      await authService.signInWithPassword(email, password);
      // Check if user has restaurant selection after login
      if (hasValidRestaurantSelection()) {
        navigate('/home');
      } else {
        // Preserve URL parameters when redirecting to restaurant selection
        const params = urlRestaurant && urlTable ? `?restaurant=${urlRestaurant}&table=${urlTable}` : '';
        navigate(`/restaurant-selection${params}`);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
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

  return (
    <div className="flex justify-center items-start min-h-screen bg-black">
        <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
      {/* Header */}
      <div className="w-full px-6 py-8 relative flex justify-center">
        <button
          className="absolute left-4 top-8 text-orange-500"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={30} />
        </button>
        <h1 className="text-gray-100 text-3xl font-medium font-spartan">Log In</h1>
      </div>

      {/* Login Container */}
      <div className="bg-gray-200 w-full flex-1 rounded-t-3xl px-6 pt-10 pb-6 flex flex-col font-spartan">
        <h2 className="justify-center text-center text-black text-3xl font-semibold mb-12">Welcome</h2>

        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}

        {/* Form */}
        <AuthForm onSubmit={handleSubmit} className="space-y-6">
          <div >
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
          </div>

          <div>
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
          </div>

          {/* Login Button */}
          <AuthForm.Button
            type="submit"
            disabled={loading}
            className="bg-gray-600 text-white py-3 rounded-full mt-8 font-medium text-lg"
          >
            {loading ? 'Logging In...' : 'Log In'}
          </AuthForm.Button>
        </AuthForm>

        {/* Alternative Login */}
        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">or sign up with</p>
          <div className="flex justify-center mt-4">
            <GoogleButton 
              loading={loading}
            />
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="mt-auto pt-6 text-center">
          <p className="text-gray-600 text-xl pb-[150px]">
            Don't have an account?
            <button
              onClick={() => navigate('/signup')}
              className="text-red-600 font-medium ml-1"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}