import React, { useEffect, useRef } from 'react';
import { useAdminNotifications } from '../context/AdminNotificationContext';

const NotificationSound = () => {
  const { lastNotificationTime, unreadCount } = useAdminNotifications();
  const audioRef = useRef(null);
  
  // Play notification sound when we receive a new notification
  useEffect(() => {
    if (lastNotificationTime && audioRef.current) {
      const playSound = async () => {
        try {
          // Reset audio to beginning
          audioRef.current.currentTime = 0;
          
          // Play sound
          await audioRef.current.play();
        } catch (error) {
          console.error("Error playing notification sound:", error);
          
          // This error often happens due to browser autoplay policies
          // We could implement a "muted" state and inform the user that
          // sounds are muted until they interact with the page
        }
      };
      
      playSound();
    }
  }, [lastNotificationTime]);

  return (
    <audio 
      ref={audioRef} 
      src="/sounds/notification.mp3" 
      preload="auto"
      style={{ display: 'none' }}
    />
  );
};

export default NotificationSound;