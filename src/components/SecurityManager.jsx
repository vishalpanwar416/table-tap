import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../config/AuthContext';
import { sessionManager, rateLimiter } from '../utils/security';
import { authService } from '../api/authService'; // Assuming you have a way to re-authenticate
import AuthForm from '../components/auth/AuthForm'; // Or your login form component
import GoogleButton from '../components/auth/GoogleButton'; // If you want Google login in modal

const SecurityManager = () => {
  const { user } = useAuth();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const sessionTimeoutRef = useRef(null);
  const activityTimeoutRef = useRef(null);

  // Handle user activity
  const handleUserActivity = () => {
    if (user) {
      sessionManager.updateActivity();
    }
  };

  // Check session validity
  const checkSession = () => {
    // if (user && !sessionManager.isSessionValid()) {
    //   // navigate('/login?message=session_expired');
    //   // setShowSessionModal(true);
    // }
  };

  // Set up activity listeners and session check
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    sessionTimeoutRef.current = setInterval(checkSession, 60000);

    activityTimeoutRef.current = setInterval(() => {
      if (user) {
        sessionManager.updateActivity();
      }
    }, 300000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      if (sessionTimeoutRef.current) clearInterval(sessionTimeoutRef.current);
      if (activityTimeoutRef.current) clearInterval(activityTimeoutRef.current);
    };
  }, [user]);

  // Handler for successful login in modal
  const handleLoginSuccess = () => {
    sessionManager.updateActivity();
    setShowSessionModal(false);
  };

  return (
    <>
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Session Expired</h2>
            <p className="mb-4">Please log in again to continue.</p>
            {/* Render your login form here, pass a prop/callback for success */}
            <AuthForm onLoginSuccess={handleLoginSuccess} />
            <div className="mt-4">
              <GoogleButton onLoginSuccess={handleLoginSuccess} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SecurityManager; 