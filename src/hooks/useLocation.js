import { useState, useEffect, useCallback } from 'react';
import { getUserLocation, getAddressFromCoordinates, checkLocationPermission } from '../utils/location';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt');

  // Check permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const permissionStatus = await checkLocationPermission();
      setPermission(permissionStatus);
    };
    checkPermission();
  }, []);

  // Get location function
  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const coords = await getUserLocation();
      const address = await getAddressFromCoordinates(coords.latitude, coords.longitude);
      
      const locationData = {
        ...coords,
        address
      };
      
      setLocation(locationData);
      setError(null);
    } catch (err) {
      setError(err.message);
      
      // Update permission status if denied
      if (err.message.includes('denied')) {
        setPermission('denied');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear location
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    loading,
    error,
    permission,
    getLocation,
    clearLocation
  };
}; 