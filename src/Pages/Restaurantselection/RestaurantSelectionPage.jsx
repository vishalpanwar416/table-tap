import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, Phone, Clock, RefreshCw, Store, ArrowRight, Navigation, Crosshair, ChevronDown, Edit3, Search, X } from 'lucide-react';
import { getActiveRestaurants, getClosestRestaurants, getAllRestaurants, searchRestaurants } from './restaurantSelectionService';
import { useRestaurant } from './RestaurantContext';
import { getStoredRestaurantSelection, storeRestaurantSelection } from '../../utils/restaurantCheck';
import { FixedSizeList as List } from 'react-window';

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
  
  // Add state for nearest restaurant popup
  const [showNearestRestaurantPopup, setShowNearestRestaurantPopup] = useState(false);
  const [nearestRestaurant, setNearestRestaurant] = useState(null);
  
  // Add state for toggling between nearby and all restaurants
  const [showAllRestaurants, setShowAllRestaurants] = useState(false);
  
  // Add state for nearby toggle animation
  const [hasShownNearbyToggle, setHasShownNearbyToggle] = useState(false);

  // Add these states at the top with other useState hooks
  const [cachedNearby, setCachedNearby] = useState(null);
  const [cachedAll, setCachedAll] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add state for search results and loading
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (!showSearch) setSearchQuery('');
  };

  const searchTimeout = useRef();

  useEffect(() => {
    if (!showSearch) return;
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchRestaurants(searchQuery.trim());
        setSearchResults(results);
      } catch (err) {
        setSearchError('Failed to search restaurants.');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, showSearch]);

  // Update handleSearchSubmit to just trigger the effect
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    // No-op: search is now live
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchError(null);
  };
  
  const scrollRef = useRef(null);
  const scrollYRef = useRef(0); // Add this near your other refs
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

  // Helper function for parsing tables (extracted from useEffect)
  const parseTables = (tables) => {
    try {
      const parsed = typeof tables === 'string' ? JSON.parse(tables) : tables;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Consolidated useEffect for fetching restaurants
  useEffect(() => {
    fetchRestaurants(false);
    // Only run when userLocation or showAllRestaurants changes
    // This replaces the previous multiple useEffects for these dependencies
  }, [userLocation, showAllRestaurants]);

  // Throttled scroll handler with ref and stable effect
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (Math.abs(currentScrollY - scrollYRef.current) > 10) {
            setIsScrolling(true);
            setTimeout(() => setIsScrolling(false), 150);
          }
          scrollYRef.current = currentScrollY;
          setScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // <-- Empty dependency array

  // After fetching restaurants with location:
  useEffect(() => {
    if (userLocation && restaurants.length > 0) {
      // Find the closest restaurant within 100 meters (0.1 km)
      const closest = restaurants.find(r => r.distance !== null && r.distance < 0.1);
      if (closest && !selectedRestaurant && !showNearestRestaurantPopup) {
        setNearestRestaurant(closest);
        setShowNearestRestaurantPopup(true);
      }
    }
  }, [userLocation, restaurants, selectedRestaurant, showNearestRestaurantPopup]);

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
      setLocationLoading(false); // <-- Ensure loading is reset
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

  // Update fetchRestaurants to use and update cache
  const fetchRestaurants = async (showRefreshAnimation = false, force = false) => {
    try {
      if (showRefreshAnimation) {
        setIsRefreshing(true);
      } else if (restaurants.length === 0) {
        setLoading(true);
      }
      setError(null);

      let data = [];
      if (showAllRestaurants) {
        // Use cache if available and not forcing
        if (cachedAll && !force) {
          setRestaurants(cachedAll);
          setLoading(false);
          if (showRefreshAnimation) setTimeout(() => setIsRefreshing(false), 500);
          return;
        }
        data = await getAllRestaurants();
        if (userLocation) {
          data = data.map(restaurant => {
        let distance = null;
            if (restaurant.location) {
            const match = restaurant.location.match(/POINT\(([^)]+)\)/);
            if (match) {
              const [lng, lat] = match[1].split(' ');
              distance = calculateDistance(
                userLocation.latitude, 
                userLocation.longitude, 
                  parseFloat(lat), // restaurant latitude
                  parseFloat(lng)  // restaurant longitude
              );
            }
        }
            return { ...restaurant, distance };
      });
          data.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
        }
        setCachedAll(data);
      } else if (userLocation && userLocation.latitude && userLocation.longitude) {
        // Use cache if available and not forcing
        if (cachedNearby && !force) {
          setRestaurants(cachedNearby);
          setLoading(false);
          if (showRefreshAnimation) setTimeout(() => setIsRefreshing(false), 500);
          return;
        }
        data = await getClosestRestaurants(userLocation.latitude, userLocation.longitude, 5000);
        data = data.map(restaurant => ({
          ...restaurant,
          distance: typeof restaurant.distance === 'number' ? restaurant.distance / 1000 : null
        }));
        setCachedNearby(data);
      } else {
        data = await getActiveRestaurants();
      }

      setRestaurants(data || []);
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
      fetchRestaurants(true, true); // force refresh
    }
  }, [userLocation]);

  // When toggling, call fetchRestaurants only if not cached
  useEffect(() => {
    fetchRestaurants(false);
  }, [showAllRestaurants]);

  // Invalidate cache if userLocation changes
  useEffect(() => {
    setCachedNearby(null);
    setCachedAll(null);
    if (userLocation) {
      fetchRestaurants(true, true); // force refresh
    }
  }, [userLocation]);

  // Add useEffect to track when userLocation becomes available
  useEffect(() => {
    if (userLocation && !hasShownNearbyToggle) {
      setHasShownNearbyToggle(true);
    }
  }, [userLocation, hasShownNearbyToggle]);

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
    if (typeof distance !== 'number' || isNaN(distance)) return null;
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
      setAvailableTables(parseTables(selectedRestaurant.tables));
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
        <div className="w-full px-4 py-8 relative flex justify-center bg-black z-20 sticky top-0 md:static md:bg-transparent" style={{minHeight: 72}}>
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
          <div className="flex-1 flex flex-col bg-gray-200 rounded-t-3xl overflow-hidden min-h-[500px] px-4 pt-10 pb-6">
            
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
            <div className="mb-6 bg-white rounded-xl py-3 px-3 shadow-sm">
              {showSearch ? (
                <motion.div
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 40, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100 px-3 py-2"
                  style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)' }}
                >
                  <div className="flex-1 relative overflow-hidden">
                    <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <motion.input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for restaurants, cuisines, or locations..."
                      initial={{ width: 0, opacity: 0, scale: 0.95 }}
                      animate={{ width: '100%', opacity: 1, scale: 1 }}
                      exit={{ width: 0, opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="w-full pl-12 pr-4 py-3 rounded-full border-none focus:outline-none text-base bg-white/80 text-gray-800 placeholder-gray-400 shadow-inner transition-colors"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                      style={{ minWidth: 0 }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-600 hover:bg-gray-700 text-white shadow transition-all duration-200 hover:scale-105 focus:outline-none"
                    style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
                  >
                    <Search size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSearchToggle}
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 shadow transition-all duration-200 hover:scale-105 focus:outline-none"
                    style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)' }}
                  >
                    <X size={20} />
                  </button>
                </motion.div>
              ) : (
                <div className="flex flex-row items-center gap-x-3 flex-wrap animate-in fade-in-0 slide-in-from-left-2 duration-300">
                  {/* Location Icon and Content */}
                  <div className="flex flex-row items-center gap-x-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <MapPin size={20} className="text-gray-600 mt-0.5" />
                      <span className={`absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white ${userLocation ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </div>
                <div className="flex-1 min-w-0">
                  {userLocation ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {userLocation.address || 'Current Location'}
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
                  </div>
                  {/* Controls - Location Button, Toggle, and Search */}
                  <div className="flex gap-2 items-center">
                {/* Location Button */}
                <button 
                  onClick={handleLocationRequest}
                  disabled={locationLoading}
                      className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-colors touch-manipulation flex-shrink-0 ${
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
                    {/* Pill Toggle */}
                    {userLocation && (
                      <div className="pill-toggle flex gap-2">
                        <button
                          onClick={() => setShowAllRestaurants(false)}
                          className={`pill-option px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                            !showAllRestaurants 
                              ? 'bg-gray-600 text-white border-gray-600' 
                              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                          } border`}
                        >
                          Nearby
                        </button>
                        <button
                          onClick={() => setShowAllRestaurants(true)}
                          className={`pill-option px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                            showAllRestaurants 
                              ? 'bg-gray-600 text-white border-gray-600' 
                              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                          } border`}
                        >
                          All
                </button>
              </div>
                    )}
                    {/* Search Button */}
                    <button
                      onClick={handleSearchToggle}
                      className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all duration-300 touch-manipulation flex-shrink-0 transform hover:scale-105 ${
                        showSearch 
                          ? 'bg-orange-500 text-white hover:bg-orange-600' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      aria-label="Search"
                    >
                      <Search size={18} className={`transition-transform duration-300 ${showSearch ? 'rotate-90' : 'rotate-0'}`} />
                    </button>
            </div>
                </div>
              )}
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
                className="h-full overflow-y-auto overscroll-contain p-2 md:p-4"
                style={{
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  height: '100%'
                }}
              >
                {restaurants.length === 0 ? (
                  <motion.div {...slideUp} className="flex flex-col items-center justify-center py-12 px-3">
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
                  <List
                    height={selectedRestaurant ? 320 : 520}
                    itemCount={(showSearch && searchResults) ? searchResults.length : restaurants.length}
                    itemSize={108} // Height of each card (px)
                    width={"100%"}
                    style={{overflowX: 'hidden'}}
                  >
                    {({ index, style }) => {
                      const dataList = (showSearch && searchResults) ? searchResults : restaurants;
                      const restaurant = dataList[index];
                      if (!restaurant) return null;
                      return (
                        <motion.div
                          key={restaurant.id}
                          style={{
                            ...style,
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
                          whileTap={{ scale: 0.97 }}
                          whileHover={{ scale: 1.03 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.25 }}
                          onMouseEnter={() => setHoveredRestaurant(restaurant.id)}
                          onMouseLeave={() => setHoveredRestaurant(null)}
                          onClick={() => handleRestaurantClick(restaurant)}
                          className={`bg-white rounded-2xl border-2 cursor-pointer transition-all shadow-sm hover:shadow-md touch-manipulation relative mb-4 flex items-center px-2 py-3 md:px-4 md:py-4 ${
                            selectedRestaurant?.id === restaurant.id
                              ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
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
                                  <span className="ml-2 text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-medium min-w-[36px] text-center">
                                    {userLocation
                                      ? (formatDistance(restaurant.distance) || '—')
                                      : null}
                                </span>
                            </div>
                            <div className="text-xs text-gray-600 truncate mb-1">{restaurant.description}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <MapPin size={14} className="inline-block mr-1" />
                              <span className="truncate">{restaurant.address}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }}
                  </List>
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

        {/* Nearest Restaurant Popup */}
        {showNearestRestaurantPopup && nearestRestaurant && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            style={{ backdropFilter: 'blur(2px)' }}
          >
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full border border-orange-200 relative">
              <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">Are you at <span className="text-orange-500">{nearestRestaurant.name}</span>?</h2>
              <p className="mb-4 text-sm text-gray-600 text-center">{nearestRestaurant.address}</p>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-semibold shadow-md transition-colors"
                  onClick={() => {
                    setSelectedRestaurant(nearestRestaurant);
                    setShowNearestRestaurantPopup(false);
                  }}
                >
                  Continue
                </button>
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-semibold shadow-md transition-colors"
                  onClick={() => setShowNearestRestaurantPopup(false)}
                >
                  Select Other
                </button>
              </div>
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowNearestRestaurantPopup(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RestaurantSelectionPage;