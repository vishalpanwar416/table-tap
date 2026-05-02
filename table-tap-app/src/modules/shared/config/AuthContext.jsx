// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../shared/supabase';
import SessionExpiryModal from '../components/SessionExpiryModal';
import { setUserContext } from '../../../sentry';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const getSession = async (isRetry = false) => {
      const safetyTimer = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false);
        }
      }, 5000);

      try {
        // Safely fetch session (detectSessionInUrl: true is handled by SDK)
        const result = await supabase.auth.getSession();
        const session = result?.data?.session;
        const authError = result?.error;

        if (authError) throw authError;

        if (mounted) {
          const hasUser = !!session?.user;
          setUser(session?.user ?? null);
          setWasAuthenticated(hasUser);
          setLoading(false);
        }
      } catch (error) {
        // AbortError = stale/incompatible session in localStorage is causing the SDK
        // to abort its refresh cycle and poison all subsequent requests.
        // Fix: clear ALL stale supabase keys and retry once with a clean slate.
        const isAbort = error?.name === 'AbortError' || error?.message?.includes('aborted');
        if (isAbort && !isRetry) {
          try {
            // Clear all heartbeat/auth keys from localStorage
            Object.keys(localStorage)
              .filter(k => k.toLowerCase().includes('sb-') || k.includes('supabase'))
              .forEach(k => localStorage.removeItem(k));

            // Clear supabase cookies too
            try {
              const cookies = document.cookie.split(";");
              for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                if (name.includes('sb-') || name.includes('supabase')) {
                  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
                }
              }
            } catch (e) { /* ignore cookie errors */ }
          } catch { /* ignore storage errors */ }

          if (mounted) {
            // IMPORTANT: cancel the outer safety timer BEFORE the retry wait
            // so it can't fire mid-retry and incorrectly set loading=false
            clearTimeout(safetyTimer);

            if (isRetry) {
              window.location.reload();
              return;
            }

            await new Promise(r => setTimeout(r, 600));
            return getSession(true); // retry once with clean storage
          }
        }

        if (
          typeof error?.message === 'string' &&
          (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found'))
        ) {
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore
          }
          if (mounted && wasAuthenticated) setShowSessionModal(true);
        }
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      } finally {
        clearTimeout(safetyTimer);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const hasUser = !!session?.user;
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
          setUserContext(session?.user ?? null);
        }

        if (event === 'TOKEN_REFRESH_FAILED') {
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore
          }
          if (mounted && wasAuthenticated) setShowSessionModal(true);
        }

        if (event === 'SIGNED_IN') {
          setWasAuthenticated(true);
          // Attempt to sync guest orders — silently skip if RPC doesn't exist
          try {
            const { data: syncResult } = await supabase.rpc('sync_guest_orders').throwOnError();
            if (syncResult?.linked_count > 0) {
              console.log(`[Auth] Linked ${syncResult.linked_count} guest orders to account.`);
            }
          } catch {
            // RPC may not exist on all environments — ignore completely
          }
        }

        if (event === 'SIGNED_OUT') {
          // Only show modal if we were previously authenticated and not already on an auth page
          const isAuthPage = ['/login', '/signup', '/forgot-password'].some(path => window.location.pathname.includes(path));
          if (mounted && wasAuthenticated && !isAuthPage) {
            setShowSessionModal(true);
          }
          setWasAuthenticated(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = () => setShowSessionModal(false);

  // Explicitly re-reads the session from Supabase and updates state.
  // Call this after signInWithPassword so the user is set before navigation.
  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
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