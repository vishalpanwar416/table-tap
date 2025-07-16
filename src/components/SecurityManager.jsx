import React, { useEffect, useRef } from 'react';
import { useAuth } from '../config/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sessionManager, rateLimiter } from '../utils/security';

const SecurityManager = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
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
    if (user && !sessionManager.isSessionValid()) {
      // Add a debounce or grace period here if needed
      setTimeout(() => {
        // Double-check session before navigating
        if (!sessionManager.isSessionValid()) {
          navigate('/login?message=session_expired');
        }
      }, 2000); // 2-second grace period
    }
  };

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Check session every minute
    sessionTimeoutRef.current = setInterval(checkSession, 60000);

    // Update activity every 5 minutes
    activityTimeoutRef.current = setInterval(() => {
      if (user) {
        sessionManager.updateActivity();
      }
    }, 300000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      
      if (sessionTimeoutRef.current) {
        clearInterval(sessionTimeoutRef.current);
      }
      
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }
    };
  }, [user, navigate]);

  // Clear intervals when user logs out
  useEffect(() => {
    if (!user && !loading) {
      if (sessionTimeoutRef.current) {
        clearInterval(sessionTimeoutRef.current);
      }
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }
    }
  }, [user, loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionTimeoutRef.current) {
        clearInterval(sessionTimeoutRef.current);
      }
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default SecurityManager; 