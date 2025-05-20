import React, { useState } from 'react';
import { useNavigate }      from 'react-router-dom';
import { ArrowLeft }        from 'lucide-react';
import { authService }      from '../../api/authService';

const ForgotPassword = () => {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

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
    <div className="flex justify-center items-center min-h-screen bg-black p-4">
      <div className="w-full max-w-md">
        <button
          className="absolute left-4 top-7 text-orange-500 hover:text-orange-600"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft size={30} />
        </button>
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-black mb-2 text-center">Forgot Password</h1>
          <p className="text-gray-600 text-center mb-6">
            Enter your email to receive a password reset link
          </p>
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl ${
              message.type === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full p-4 bg-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-medium text-white ${
                loading ? 'bg-gray-400' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-700 hover:text-gray-800"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
