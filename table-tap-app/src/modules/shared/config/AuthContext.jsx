// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../../shared/supabase';
import SessionExpiryModal from '../components/SessionExpiryModal';

const AuthContext = createContext();

// Check if we're on an OAuth callback page with tokens
const isOAuthCallback = () => {
  const hash = window.location.hash;
  const search = window.location.search;
  return (
    hash.includes('access_token') ||
    hash.includes('error') ||
    search.includes('code=') ||
    search.includes('error=')
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const wasAuthenticatedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST before getting session
    // This ensures we catch the SIGNED_IN event from OAuth callbacks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        const hasUser = !!session?.user;
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'TOKEN_REFRESH_FAILED') {
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore
          }
          if (wasAuthenticatedRef.current) setShowSessionModal(true);
        }

        if (event === 'SIGNED_IN') {
          wasAuthenticatedRef.current = true;
        }

        if (event === 'SIGNED_OUT') {
          // Only show modal if we were previously authenticated and not already on an auth page
          const isAuthPage = ['/login', '/signup', '/forgot-password'].some(path => window.location.pathname.includes(path));
          if (wasAuthenticatedRef.current && !isAuthPage) {
            setShowSessionModal(true);
          }
          wasAuthenticatedRef.current = false;
        }
      }
    );

    // Now get the initial session
    const initializeSession = async () => {
      try {
        // If we're on OAuth callback, give Supabase a moment to process the URL
        if (isOAuthCallback()) {
          // Wait a tick for detectSessionInUrl to process
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (
            typeof error?.message === 'string' &&
            (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found'))
          ) {
            try {
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
            if (wasAuthenticatedRef.current) setShowSessionModal(true);
          }
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          const hasUser = !!session?.user;
          setUser(session?.user ?? null);
          wasAuthenticatedRef.current = hasUser;
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeSession();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = () => setShowSessionModal(false);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
      <SessionExpiryModal open={showSessionModal} onLoginSuccess={handleLoginSuccess} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};