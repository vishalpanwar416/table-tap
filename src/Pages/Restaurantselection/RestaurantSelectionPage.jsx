import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, Phone, Clock, RefreshCw, Store, ArrowRight, Navigation, Crosshair, ChevronDown, Edit3 } from 'lucide-react';
import { getActiveRestaurants, getClosestRestaurants } from './restaurantSelectionService';
import { useRestaurant } from './RestaurantContext';
import { getStoredRestaurantSelection, storeRestaurantSelection } from '../../utils/restaurantCheck';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.4, ease: "easeOut" }
};

const staggerItems = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const RestaurantSelectionPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredRestaurant, setHoveredRestaurant] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  
  // Location states
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [hasAttemptedLocation, setHasAttemptedLocation] = useState(false);
  
  // Add state for automatic location modal
  const [showAutoLocationModal, setShowAutoLocationModal] = useState(false);
  const [hasShownLocationPrompt, setHasShownLocationPrompt] = useState(false);
  
  // Add state for table selection
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [showTableSelection, setShowTableSelection] = useState(false);
  
  // Add state for popup modal
  const [showTablePopup, setShowTablePopup] = useState(false);
  
  const scrollRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { setRestaurantAndTable } = useRestaurant();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check for URL parameters and auto-redirect if restaurant and table are provided
  useEffect(() => {
    const checkUrlParameters = () => {
      const urlParams = new URLSearchParams(location.search);
      const urlRestaurantId = urlParams.get('restaurant');
      const urlTableNumber = urlParams.get('table');
      
      if (urlRestaurantId && urlTableNumber) {
        // Store the restaurant and table from URL
        storeRestaurantSelection(urlRestaurantId, urlTableNumber);
        
        // Set in context
        setRestaurantAndTable(urlRestaurantId, urlTableNumber);
        
        // Auto-redirect to home page
        navigate('/home');
        return;
      }
    };

    checkUrlParameters();
  }, [location.search, navigate, setRestaurantAndTable]);

  // Check for stored table number on component mount
  useEffect(() => {
    const storedSelection = getStoredRestaurantSelection();
    if (storedSelection?.tableNumber) {
      setTableNumber(storedSelection.tableNumber);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
    
    // Show location prompt after a short delay if no location
    const timer = setTimeout(() => {
      if (!userLocation && !hasAttemptedLocation) {
        setShowLocationPrompt(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Check location permission status
  const checkLocationPermission = async () => {
    if (!navigator.permissions) {
      setLocationPermission('not-supported');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state);
      
      permission.onchange = () => {
        setLocationPermission(permission.state);
      };
    } catch (error) {
      setLocationPermission('not-supported');
    }
  };

  // Get user location with proper error handling
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setLocationPermission('not-supported');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    setHasAttemptedLocation(true);
    setShowLocationPrompt(false);

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Update location state without triggering immediate refetch
        setUserLocation({ latitude, longitude });
        setLocationLoading(false);
        setLocationError(null);
        setLocationPermission('granted');
        
        // Get address from coordinates
        getAddressFromCoordinates(latitude, longitude);
      },
      (error) => {
        setLocationLoading(false);
        setHasAttemptedLocation(true);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location services.');
            setLocationPermission('denied');
            setShowLocationModal(true);
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.');
            break;
          default:
            setLocationError('An unknown error occurred while getting location.');
        }
      },
      options
    );
  };

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setUserLocation(prev => ({
          ...prev,
          address: data.display_name.split(',').slice(0, 3).join(',') // Get first 3 parts of address
        }));
      }
    } catch (error) {
      // Don't set error here as coordinates are still useful
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

  // Handle scroll detection for hiding table selection and zoom effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only trigger scroll state if there's significant movement
      if (Math.abs(currentScrollY - scrollY) > 10) { // Increased threshold from 5 to 10
        setIsScrolling(true);
        
        // Clear scroll state after a delay
        setTimeout(() => {
          setIsScrolling(false);
        }, 150); // Reduced delay from 200 to 150ms
      }
      
      setScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollY]);

  const getRestaurantScale = (restaurantId, index) => {
    // Base scale logic
    let baseScale = 1;
    
    if (selectedRestaurant?.id === restaurantId) {
      baseScale = 1.05; // Reduced from 1.15 to 1.05 - Subtle selection zoom
    } else if (selectedRestaurant && selectedRestaurant.id !== restaurantId) {
      baseScale = 0.95; // Increased from 0.85 to 0.95 - Less aggressive shrink
    } else if (hoveredRestaurant === restaurantId) {
      baseScale = 1.02; // Reduced from 1.12 to 1.02 - Subtle hover effect
    }
    
    // Add scroll-based zoom for top restaurant (only when no restaurant is selected)
    if (!selectedRestaurant && index === 0 && scrollY > 50) {
      const scrollProgress = Math.min((scrollY - 50) / 200, 1); // Normalize scroll progress
      baseScale += scrollProgress * 0.03; // Reduced zoom intensity from 0.08 to 0.03
    }
    
    return baseScale;
  };

  const fetchRestaurants = async (showRefreshAnimation = false) => {
    try {
      if (showRefreshAnimation) {
        setIsRefreshing(true);
      } else if (restaurants.length === 0) {
        setLoading(true);
      }
      setError(null);

      let data = [];
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        // Use geospatial filtering: only restaurants within 5km
        data = await getClosestRestaurants(userLocation.latitude, userLocation.longitude, 5000);
      } else {
        // Fallback: all active restaurants
        data = await getActiveRestaurants();
      }

      // Transform the data to match the component's expected format
      let transformedData = data.map(restaurant => {
        let distance = null;
        if (typeof restaurant.distance === 'number') {
          distance = restaurant.distance / 1000; // convert meters to km for display
        } else if (userLocation && restaurant.location) {
          try {
            const match = restaurant.location.match(/POINT\(([^)]+)\)/);
            if (match) {
              const [lng, lat] = match[1].split(' ');
              distance = calculateDistance(
                userLocation.latitude, 
                userLocation.longitude, 
                parseFloat(lat), 
                parseFloat(lng)
              );
            }
          } catch (error) {}
        }
        return {
          ...restaurant,
          distance,
        };
      });

      // Sort by distance if available
      if (userLocation) {
        transformedData.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      }

      setRestaurants(transformedData || []);
    } catch (err) {
      setError('Failed to load restaurants');
    } finally {
      setLoading(false);
      if (showRefreshAnimation) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  // When location changes, refresh without loading screen or clearing data
  useEffect(() => {
    if (userLocation) {
      fetchRestaurants(true); // show only refresh spinner, not loading screen
    }
    // eslint-disable-next-line
  }, [userLocation]);

  // Helper function to get default restaurant images based on cuisine type
  const getDefaultRestaurantImage = (cuisineType) => {
    const defaultImages = {
      'Italian': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
      'Japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
      'American': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
      'Indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
      'Seafood': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
      'Chinese': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      'Mexican': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
      'Thai': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop'
    };
    
    return defaultImages[cuisineType] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
  };

  const handleRestaurantClick = (restaurant) => {
    // If clicking on the already selected restaurant, deselect it
    if (selectedRestaurant?.id === restaurant.id) {
      setSelectedRestaurant(null);
      // Hide table selection when deselecting restaurant
      setShowTableSelection(false);
      // Don't reset table number if it's stored locally
      const storedSelection = getStoredRestaurantSelection();
      if (!storedSelection?.tableNumber) {
        setTableNumber('');
      }
    } else {
      // Select the new restaurant
      setSelectedRestaurant(restaurant);
      // Hide table selection when selecting a new restaurant
      setShowTableSelection(false);
      // Don't reset table number if it's stored locally
      const storedSelection = getStoredRestaurantSelection();
      if (!storedSelection?.tableNumber) {
        setTableNumber('');
      }
    }
  };

  const handleContinue = async () => {
    if (!selectedRestaurant) {
      alert('Please select a restaurant');
      return;
    }

    // Check if we have a table number (either from input or stored)
    const finalTableNumber = tableNumber.trim() || getStoredRestaurantSelection()?.tableNumber;
    
    if (!finalTableNumber) {
      alert('Please enter a table number');
      return;
    }

    setIsSelecting(true);

    try {
      // Set the restaurant and table in context (this will handle localStorage)
      setRestaurantAndTable(selectedRestaurant.id, finalTableNumber);
      
      // Show success message briefly
      setShowSuccessMessage(true);
      
      // Navigate to home page after a short delay
      setTimeout(() => {
        navigate('/home');
      }, 1000);
      
    } catch (err) {
      alert('Failed to select restaurant. Please try again.');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleRefresh = () => {
    fetchRestaurants(true); // Pass true to show refresh animation instead of loading screen
  };

  const handleLocationRequest = async () => {
    // First check current permission status
    await checkLocationPermission();
    
    if (locationPermission === 'denied') {
      setShowLocationModal(true);
      return;
    }
    
    // This will trigger the browser's permission popup
    getUserLocation();
  };

  const handleLocationPromptAllow = () => {
    setShowLocationPrompt(false);
    getUserLocation(); // This triggers the browser permission popup
  };

  const handleLocationPromptDeny = () => {
    setShowLocationPrompt(false);
    setHasAttemptedLocation(true);
  };

  const formatDistance = (distance) => {
    if (distance === null) return null;
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const handleAutoLocationAllow = () => {
    setShowAutoLocationModal(false);
    getUserLocation(); // This will trigger the browser's permission popup
  };

  const handleAutoLocationDeny = () => {
    setShowAutoLocationModal(false);
    setLocationPermission('denied');
  };

  // Get selected table details
  const getSelectedTableDetails = () => {
    return availableTables.find(table => table.tableNumber === tableNumber);
  };

  // Check if table number input should be shown
  const shouldShowTableInput = () => {
    const storedSelection = getStoredRestaurantSelection();
    return !storedSelection?.tableNumber || showTableSelection;
  };

  // Get the table number to display (from input or stored)
  const getDisplayTableNumber = () => {
    return tableNumber.trim() || getStoredRestaurantSelection()?.tableNumber || '';
  };

  // Check if table was auto-selected from QR code
  const isTableAutoSelected = () => {
    const storedSelection = getStoredRestaurantSelection();
    return storedSelection?.tableNumber === tableNumber && !showTableSelection;
  };

  // Handle table selection
  const handleTableSelect = (table) => {
    setTableNumber(table.tableNumber);
    setShowTableDropdown(false);
  };

  // Parse tables from selected restaurant - EXACTLY like OrderConfirmation
  useEffect(() => {
    if (selectedRestaurant?.tables) {
      try {
        const parsedTables = typeof selectedRestaurant.tables === 'string' 
          ? JSON.parse(selectedRestaurant.tables) 
          : selectedRestaurant.tables;
        setAvailableTables(Array.isArray(parsedTables) ? parsedTables : []);
      } catch (error) {
        setAvailableTables([]);
      }
    } else {
      setAvailableTables([]);
    }
  }, [selectedRestaurant]);

  // Auto-select table from stored selection - EXACTLY like OrderConfirmation
  useEffect(() => {
    const storedSelection = getStoredRestaurantSelection();
    if (storedSelection?.tableNumber && availableTables.length > 0) {
      // Check if the stored table number exists in available tables
      const matchingTable = availableTables.find(table => 
        table.tableNumber === storedSelection.tableNumber
      );
      
      if (matchingTable) {
        setTableNumber(storedSelection.tableNumber);
        setShowTableSelection(false); // Don't show table selection if auto-selected
      } else {
        setShowTableSelection(true); // Show table selection if stored table not found
      }
    } else if (availableTables.length > 0) {
      setShowTableSelection(true); // Show table selection if no stored table
    }
  }, [availableTables]);

  // Loading state: only show if no restaurants at all
  if (loading && restaurants.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-opacity-20"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-orange-500 absolute top-0 left-0"></div>
          </div>
          <p className="text-white mt-4 text-lg font-medium">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md shadow-lg">
          <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
          <h3 className="text-red-600 text-xl font-semibold mb-2 text-center">Error Loading Restaurants</h3>
          <p className="text-red-500 text-center mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-black">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        {/* Header */}
        <div className="w-full px-6 py-8 relative flex justify-center bg-black z-20 sticky top-0 md:static md:bg-transparent" style={{minHeight: 72}}>
          <button 
            className="absolute left-4 top-8 text-orange-500 touch-manipulation"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{minWidth: 44, minHeight: 44}}
          >
            <ChevronLeft size={30} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-gray-100 text-3xl font-medium">
              {userLocation ? 'Restaurants Near You' : 'Select Restaurant'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {userLocation ? 'Showing restaurants sorted by distance' : 'Choose a restaurant to view the menu'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          className="flex-1 flex flex-col"
        >
          <div className="flex-1 flex flex-col bg-gray-200 rounded-t-3xl overflow-hidden min-h-[500px] px-6 pt-10 pb-6">
            
            {/* Prominent Location Prompt - Show when no location and no error */}
            {!userLocation && !locationError && !locationLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                      <MapPin size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-semibold text-gray-900 mb-0.5">
                        Find Restaurants Near You
                      </h3>
                      <p className="text-xs text-gray-600">
                        Enable location to see nearby restaurants
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={getUserLocation}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
                  >
                    Enable
                  </button>
                </div>
              </motion.div>
            )}

            {/* Location Bar */}
            <div className="mb-6 bg-white rounded-xl py-3 px-4 shadow-sm">
              <div className="flex items-start gap-3">
                {/* Location Icon */}
                <MapPin size={20} className="text-gray-600 mt-0.5 flex-shrink-0" />
                
                {/* Location Content */}
                <div className="flex-1 min-w-0">
                  {userLocation ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {userLocation.address || 'Current Location'}
                        </span>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                          ✓ Active
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 block">
                        Location detected
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-700 block">
                        {locationError ? 'Location unavailable' : 'Enable location for nearby restaurants'}
                      </span>
                      {locationError && (
                        <span className="text-xs text-red-500 block">
                          {locationError}
                        </span>
                      )}
                      {!locationError && !userLocation && (
                        <span className="text-xs text-orange-600 block">
                          Tap the location button to enable
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Location Button */}
                <button 
                  onClick={handleLocationRequest}
                  disabled={locationLoading}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors touch-manipulation flex-shrink-0 ${
                    userLocation 
                      ? 'bg-orange-100 hover:bg-orange-200' 
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                  aria-label="Get location"
                >
                  {locationLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div>
                  ) : (
                    <Crosshair size={18} className={userLocation ? 'text-orange-600' : 'text-white'} />
                  )}
                </button>
              </div>
            </div>

            {/* Restaurants List - Optimized for Touch Scrolling */}
            <div 
              className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm"
              style={{ 
                maxHeight: selectedRestaurant ? 'calc(100vh - 500px)' : 'calc(100vh - 200px)',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div 
                ref={scrollRef}
                className="h-full overflow-y-auto overscroll-contain p-2 md:p-4 space-y-4"
                style={{
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y'
                }}
              >
                {restaurants.length === 0 ? (
                  <motion.div {...slideUp} className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-50 flex items-center justify-center shadow-sm mb-4">
                      <Store size={32} className="text-gray-400" />
                    </div>
                    <h2 className="text-lg md:text-xl font-semibold text-center text-gray-800 mb-2">
                      No Restaurants Available
                    </h2>
                    <p className="text-gray-500 text-center text-sm max-w-xs mb-4">
                      There are currently no active restaurants in the system.
                    </p>
                    <button
                      onClick={handleRefresh}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors font-medium touch-manipulation"
                    >
                      Refresh
                    </button>
                  </motion.div>
                ) : (
                  <motion.div variants={staggerItems}>
                    {isRefreshing && (
                      <div className="flex items-center justify-center py-2 mb-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent mr-2"></div>
                        <span className="text-orange-500 text-sm">Refreshing...</span>
                      </div>
                    )}
                    
                    {restaurants.map((restaurant, index) => (
                      <motion.div
                        key={restaurant.id}
                        variants={slideUp}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          scale: getRestaurantScale(restaurant.id, index)
                        }}
                        transition={{ 
                          duration: 0.3, 
                          ease: "easeOut",
                          scale: { duration: 0.25, ease: "easeInOut" }
                        }}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.03 }}
                        onMouseEnter={() => setHoveredRestaurant(restaurant.id)}
                        onMouseLeave={() => setHoveredRestaurant(null)}
                        onClick={() => handleRestaurantClick(restaurant)}
                        className={`bg-white rounded-2xl border-2 cursor-pointer transition-all shadow-sm hover:shadow-md touch-manipulation relative mb-4 flex items-center px-2 py-3 md:px-4 md:py-4 ${
                          selectedRestaurant?.id === restaurant.id
                            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{
                          minHeight: 88,
                          minWidth: 0,
                          touchAction: 'manipulation',
                          WebkitUserSelect: 'none',
                          userSelect: 'none',
                          transformOrigin: 'center',
                          zIndex: selectedRestaurant?.id === restaurant.id ? 20 : 
                                  hoveredRestaurant === restaurant.id ? 15 : 
                                  index === 0 ? 10 : 1
                        }}
                        tabIndex={0}
                        aria-label={`Select ${restaurant.name}`}
                        role="button"
                      >
                        {/* Restaurant Image */}
                        <div className="relative mr-3 flex-shrink-0">
                          {restaurant.restaurant_photo_url && restaurant.restaurant_photo_url.trim() !== '' ? (
                            <img
                              src={restaurant.restaurant_photo_url}
                              alt={restaurant.name}
                              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg"
                              loading={index > 2 ? 'lazy' : 'eager'}
                              style={{
                                WebkitUserDrag: 'none',
                                userDrag: 'none',
                                minWidth: 64, minHeight: 64
                              }}
                              onError={e => { e.target.onerror = null; e.target.src = ''; }}
                            />
                          ) : restaurant.logo_url && restaurant.logo_url.trim() !== '' ? (
                            <img
                              src={restaurant.logo_url}
                              alt={restaurant.name + ' logo'}
                              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg"
                              loading={index > 2 ? 'lazy' : 'eager'}
                              style={{
                                WebkitUserDrag: 'none',
                                userDrag: 'none',
                                minWidth: 64, minHeight: 64
                              }}
                              onError={e => { e.target.onerror = null; e.target.src = ''; }}
                            />
                          ) : getDefaultRestaurantImage(restaurant.cuisine_type) ? (
                            <img
                              src={getDefaultRestaurantImage(restaurant.cuisine_type)}
                              alt={restaurant.cuisine_type ? `${restaurant.cuisine_type} cuisine` : 'Restaurant'}
                              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg"
                              loading={index > 2 ? 'lazy' : 'eager'}
                              style={{
                                WebkitUserDrag: 'none',
                                userDrag: 'none',
                                minWidth: 64, minHeight: 64
                              }}
                              onError={e => { e.target.onerror = null; e.target.src = ''; }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-3xl select-none" role="img" aria-label="Restaurant">
                              🍽️
                            </div>
                          )}
                          {/* Selection Badge */}
                          {selectedRestaurant?.id === restaurant.id && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-lg"
                            >
                              ✓
                            </motion.div>
                          )}
                          {/* Cuisine Type Badge */}
                          {restaurant.cuisine_type && (
                            <div className="absolute -top-1 -left-1 bg-black bg-opacity-70 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                              {restaurant.cuisine_type}
                            </div>
                          )}
                        </div>
                        {/* Restaurant Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-base text-gray-900 truncate">{restaurant.name}</span>
                            {restaurant.distance !== null && (
                              <span className="ml-2 text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-medium">
                                {formatDistance(restaurant.distance)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 truncate mb-1">{restaurant.description}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin size={14} className="inline-block mr-1" />
                            <span className="truncate">{restaurant.address}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Add bottom padding for better scrolling experience */}
                    <div className="h-4"></div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Table Selection Section - Now positioned inside the main content */}
            <AnimatePresence mode="wait">
              {selectedRestaurant && (
                <motion.div
                  initial={{ opacity: 0, y: 100, scale: 0.95 }}
                  animate={{ 
                    opacity: isScrolling ? 0 : 1, 
                    y: isScrolling ? 20 : 0,
                    scale: isScrolling ? 0.95 : 1
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 100, 
                    scale: 0.95,
                    transition: { 
                      duration: 0.3, 
                      ease: "easeIn" 
                    }
                  }}
                  transition={{ 
                    duration: 0.4, 
                    ease: "easeOut",
                    scale: { duration: 0.3, ease: "easeInOut" }
                  }}
                  className="mt-4 bg-white rounded-xl shadow-lg border-t-4 border-orange-500 overflow-hidden"
                  style={{
                    // Ensure it stays above content
                    zIndex: 30,
                    // Smooth transition for visibility
                    pointerEvents: isScrolling ? 'none' : 'auto',
                    // Add transform origin for better animation
                    transformOrigin: 'bottom center'
                  }}
                >
                  <motion.div 
                    className="p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ 
                      opacity: 0, 
                      y: 20,
                      transition: { duration: 0.2, delay: 0.1 }
                    }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <div className="flex items-center mb-6">
                      <Store size={24} className="text-orange-500 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedRestaurant.name}
                      </h3>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Show auto-selected table with change option */}
                      {isTableAutoSelected() && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ 
                            opacity: 0, 
                            x: -20,
                            transition: { duration: 0.2, delay: 0.05 }
                          }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                          className="bg-gradient-to-r from-green-100 to-green-50 border border-green-200 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-green-800">
                                  Table {getDisplayTableNumber()}
                                </p>
                                <p className="text-xs text-green-700">
                                  Auto-selected from your QR code
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowTableSelection(true)}
                              className="flex items-center gap-1 text-green-700 hover:text-green-800 text-sm font-medium transition-colors"
                            >
                              <Edit3 size={14} />
                              Change
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Show table dropdown when needed */}
                      {showTableSelection && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ 
                            opacity: 0, 
                            x: -20,
                            transition: { duration: 0.2, delay: 0.05 }
                          }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Table Number
                          </label>
                          
                          {/* Table Selection Button */}
                          <button
                            onClick={() => setShowTablePopup(true)}
                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-left hover:border-orange-300 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700">
                                {tableNumber ? `Table ${tableNumber}` : 'Select a table'}
                              </span>
                              <ChevronDown size={20} className="text-gray-400" />
                            </div>
                          </button>
                          
                          {/* Show selected table details */}
                          {tableNumber && getSelectedTableDetails() && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="text-sm text-blue-800">
                                <div className="font-medium">Table {tableNumber}</div>
                                {getSelectedTableDetails().location && (
                                  <div>Location: {getSelectedTableDetails().location}</div>
                                )}
                                <div>Capacity: {getSelectedTableDetails().capacity} people</div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ 
                          opacity: 0, 
                          y: 20,
                          transition: { duration: 0.2 }
                        }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        onClick={handleContinue}
                        disabled={isSelecting || (!tableNumber.trim())}
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-5 px-6 rounded-xl transition-colors shadow-sm touch-manipulation"
                        style={{
                          minHeight: '56px'
                        }}
                      >
                        {isSelecting ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Setting up...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Continue to Menu
                            <ArrowRight size={18} />
                          </span>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Success Message Modal */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Restaurant Selected!
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Redirecting to {selectedRestaurant?.name}...
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Location Permission Modal (for when permission is denied) */}
        <AnimatePresence>
          {showLocationModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowLocationModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin size={32} className="text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Location Access Required
                  </h3>
                  <p className="text-gray-600 text-sm mb-6">
                    To show you nearby restaurants, we need access to your location. Please enable location services in your browser settings.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setShowLocationModal(false);
                        // Try to get location again
                        getUserLocation();
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => setShowLocationModal(false)}
                      className="w-full text-gray-500 hover:text-gray-700 px-4 py-2 text-sm transition-colors"
                    >
                      Continue without location
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table Selection Popup Modal */}
        <AnimatePresence>
          {showTablePopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center p-0 md:p-4 z-50"
              onClick={() => setShowTablePopup(false)}
              style={{ zIndex: 100 }}
            >
              <motion.div
                initial={{ y: 40, scale: 1, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 40, scale: 1, opacity: 0 }}
                className="bg-white rounded-t-2xl md:rounded-xl p-4 md:p-6 w-full max-w-md mx-auto shadow-xl"
                onClick={(e) => e.stopPropagation()}
                style={{ minHeight: 200, maxHeight: '80vh', overflowY: 'auto' }}
                role="dialog"
                aria-modal="true"
                aria-label="Select Table Number"
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Select Table Number
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Choose your table from the available options
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {availableTables.length > 0 ? (
                    availableTables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => {
                          setTableNumber(table.tableNumber);
                          setShowTablePopup(false);
                        }}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left text-base font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                          table.tableNumber === tableNumber
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                        style={{ minHeight: 48 }}
                        aria-label={`Select table ${table.tableNumber}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">
                              Table {table.tableNumber}
                            </div>
                            {table.location && (
                              <div className="text-sm text-gray-600">
                                {table.location}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              Capacity: {table.capacity} people
                            </div>
                          </div>
                          {table.tableNumber === tableNumber && (
                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Store size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No tables available</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowTablePopup(false)}
                    className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ minHeight: 44 }}
                    aria-label="Cancel table selection"
                  >
                    Cancel
                  </button>
                  {tableNumber && (
                    <button
                      onClick={() => setShowTablePopup(false)}
                      className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      style={{ minHeight: 44 }}
                      aria-label="Confirm table selection"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RestaurantSelectionPage;