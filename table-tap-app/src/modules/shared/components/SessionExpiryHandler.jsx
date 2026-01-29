import { useState, useEffect } from 'react';
import { supabase } from '../../shared/supabase';
import SessionExpiryModal from './SessionExpiryModal';

export default function SessionExpiryHandler({ children }) {
  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESH_FAILED') {
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        setShowSessionModal(true);
      }
      if (event === 'SIGNED_OUT' && !session) {
        setShowSessionModal(true);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  const handleLoginSuccess = () => setShowSessionModal(false);

  return (
    <>
      {children}
      <SessionExpiryModal open={showSessionModal} onLoginSuccess={handleLoginSuccess} />
    </>
  );
} 