/**
 * Mobile-specific location utilities
 */

// Check if device is mobile
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if device supports geolocation
export const supportsGeolocation = () => {
  return 'geolocation' in navigator;
};

// Get location with mobile optimizations
export const getMobileLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!supportsGeolocation()) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 20000, // 20 seconds for mobile
      maximumAge: 300000, // 5 minutes
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = isMobileDevice() 
              ? 'Location access denied. Please enable location services in your device settings.'
              : 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your device location settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
        }
        reject(new Error(errorMessage));
      },
      defaultOptions
    );
  });
};

// Check location permission with mobile detection
export const checkMobileLocationPermission = async () => {
  if (!navigator.permissions) {
    return 'not-supported';
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state;
  } catch (error) {
    console.error('Error checking location permission:', error);
    return 'not-supported';
  }
};

// Get mobile-specific location instructions
export const getMobileLocationInstructions = () => {
  const userAgent = navigator.userAgent;
  
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return {
      title: 'Enable Location on iOS',
      steps: [
        'Open Settings app',
        'Tap Privacy & Security',
        'Tap Location Services',
        'Find this app and set to "While Using"',
        'Return to the app and try again'
      ]
    };
  } else if (/Android/i.test(userAgent)) {
    return {
      title: 'Enable Location on Android',
      steps: [
        'Open Settings app',
        'Tap Privacy or Security',
        'Tap Location',
        'Turn on Location',
        'Find this app and allow location access',
        'Return to the app and try again'
      ]
    };
  } else {
    return {
      title: 'Enable Location Services',
      steps: [
        'Check your browser settings',
        'Allow location access for this site',
        'Refresh the page and try again'
      ]
    };
  }
}; 