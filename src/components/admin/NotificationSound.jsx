import React, { useEffect, useRef } from 'react';

const NotificationSound = ({ play, soundType = 'order' }) => {
  const audioRef = useRef(null);

  // Different sound frequencies for different notification types
  const soundConfigs = {
    order: {
      frequency: 800,
      duration: 0.3,
      pattern: [0.15, 0.1, 0.15], // Three beeps with gaps
      volume: 0.4
    },
    success: {
      frequency: 600,
      duration: 0.2,
      pattern: [0.2],
      volume: 0.3
    },
    error: {
      frequency: 400,
      duration: 0.4,
      pattern: [0.4],
      volume: 0.3
    },
    urgent: {
      frequency: 1000,
      duration: 0.2,
      pattern: [0.1, 0.05, 0.1, 0.05, 0.1],
      volume: 0.5
    }
  };

  const playNotificationSound = async () => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const config = soundConfigs[soundType] || soundConfigs.order;
      
      for (let i = 0; i < config.pattern.length; i++) {
        const duration = config.pattern[i];
        
        // Create oscillator for beep sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configure sound
        oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Configure volume envelope (fade in/out for smoother sound)
        const startTime = audioContext.currentTime + (i * (duration + 0.1));
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(config.volume, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(config.volume, startTime + duration - 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        // Play sound
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      }
      
      // Clean up audio context after all sounds
      setTimeout(() => {
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      }, 3000);
      
    } catch (error) {
      console.warn('Could not play notification sound:', error);
      // Enhanced fallback with multiple attempts
      try {
        // Try HTML5 audio with base64 encoded beep
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmsgDEWd2PCveR4JFHjH');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Final fallback - system beep (may not work in all browsers)
          console.log('\u0007'); // Bell character
        });
      } catch (fallbackError) {
        console.warn('All sound fallbacks failed:', fallbackError);
      }
    }
  };

  useEffect(() => {
    if (play) {
      playNotificationSound();
    }
  }, [play, soundType]);

  return null; // This component doesn't render anything visible
};

export default NotificationSound;