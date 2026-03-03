// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../shared/supabase';
import SessionExpiryModal from '../components/SessionExpiryModal';

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
          console.warn('[AuthContext] Loading timeout (5s), force clearing...');
          setLoading(false);
        }
      }, 5000);

      try {
        console.log('[AuthContext] Fetching session...');
        // Safely fetch session (detectSessionInUrl: true is handled by SDK)
        const result = await supabase.auth.getSession();
        const session = result?.data?.session;
        const authError = result?.error;

        if (authError) throw authError;

        if (mounted) {
          const hasUser = !!session?.user;
          console.log('[AuthContext] User present:', hasUser);
          setUser(session?.user ?? null);
          setWasAuthenticated(hasUser);
          setLoading(false);
        }
      } catch (error) {
        console.error('[AuthContext] Session error:', error);

        // AbortError = stale/incompatible session in localStorage is causing the SDK
        // to abort its refresh cycle and poison all subsequent requests.
        // Fix: clear ALL stale supabase keys and retry once with a clean slate.
        const isAbort = error?.name === 'AbortError' || error?.message?.includes('aborted');
        if (isAbort && !isRetry) {
          console.warn('[AuthContext] AbortError detected — clearing ALL supabase storage and retrying...');
          try {
            // Clear all heartbeat/auth keys from localStorage
            Object.keys(localStorage)
              .filter(k => k.toLowerCase().includes('sb-') || k.includes('supabase'))
              .forEach(k => { console.log('[AuthContext] Removing key:', k); localStorage.removeItem(k); });

            // Aggressively clear cookies as well (sources of many AbortErrors)
            try {
              const cookies = document.cookie.split(";");
              for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                if (name.includes('sb-') || name.includes('supabase')) {
                  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                  // Also try clearing with current domain
                  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
                }
              }
            } catch (e) { /* ignore cookie errors */ }
          } catch { /* ignore storage errors */ }

          if (mounted) {
            clearTimeout(safetyTimer);

            // If we've already tried clearing storage once and it still aborted, 
            // a hard reload is often the only way to reset the browser/SDK state.
            if (isRetry) {
              console.warn('[AuthContext] Abort persistent — performing HARD RELOAD');
              window.location.reload();
              return;
            }

            // Wait slightly more to let browser/SDK settle
            await new Promise(r => setTimeout(r, 600));
            return getSession(true); // retry once
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
          // NEW: Attempt to sync guest orders using RPC
          try {
            const { data: syncResult, error: syncError } = await supabase.rpc('sync_guest_orders');
            if (!syncError && syncResult?.success && syncResult?.linked_count > 0) {
              console.log(`[Auth] Automatically linked ${syncResult.linked_count} guest orders to account.`);
            }
          } catch (err) {
            console.warn('[Auth] Background sync of guest orders failed (non-critical):', err);
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