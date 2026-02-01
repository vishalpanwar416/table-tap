import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/config/AuthContext';
import { hasValidRestaurantSelection } from '../../../shared/utils/restaurantCheck';
import { authService, syncProfile } from '../../api/authService';
import { supabase } from '../../supabase';
import LoadingScreen from '../LoadingScreen';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [authError, setAuthError] = useState(null);
  const hasAttemptedAuth = useRef(false);

  // Get URL parameters to preserve them
  const urlParams = new URLSearchParams(location.search);
  const restaurant = urlParams.get('restaurant');
  const table = urlParams.get('table');

  const handleRedirect = useCallback(async (authUser) => {
    if (redirecting) return;
    setRedirecting(true);

    try {
      // Sync profile first (especially for Google OAuth)
      await syncProfile(authUser);

      // Check if profile is complete
      const isProfileComplete = await authService.isProfileComplete(authUser.id);

      if (!isProfileComplete) {
        const params = restaurant && table ? `?restaurant=${restaurant}&table=${table}` : '';
        navigate(`/complete-profile${params}`);
        return;
      }

      // Profile is complete, check restaurant selection
      if (hasValidRestaurantSelection()) {
        navigate('/home');
      } else {
        const params = restaurant && table ? `?restaurant=${restaurant}&table=${table}` : '';
        navigate(`/restaurant-selection${params}`);
      }
    } catch (error) {
      console.error('Error during redirect:', error);
      const params = restaurant && table ? `?restaurant=${restaurant}&table=${table}` : '';
      navigate(`/complete-profile${params}`);
    }
  }, [navigate, redirecting, restaurant, table]);

  // Process OAuth callback on mount
  useEffect(() => {
    if (hasAttemptedAuth.current) return;
    hasAttemptedAuth.current = true;

    const processAuth = async () => {
      try {
        // Check for hash fragment with tokens
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hasError = hashParams.has('error') || urlParams.has('error');

        if (hasError) {
          const errorDesc = hashParams.get('error_description') || urlParams.get('error_description') || 'Authentication failed';
          console.error('OAuth error:', errorDesc);
          setAuthError(errorDesc);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (accessToken && refreshToken) {
          // Manually set the session from URL tokens since detectSessionInUrl isn't working
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session:', error);
            setAuthError(error.message);
            setTimeout(() => navigate('/login'), 2000);
            return;
          }

          if (data.session?.user) {
            // Clear hash from URL
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            await handleRedirect(data.session.user);
            return;
          }
        }

        // If no hash tokens, check if we already have a session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          await handleRedirect(sessionData.session.user);
          return;
        }

        // No session found, wait a bit for auth state to update then redirect
      } catch (error) {
        console.error('Auth processing error:', error);
        setAuthError('An error occurred during sign in');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    processAuth();
  }, [navigate, handleRedirect, urlParams]);

  // Listen for auth state changes from context
  useEffect(() => {
    if (loading || redirecting || authError) return;

    if (user) {
      handleRedirect(user);
    } else if (!loading) {
      // Give some time for the session to be established
      const timeout = setTimeout(() => {
        // Double-check if still no user
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user) {
            handleRedirect(data.session.user);
          } else if (!window.location.hash.includes('access_token')) {
            // Only redirect to login if there's no pending OAuth
            navigate('/login');
          }
        });
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [user, loading, redirecting, authError, handleRedirect, navigate]);

  if (authError) {
    return <LoadingScreen message={`Error: ${authError}. Redirecting...`} />;
  }

  return <LoadingScreen message="Completing sign in..." />;
};

export default AuthCallback; 