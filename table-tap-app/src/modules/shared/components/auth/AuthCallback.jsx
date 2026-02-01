import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { hasValidRestaurantSelection } from '../../../shared/utils/restaurantCheck';
import { authService, syncProfile } from '../../api/authService';
import { supabase } from '../../supabase';
import LoadingScreen from '../LoadingScreen';

// Helper to add timeout to promises
const withTimeout = (promise, ms, errorMessage) => {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error(errorMessage)), ms)
  );
  return Promise.race([promise, timeout]);
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('Processing...');
  const isProcessing = useRef(false);

  // Get URL parameters to preserve them
  const urlParams = new URLSearchParams(location.search);
  const restaurant = urlParams.get('restaurant');
  const table = urlParams.get('table');
  const getParams = () => restaurant && table ? `?restaurant=${restaurant}&table=${table}` : '';

  useEffect(() => {
    // Prevent double processing
    if (isProcessing.current) return;
    isProcessing.current = true;

    const processOAuthCallback = async () => {
      try {
        setStatus('Reading authentication data...');
        
        // Extract tokens from URL hash
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = hashParams.get('error') || urlParams.get('error');

        // Handle OAuth errors
        if (errorParam) {
          const errorDesc = hashParams.get('error_description') || 'Authentication failed';
          console.error('OAuth error:', errorDesc);
          setStatus(`Error: ${errorDesc}`);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        let sessionUser = null;

        // Check if Supabase is properly configured
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        console.log('Supabase URL configured:', !!supabaseUrl, supabaseUrl?.substring(0, 30));
        
        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
          setStatus('Configuration error: Supabase not configured');
          console.error('Supabase URL not configured properly');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // If we have tokens in URL, set the session manually
        if (accessToken && refreshToken) {
          setStatus('Setting up session...');
          console.log('Setting session with tokens (with 10s timeout)...');
          
          try {
            const result = await withTimeout(
              supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              }),
              10000,
              'Session setup timed out - check Supabase configuration'
            );

            const { data, error } = result;
            console.log('setSession result:', { data, error });

            if (error) {
              console.error('Session error:', error);
              setStatus(`Session error: ${error.message}`);
              setTimeout(() => navigate('/login'), 2000);
              return;
            }

            sessionUser = data.session?.user;
            console.log('Session user:', sessionUser?.email);
            
            // Clear hash from URL
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          } catch (setSessionError) {
            console.error('setSession threw:', setSessionError);
            setStatus(`Session setup failed: ${setSessionError.message}`);
            setTimeout(() => navigate('/login'), 2000);
            return;
          }
        } else {
          // No tokens in URL, check for existing session
          setStatus('Checking existing session...');
          console.log('No tokens in URL, checking existing session...');
          const { data } = await withTimeout(
            supabase.auth.getSession(),
            5000,
            'Session check timed out'
          );
          sessionUser = data.session?.user;
          console.log('Existing session user:', sessionUser?.email);
        }

        // If no user found, redirect to login
        if (!sessionUser) {
          console.error('No session user found after auth');
          setStatus('Authentication incomplete. Redirecting to login...');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // We have a user, now sync profile and redirect
        setStatus('Syncing profile...');
        
        try {
          await syncProfile(sessionUser);
        } catch (syncError) {
          console.error('Profile sync error (non-fatal):', syncError);
          // Continue even if sync fails
        }

        setStatus('Checking profile completion...');
        
        let isComplete = false;
        try {
          isComplete = await authService.isProfileComplete(sessionUser.id);
        } catch (profileError) {
          console.error('Profile check error:', profileError);
          // Assume incomplete if check fails
        }

        if (!isComplete) {
          setStatus('Redirecting to complete profile...');
          navigate(`/complete-profile${getParams()}`);
          return;
        }

        // Profile complete, check restaurant selection
        if (hasValidRestaurantSelection()) {
          setStatus('Redirecting to home...');
          navigate('/home');
        } else {
          setStatus('Redirecting to restaurant selection...');
          navigate(`/restaurant-selection${getParams()}`);
        }

      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus(`Error: ${error.message || 'Unknown error'}`);
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    processOAuthCallback();
  }, [navigate, urlParams, restaurant, table]);

  return <LoadingScreen message={status} />;
};

export default AuthCallback; 