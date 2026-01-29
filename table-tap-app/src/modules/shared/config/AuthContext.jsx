// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../shared/supabase';
import SessionExpiryModal from '../components/SessionExpiryModal';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        // Handle invalid/expired refresh token gracefully by clearing session.
        // This typically happens when localStorage has a stale token.
        if (
          typeof error?.message === 'string' &&
          (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found'))
        ) {
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore
          }
          if (mounted) setShowSessionModal(true);
        }
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
        if (event === 'TOKEN_REFRESH_FAILED') {
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore
          }
          if (mounted) setShowSessionModal(true);
        }
        if (event === 'SIGNED_OUT' && !session) {
          setShowSessionModal(true);
        }
      }
    );

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