import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '../../supabase';
import { useLocation } from 'react-router-dom';

const GoogleButton = ({ loading = false, redirectTo = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Preserve URL parameters
      const urlParams = new URLSearchParams(location.search);
      const restaurant = urlParams.get('restaurant');
      const table = urlParams.get('table');
      
      let finalRedirectTo = redirectTo;
      if (!finalRedirectTo) {
        finalRedirectTo = '/auth-callback';
      }
      
      // Add parameters to redirect URL if they exist
      if (restaurant && table) {
        finalRedirectTo += `?restaurant=${restaurant}&table=${table}`;
      }
      
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${finalRedirectTo}`
        }
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert(error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading || isLoading}
      className="w-full bg-white text-gray-700 py-3 rounded-3xl font-medium flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <span className="inline-block h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <FcGoogle size={20} />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
};

export default GoogleButton;