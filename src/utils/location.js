/**
 * Location utility functions
 */

/**
 * Enhanced location utility functions for mobile compatibility
 */

/**
 * Get user's current location with mobile-optimized settings
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    // Mobile-optimized options
    const options = {
      enableHighAccuracy: true, // Better accuracy on mobile
      timeout: 20000, // Longer timeout for mobile devices
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({ 
          latitude, 
          longitude, 
          accuracy,
          timestamp: position.timestamp 
        });
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
        }
        reject(new Error(errorMessage));
      },
      options
    );
  });
};

/**
 * Check if geolocation is supported and available
 */
export const isGeolocationSupported = () => {
  return 'geolocation' in navigator;
};

/**
 * Check location permission status
 */
export const checkLocationPermission = async () => {
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

/**
 * Request location with user interaction
 */
export const requestLocationWithUserInteraction = (onSuccess, onError) => {
  if (!isGeolocationSupported()) {
    onError(new Error('Geolocation is not supported by this browser'));
    return;
  }

  getUserLocation()
    .then(onSuccess)
    .catch(onError);
};

/**
 * Get address from coordinates using reverse geocoding
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    
    if (data.display_name) {
      return data.display_name.split(',').slice(0, 3).join(',');
    }
    return null;
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return null;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

/**
 * Format distance for display
 */
export const formatDistance = (distance) => {
  if (distance === null || distance === undefined) return null;
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

/**
 * Get location with address
 */
export const getLocationWithAddress = async () => {
  try {
    const location = await getUserLocation();
    const address = await getAddressFromCoordinates(location.latitude, location.longitude);
    
    return {
      ...location,
      address
    };
  } catch (error) {
    throw error;
  }
}; 