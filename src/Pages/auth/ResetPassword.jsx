import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase';
import { ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    <div className="flex justify-center items-center min-h-screen bg-black p-4">
      <div className="w-full max-w-md">
        <button 
          className="absolute left-4 top-7 md:left-8 md:top-8 text-orange-500 hover:text-orange-600 transition-colors z-10"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft size={30} className="md:w-8 md:h-8" />
        </button>

        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">Reset Password</h1>
            <p className="text-gray-600">
              Enter your new password below
            </p>
          </div>

          {message.text && (
            <div
              className={`mb-6 p-4 rounded-xl ${
                message.type === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 text-black"
                placeholder="••••••••"
                required
                minLength="6"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-4 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 text-black"
                placeholder="••••••••"
                required
                minLength="6"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-medium text-white transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


export default ResetPassword;