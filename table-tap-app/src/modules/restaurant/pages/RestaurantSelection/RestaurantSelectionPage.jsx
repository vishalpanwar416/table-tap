import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronLeft, MapPin, Store, ArrowRight, Search, X, QrCode } from 'lucide-react';
import {
  getActiveRestaurants,
  getClosestRestaurants,
  getAllRestaurants,
} from './restaurantSelectionService';
import { useRestaurant } from './RestaurantContext';
import { useAuth } from '../../../shared/config/AuthContext';
import { supabase } from '../../../shared/supabase';
import {
  getStoredRestaurantSelection,
  storeRestaurantSelection,
} from '../../../shared/utils/restaurantCheck';
import { parseTableTapQrPayload } from '../../../shared/utils/parseTableTapQr';
import QRScanModal from './QRScanModal';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

// Location cache: avoid asking for location on every refresh (TTL 30 min)
const LOCATION_CACHE_KEY = 'tt_restaurant_location_cache';
const LOCATION_CACHE_TTL_MS = 30 * 60 * 1000;

const getCachedLocation = () => {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number')
      return null;
    if (Date.now() - (data.timestamp || 0) > LOCATION_CACHE_TTL_MS) return null;
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || undefined,
    };
  } catch {
    return null;
  }
};

const setCachedLocation = (loc) => {
  if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') return;
  try {
    localStorage.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify({
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: loc.address,
        timestamp: Date.now(),
      }),
    );
  } catch {}
};

const staggerItems = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
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
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Owner specific states
  const { user, loading: authLoading } = useAuth();
  const [isOwner, setIsOwner] = useState(false);

  const [userRole, setUserRole] = useState(null);
  const [showMyRestaurants, setShowMyRestaurants] = useState(false);
  const [ownedRestaurants, setOwnedRestaurants] = useState([]);

  // Add state for search results and loading
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleSearchToggle = () => {
    const opening = !showSearch;
    setShowSearch(opening);
    setSearchQuery('');
    if (!opening) {
      // closing — clear results so list returns to normal
      setSearchResults(null);
      setSearchError(null);
    }
  };

  // Search filters the already-loaded restaurants list — instant, no API call needed
  useEffect(() => {
    if (!showSearch) return;
    const term = searchQuery.trim().toLowerCase();
    if (!term) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }
    const filtered = restaurants.filter(
      (r) =>
        r.name?.toLowerCase().includes(term) ||
        r.cuisine_type?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.address?.toLowerCase().includes(term),
    );
    setSearchResults(filtered);
    setSearchError(null);
  }, [searchQuery, showSearch, restaurants]);

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

  const applyTableTapSelection = (restaurantId, tableNumber) => {
    storeRestaurantSelection(restaurantId, tableNumber);
    setRestaurantAndTable(restaurantId, tableNumber);
    navigate('/home');
  };

  const handleQrScanSuccess = (decodedText) => {
    const parsed = parseTableTapQrPayload(decodedText);
    if (!parsed) {
      toast.error('Invalid Table-Tap QR. Scan the code on your table.');
      return false;
    }
    setShowQrScanner(false);
    toast.success(`Table ${parsed.tableNumber} — opening menu`);
    applyTableTapSelection(parsed.restaurantId, parsed.tableNumber);
    return true;
  };

  const scrollRef = useRef(null);
  const scrollYRef = useRef(0); // Add this near your other refs
  const scrollTimeoutRef = useRef(null);
  const locationToastShownRef = useRef(false);
  const abortControllerRef = useRef(null);
  const floatingCardTouchStartY = useRef(0);

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
        applyTableTapSelection(urlRestaurantId, urlTableNumber);
        return;
      }
    };

    checkUrlParameters();
  }, [location.search, navigate, setRestaurantAndTable]);

  // Check for stored selection and load cached restaurants for instant UI
  useEffect(() => {
    const init = async () => {
      const storedSelection = getStoredRestaurantSelection();
      if (storedSelection?.tableNumber) {
        setTableNumber(storedSelection.tableNumber);
      }

      // Load from IndexedDB cache immediately
      const { offlineStorage } = await import('../../../shared/utils/offlineStorage');
      const cached = await offlineStorage.getRestaurants();
      if (cached && cached.length > 0) {
        setRestaurants(cached);
        setLoading(false);
      }
    };
    init();
  }, []);

  // Restore location from cache on mount so we don't ask again after refresh
  useEffect(() => {
    const cached = getCachedLocation();
    if (cached) {
      setUserLocation(cached);
      setLocationPermission('granted');
    }
  }, []);

  // Check if user is an owner or manager
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('profile_role')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.profile_role) {
        setUserRole(data.profile_role);
      }

      if (['owner', 'manager', 'admin'].includes(data?.profile_role)) {
        setIsOwner(true);
        // Default to showing all restaurants (Active) so they see everything by default
        setShowAllRestaurants(true);
        // User can manually toggle to "My Restaurants"
        setShowMyRestaurants(false);
      }
    };
    checkUserRole();
  }, [user]);

  // Pre-select the current restaurant if returning to the page
  useEffect(() => {
    const storedSelection = getStoredRestaurantSelection();
    if (storedSelection?.restaurantId && restaurants.length > 0 && !selectedRestaurant) {
      const currentRestaurant = restaurants.find((r) => r.id === storedSelection.restaurantId);
      if (currentRestaurant) {
        setSelectedRestaurant(currentRestaurant);
      }
    }
  }, [restaurants, selectedRestaurant]);

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
    // Skip if auth is still loading to avoid race conditions with session refresh
    if (authLoading) return;

    fetchRestaurants(false);
  }, [userLocation, showAllRestaurants, showMyRestaurants, isOwner, authLoading]);

  // Collapse bottom selection bar while scrolling the restaurant list
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    let scrollEndTimer;
    const handleScroll = () => {
      const currentScrollY = el.scrollTop;
      if (Math.abs(currentScrollY - scrollYRef.current) > 4) {
        setIsScrolling(true);
        clearTimeout(scrollEndTimer);
        scrollEndTimer = setTimeout(() => setIsScrolling(false), 220);
      }
      scrollYRef.current = currentScrollY;
      setScrollY(currentScrollY);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollEndTimer);
    };
  }, [restaurants.length, selectedRestaurant?.id]);

  // After fetching restaurants with location:
  useEffect(() => {
    if (userLocation && restaurants.length > 0) {
      // Find the closest restaurant within 100 meters (0.1 km)
      const closest = restaurants.find((r) => r.distance !== null && r.distance < 0.1);
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
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Cache so we don't ask again on refresh
        setCachedLocation({ latitude, longitude });

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
      options,
    );
  };

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      );
      const data = await response.json();

      if (data.display_name) {
        const address = data.display_name.split(',').slice(0, 3).join(',');
        setCachedLocation({ latitude, longitude, address });
        setUserLocation((prev) => ({ ...prev, address }));
      }
    } catch (error) {
      // Don't set error here as coordinates are still useful
    }
  };

  // Show location prompt as toast at top when opening page without location (once per visit)
  useEffect(() => {
    if (locationToastShownRef.current) return;
    if (userLocation || locationLoading || locationError) return;
    const timer = setTimeout(() => {
      if (userLocation || locationLoading || locationError) return;
      locationToastShownRef.current = true;
      const SWIPE_THRESHOLD = 50;
      const touchStart = { x: 0, y: 0 };
      toast.custom(
        (t) => {
          const handleTouchStart = (e) => {
            touchStart.x = e.touches[0].clientX;
            touchStart.y = e.touches[0].clientY;
          };
          const handleTouchEnd = (e) => {
            const dx = e.changedTouches[0].clientX - touchStart.x;
            const dy = e.changedTouches[0].clientY - touchStart.y;
            const swipedUp = dy < -SWIPE_THRESHOLD;
            const swipedLeft = dx < -SWIPE_THRESHOLD;
            const swipedRight = dx > SWIPE_THRESHOLD;
            if (swipedUp || swipedLeft || swipedRight) toast.dismiss(t.id);
          };
          return (
            <div
              className="flex items-center justify-between gap-3 bg-white border border-orange-200 rounded-lg shadow-lg p-3 max-w-md touch-pan-y"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Find Restaurants Near You</p>
                  <p className="text-xs text-gray-600 mt-0.5">Enable location for nearby list</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  getUserLocation();
                  toast.dismiss(t.id);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-3 py-2 rounded-lg flex-shrink-0 transition-colors"
              >
                Enable
              </button>
            </div>
          );
        },
        { position: 'top-center', duration: 8000 },
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [userLocation, locationLoading, locationError]);

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

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
  const fetchRestaurants = async (showRefreshAnimation = false, force = false, retryCount = 0) => {
    // Abort previous request if one exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      if (showRefreshAnimation) {
        setIsRefreshing(true);
      } else if (restaurants.length === 0) {
        setLoading(true);
      }
      setError(null);

      let data = [];

      if (showAllRestaurants) {
        // Use memory cache if available and not forcing
        if (cachedAll && !force) {
          setRestaurants(cachedAll);
          setLoading(false);
          if (showRefreshAnimation) setTimeout(() => setIsRefreshing(false), 500);
          return;
        }
        data = await getAllRestaurants();
        if (userLocation) {
          data = data.map((restaurant) => {
            let distance = null;
            if (restaurant.location) {
              const match = restaurant.location.match(/POINT\(([^)]+)\)/);
              if (match) {
                const [lng, lat] = match[1].split(' ');
                distance = calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  parseFloat(lat), // restaurant latitude
                  parseFloat(lng), // restaurant longitude
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
        // Use memory cache if available and not forcing
        if (cachedNearby && !force) {
          setRestaurants(cachedNearby);
          setLoading(false);
          if (showRefreshAnimation) setTimeout(() => setIsRefreshing(false), 500);
          return;
        }
        data = await getClosestRestaurants(userLocation.latitude, userLocation.longitude, 5000);
        data = (data || []).map((restaurant) => ({
          ...restaurant,
          distance: typeof restaurant.distance === 'number' ? restaurant.distance / 1000 : null,
        }));
        // Sort by distance (closest first)
        data.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
        setCachedNearby(data);
      } else if (showMyRestaurants && isOwner && user?.id) {
        // Fetch restaurants connected to the user (My Restaurants)
        const { data: staffData, error: staffError } = await supabase
          .from('restaurant_staff')
          .select('restaurant_id')
          .eq('user_id', user.id);

        if (!staffError && staffData && staffData.length > 0) {
          const ids = staffData.map((item) => item.restaurant_id);
          const { data: restaurantsData, error: restsError } = await supabase
            .from('restaurants')
            .select('*')
            .in('id', ids);

          data = restaurantsData || [];
        } else {
          data = [];
        }
      } else {
        data = await getActiveRestaurants();
      }

      const restaurantsData = data || [];
      setRestaurants(restaurantsData);

      // Sync the persistent IndexedDB cache to this authoritative result.
      // Persist even when empty so a stale cache (e.g. restaurants whose
      // subscription has since lapsed) gets cleared instead of flashing on
      // the next mount's optimistic cache load. saveRestaurants([]) clears the store.
      import('../../../shared/utils/offlineStorage').then(({ offlineStorage }) => {
        offlineStorage.saveRestaurants(restaurantsData);
      });
    } catch (err) {
      // Ignore abort errors as they are intentional
      if (err.name === 'AbortError' || err.message?.includes('aborted')) return;

      console.error('Error fetching restaurants:', err);

      // Retry once after abort/session mismatch (clear stale Supabase auth keys)
      const isAbort = err?.name === 'AbortError' || err?.message?.includes('aborted');
      if (retryCount < 1) {
        if (isAbort) {
          try {
            Object.keys(localStorage)
              .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
              .forEach((k) => localStorage.removeItem(k));
          } catch (e) {
            /* ignore */
          }
        }
        await new Promise((r) => setTimeout(r, 300));
        return fetchRestaurants(showRefreshAnimation, force, retryCount + 1);
      }

      // Check if it's an authentication error
      const isAuthError =
        err?.isAuthError ||
        err?.code === 'PGRST301' ||
        err?.message?.includes('JWT') ||
        err?.message?.includes('expired') ||
        err?.message?.includes('Invalid Refresh Token') ||
        err?.message?.includes('Refresh Token Not Found') ||
        err?.status === 401 ||
        err?.error?.code === 'PGRST301' ||
        err?.error?.status === 401 ||
        err?.error?.isAuthError;

      if (isAuthError) {
        const returnUrl = window.location.pathname + window.location.search;
        navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`, { replace: true });
        return;
      }

      const errorMessage = err?.message || err?.error?.message || 'Failed to load restaurants.';
      setError(errorMessage);
    } finally {
      // Only clear loading states if this is still the active request
      setLoading(false);
      if (showRefreshAnimation) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
      abortControllerRef.current = null;
    }
  };

  // Effect was consolidated above.
  // No longer needed to prevent double-firing on mount while auth loads.

  // Invalidate nearby cache when userLocation changes so next fetch gets fresh nearby list
  useEffect(() => {
    if (userLocation) {
      setCachedNearby(null);
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
      Italian: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
      Japanese: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
      American: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
      Indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
      Seafood: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
      Chinese: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      Mexican: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
      Thai: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    };

    return (
      defaultImages[cuisineType] ||
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
    );
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
    const stored = getStoredRestaurantSelection();
    const inputTable = tableNumber.trim();
    const finalTableNumber =
      inputTable || stored?.tableNumber || (availableTables.length === 0 ? 'N/A' : '');

    if (availableTables.length > 0 && !finalTableNumber) {
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
    return availableTables.find((table) => table.tableNumber === tableNumber);
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
      const matchingTable = availableTables.find(
        (table) => table.tableNumber === storedSelection.tableNumber,
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

  // 1. Compact Header on Mobile
  // Replace the header div with a more compact version for mobile
  return (
    <div className="flex justify-center items-start min-h-screen bg-black">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        {/* Header */}
        <div className="w-full px-6 py-6 relative flex items-center justify-center bg-black flex-shrink-0 md:static md:bg-transparent">
          <button
            className="absolute left-4 text-orange-500 hover:text-orange-600 transition-all duration-300 p-2 rounded-full hover:bg-orange-500/10 active:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/30 touch-manipulation"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ChevronLeft size={30} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-gray-100 text-2xl md:text-3xl font-medium">
              {userLocation ? 'Restaurants Near You' : 'Select Restaurant'}
            </h1>
            <p className="text-gray-400 text-xs md:text-sm mt-1">
              {userLocation
                ? 'Showing restaurants sorted by distance'
                : 'Choose a restaurant to view the menu'}
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
          <div className="flex-1 flex flex-col bg-gray-200 rounded-t-3xl overflow-hidden min-h-[500px] px-4 pt-4 pb-6">
            {/* Filter / Search bar */}
            <div className={`${isOwner ? 'mb-2' : 'mb-3'}`}>
              <AnimatePresence mode="wait">
                {showSearch ? (
                  /* ── Search mode ── */
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white rounded-2xl shadow-sm flex items-center gap-2 px-3 h-12"
                  >
                    <Search size={16} className="text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search restaurants or cuisine…"
                      className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent border-none outline-none"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Escape' && handleSearchToggle()}
                    />
                    {searchQuery ? (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 flex-shrink-0"
                        aria-label="Clear search"
                      >
                        <X size={13} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setShowQrScanner(true)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 flex-shrink-0 transition-all"
                      aria-label="Scan table QR code"
                    >
                      <QrCode size={15} />
                    </button>
                    <button
                      onClick={handleSearchToggle}
                      className="text-xs font-medium text-orange-500 flex-shrink-0 ml-1"
                    >
                      Cancel
                    </button>
                  </motion.div>
                ) : (
                  /* ── Filter mode ── */
                  <motion.div
                    key="filters"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white rounded-2xl shadow-sm flex items-center gap-2 px-3 h-12"
                  >
                    {/* Location status */}
                    <button
                      onClick={handleLocationRequest}
                      disabled={locationLoading}
                      className="flex items-center gap-1.5 flex-shrink-0 min-w-0 mr-1"
                      aria-label="Toggle location"
                    >
                      <div className="relative flex-shrink-0">
                        <MapPin
                          size={16}
                          className={userLocation ? 'text-orange-500' : 'text-gray-400'}
                        />
                        {locationLoading && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-600 truncate max-w-[90px]">
                        {locationLoading
                          ? 'Locating…'
                          : userLocation
                            ? userLocation.address?.split(',')[0] || 'Located'
                            : 'Location off'}
                      </span>
                    </button>

                    {/* Divider */}
                    <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

                    {/* Pill filters */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <button
                        onClick={() => {
                          if (!userLocation) getUserLocation();
                          else {
                            setShowAllRestaurants(false);
                            setShowMyRestaurants(false);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                          !showAllRestaurants && !showMyRestaurants
                            ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        Near me
                      </button>
                      <button
                        onClick={() => {
                          setShowAllRestaurants(true);
                          setShowMyRestaurants(false);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                          showAllRestaurants
                            ? 'bg-gray-800 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                    </div>

                    {/* QR scan */}
                    <button
                      type="button"
                      onClick={() => setShowQrScanner(true)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 flex-shrink-0 transition-all"
                      aria-label="Scan table QR code"
                    >
                      <QrCode size={15} />
                    </button>

                    {/* Search icon */}
                    <button
                      onClick={handleSearchToggle}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex-shrink-0 transition-all"
                      aria-label="Search"
                    >
                      <Search size={15} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* My Restaurants - staff/owner/admin only, compact CTA below location bar */}
            {isOwner && (
              <div className="mt-0 mb-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowMyRestaurants(true);
                    setShowAllRestaurants(false);
                  }}
                  className={`w-full rounded-lg py-2 px-3 font-medium text-sm transition-all flex items-center justify-between gap-2 border ${
                    showMyRestaurants
                      ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                      : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50 hover:border-amber-300'
                  }`}
                >
                  <span className="flex-1 min-w-0" aria-hidden="true" />
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${showMyRestaurants ? 'bg-amber-400' : 'bg-amber-100'}`}
                    >
                      <Store
                        size={16}
                        className={showMyRestaurants ? 'text-amber-900' : 'text-amber-600'}
                      />
                    </span>
                    <span>My Restaurants</span>
                  </span>
                  <span className="flex-1 min-w-0 flex justify-end items-center">
                    {showMyRestaurants && (
                      <span className="text-xs font-medium opacity-90">Active</span>
                    )}
                  </span>
                </button>
              </div>
            )}

            {/* Restaurants List - fills remaining space, scrollable */}
            <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm overflow-hidden">
              <div
                ref={scrollRef}
                className="h-full overflow-y-auto overscroll-contain p-2 md:p-4"
                style={{
                  paddingBottom: selectedRestaurant ? (isScrolling ? '96px' : '140px') : '16px',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                }}
              >
                {(loading || authLoading) && restaurants.length === 0 ? (
                  <div className="flex flex-col items-center w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse bg-white/10 rounded-2xl border-2 border-gray-800 shadow-sm mb-4 flex items-center px-2 py-3 md:px-4 md:py-4 w-full max-w-xl"
                      >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-300 rounded-lg mr-3" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-1/2" />
                          <div className="h-3 bg-gray-300 rounded w-1/3" />
                          <div className="h-3 bg-gray-200 rounded w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-full p-6">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md shadow-lg text-center">
                      <div className="text-red-500 text-6xl mb-4">⚠️</div>
                      <h3 className="text-red-600 text-xl font-semibold mb-2">
                        Error Loading Restaurants
                      </h3>
                      <p className="text-red-500 text-sm mb-4">{error}</p>
                      <button
                        onClick={() => {
                          setError(null);
                          fetchRestaurants(false, true);
                        }}
                        className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : showSearch &&
                  searchResults !== null &&
                  searchResults.length === 0 &&
                  !searchLoading ? (
                  <div className="flex flex-col items-center justify-center h-full p-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-md shadow-lg text-center">
                      <div className="text-gray-400 text-6xl mb-4">🔍</div>
                      <h3 className="text-gray-700 text-xl font-semibold mb-2">No Results Found</h3>
                      <p className="text-gray-500 text-sm mb-4">
                        No restaurants found matching "{searchQuery}". Try a different search, or
                        scan the QR code on your table.
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setShowQrScanner(true)}
                          className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <QrCode size={18} />
                          Scan Table QR
                        </button>
                        <button
                          onClick={handleClearSearch}
                          className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Clear Search
                        </button>
                      </div>
                    </div>
                  </div>
                ) : !loading &&
                  restaurants.length === 0 &&
                  !(showSearch && searchResults !== null) ? (
                  <div className="flex flex-col items-center justify-center h-full p-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-md shadow-lg text-center">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-orange-100 flex items-center justify-center">
                        <QrCode size={28} className="text-orange-500" />
                      </div>
                      <h3 className="text-gray-700 text-xl font-semibold mb-2">
                        {showMyRestaurants ? 'No restaurants assigned' : 'No restaurants found'}
                      </h3>
                      <p className="text-gray-500 text-sm mb-4">
                        {showMyRestaurants
                          ? "You don't have any restaurants assigned to your account."
                          : showAllRestaurants
                            ? 'No restaurants are listed right now. Scan the QR code on your table to open the menu directly.'
                            : userLocation
                              ? 'No restaurants found nearby. Scan your table QR or view all restaurants.'
                              : 'No restaurants found nearby. Scan your table QR, enable location, or view all restaurants.'}
                      </p>
                      <div className="flex flex-col gap-2">
                        {!showMyRestaurants && (
                          <button
                            type="button"
                            onClick={() => setShowQrScanner(true)}
                            className="w-full bg-orange-500 text-white px-4 py-2.5 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 font-medium"
                          >
                            <QrCode size={18} />
                            Scan Table QR
                          </button>
                        )}
                        {!showAllRestaurants && !showMyRestaurants && (
                          <button
                            onClick={() => {
                              setShowAllRestaurants(true);
                              setShowMyRestaurants(false);
                            }}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
                          >
                            View All Restaurants
                          </button>
                        )}
                        {!userLocation && !showMyRestaurants && (
                          <button
                            onClick={getUserLocation}
                            className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Enable Location
                          </button>
                        )}
                        <button
                          onClick={() => fetchRestaurants(true, true)}
                          className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {(showSearch && searchResults ? searchResults : restaurants).map(
                      (restaurant, index) => {
                        const isSelected = selectedRestaurant?.id === restaurant.id;
                        const imgSrc =
                          restaurant.restaurant_photo_url?.trim() ||
                          restaurant.logo_url?.trim() ||
                          getDefaultRestaurantImage(restaurant.cuisine_type) ||
                          null;

                        return (
                          <motion.div
                            key={restaurant.id}
                            whileTap={{ scale: 0.975 }}
                            onClick={() => handleRestaurantClick(restaurant)}
                            tabIndex={0}
                            aria-label={`Select ${restaurant.name}`}
                            role="button"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ')
                                handleRestaurantClick(restaurant);
                            }}
                            className={`bg-white rounded-2xl cursor-pointer touch-manipulation flex items-center gap-3 px-3 py-3 transition-all ${
                              isSelected
                                ? 'border-2 border-orange-500 shadow-md shadow-orange-100'
                                : 'border border-gray-100 shadow-sm'
                            }`}
                          >
                            {/* Image */}
                            <div className="relative flex-shrink-0">
                              {imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={restaurant.name}
                                  className="w-20 h-20 object-cover rounded-xl"
                                  loading={index > 2 ? 'lazy' : 'eager'}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                  }}
                                  draggable={false}
                                />
                              ) : (
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl flex items-center justify-center text-3xl">
                                  🍽️
                                </div>
                              )}
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow"
                                >
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path
                                      d="M1 4L3.5 6.5L9 1"
                                      stroke="white"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </motion.div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-semibold text-sm text-gray-900 truncate leading-tight">
                                  {restaurant.name}
                                </span>
                                {userLocation && restaurant.distance != null && (
                                  <span className="flex-shrink-0 text-[11px] font-medium text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">
                                    {formatDistance(restaurant.distance)}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                {restaurant.cuisine_type && (
                                  <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                                    {restaurant.cuisine_type}
                                  </span>
                                )}
                                {restaurant.description?.trim() && (
                                  <span className="text-[11px] text-gray-400 truncate max-w-[140px]">
                                    {restaurant.description}
                                  </span>
                                )}
                              </div>

                              {restaurant.address?.trim() ? (
                                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                  <MapPin size={11} className="flex-shrink-0 text-gray-300" />
                                  <span className="truncate">{restaurant.address}</span>
                                </div>
                              ) : null}
                            </div>
                          </motion.div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Floating selection card - fixed at bottom */}
            <AnimatePresence mode="wait">
              {selectedRestaurant && (
                <motion.div
                  initial={{ opacity: 0, y: 80 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: 80,
                    transition: { duration: 0.25, ease: 'easeIn' },
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="fixed left-0 right-0 bottom-0 z-50 flex justify-center"
                >
                  <div
                    className={`w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl px-3 bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] border-t-4 border-orange-500 overflow-hidden touch-manipulation transition-all duration-200 ease-out ${
                      isScrolling ? 'pt-1 pb-2' : 'pt-2 pb-3'
                    }`}
                    style={{
                      paddingBottom: isScrolling
                        ? 'max(0.5rem, env(safe-area-inset-bottom))'
                        : 'max(0.75rem, env(safe-area-inset-bottom))',
                    }}
                    onTouchStart={(e) => {
                      floatingCardTouchStartY.current = e.touches[0].clientY;
                    }}
                    onTouchEnd={(e) => {
                      const dy = e.changedTouches[0].clientY - floatingCardTouchStartY.current;
                      if (dy > 60) {
                        setSelectedRestaurant(null);
                        setShowTableSelection(false);
                        setTableNumber('');
                      }
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSelectedRestaurant(null);
                        setShowTableSelection(false);
                        setTableNumber('');
                      }
                    }}
                    aria-label="Swipe down to cancel selection"
                  >
                    <motion.div
                      className={`transition-all duration-200 ease-out ${isScrolling ? 'p-1.5' : 'p-2.5'}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        y: 20,
                        transition: { duration: 0.2, delay: 0.1 },
                      }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      {/* Row 1: Restaurant name — collapses while scrolling */}
                      <div
                        className={`flex items-center min-w-0 overflow-hidden transition-all duration-200 ease-out ${
                          isScrolling
                            ? 'max-h-0 opacity-0 mb-0 pointer-events-none'
                            : 'max-h-8 opacity-100 mb-2'
                        }`}
                      >
                        <Store size={16} className="text-orange-500 mr-1.5 flex-shrink-0" />
                        <span className="text-sm font-bold text-orange-600 truncate min-w-0 block">
                          {selectedRestaurant.name}
                        </span>
                      </div>
                      {/* Row 2: Table selector · Continue (swipe down to cancel) */}
                      <div className="flex items-center gap-2 flex-nowrap min-w-0">
                        {availableTables.length > 0 ? (
                          <select
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            className={`flex-shrink-0 font-medium rounded-md border appearance-none bg-no-repeat focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer min-w-0 max-w-[7rem] transition-all duration-200 ${
                              isScrolling
                                ? 'text-[10px] py-0.5 pl-1.5 pr-5'
                                : 'text-[11px] py-1 pl-2 pr-6'
                            } ${
                              isTableAutoSelected()
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-orange-300'
                            }`}
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                              backgroundPosition: 'right 6px center',
                            }}
                            aria-label="Select table"
                          >
                            <option value="">Select table</option>
                            {availableTables.map((table) => (
                              <option key={table.id} value={table.tableNumber}>
                                Table {table.tableNumber}
                              </option>
                            ))}
                          </select>
                        ) : null}
                        <div className="flex-1 min-w-0" />
                        <motion.button
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{
                            opacity: 0,
                            y: 20,
                            transition: { duration: 0.2 },
                          }}
                          transition={{ duration: 0.3, delay: 0.3 }}
                          onClick={handleContinue}
                          disabled={
                            isSelecting || (availableTables.length > 0 && !tableNumber.trim())
                          }
                          className={`bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-sm touch-manipulation flex-shrink-0 flex items-center gap-1.5 ${
                            isScrolling ? 'py-1.5 px-2.5 text-xs' : 'py-2 px-3 text-sm'
                          }`}
                          style={{ minHeight: isScrolling ? '32px' : '36px' }}
                        >
                          {isSelecting ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                              <span>Setting up...</span>
                            </>
                          ) : (
                            <>
                              <span>Continue</span>
                              <ArrowRight size={14} />
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
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
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl p-4 max-w-xs w-full shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Opening {selectedRestaurant?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-orange-500 border-t-transparent"></div>
                      <span className="text-xs text-gray-500">Redirecting...</span>
                    </div>
                  </div>
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
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
              onClick={() => setShowLocationModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl p-5 max-w-xs w-full shadow-xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Location Required
                    </h3>
                    <p className="text-xs text-gray-500">
                      Enable location to find nearby restaurants
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-4 bg-gray-50 p-2 rounded-lg">
                  <span className="font-medium">Tip:</span> Click the lock icon in address bar →
                  Site settings → Allow location
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="flex-1 text-sm text-gray-600 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => {
                      setShowLocationModal(false);
                      getUserLocation();
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
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
              className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4 z-50"
              onClick={() => setShowTablePopup(false)}
              style={{ zIndex: 100 }}
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-t-xl md:rounded-xl p-4 w-full max-w-sm mx-auto shadow-xl"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: '70vh', overflowY: 'auto' }}
                role="dialog"
                aria-modal="true"
                aria-label="Select Table Number"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Select Table</h3>
                  <button
                    onClick={() => setShowTablePopup(false)}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5">
                  {availableTables.length > 0 ? (
                    availableTables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => {
                          setTableNumber(table.tableNumber);
                          setShowTablePopup(false);
                        }}
                        className={`w-full px-3 py-2.5 rounded-lg border transition-all duration-150 text-left focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                          table.tableNumber === tableNumber
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                        }`}
                        aria-label={`Select table ${table.tableNumber}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">Table {table.tableNumber}</span>
                            {table.location && <span className="mx-1 text-gray-400">•</span>}
                            {table.location && (
                              <span className="text-gray-500">{table.location}</span>
                            )}
                            <span className="mx-1 text-gray-400">•</span>
                            <span className="text-gray-400">{table.capacity} seats</span>
                          </div>
                          {table.tableNumber === tableNumber && (
                            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Store size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="font-medium text-sm">No tables available</p>
                      <p className="text-xs mt-1">Please ask staff for assistance</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setShowTablePopup(false)}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    aria-label="Cancel table selection"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowTablePopup(false)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${tableNumber ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    aria-label="Confirm table selection"
                    disabled={!tableNumber}
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nearest Restaurant Popup */}
        {showNearestRestaurantPopup && nearestRestaurant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4"
            onClick={() => setShowNearestRestaurantPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-xl p-5 shadow-xl max-w-xs w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setShowNearestRestaurantPopup(false)}
                aria-label="Close"
              >
                <X size={14} />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">You're near</p>
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {nearestRestaurant.name}
                  </h3>
                </div>
              </div>

              {nearestRestaurant.address && (
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                  {nearestRestaurant.address}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => {
                    setSelectedRestaurant(nearestRestaurant);
                    setShowNearestRestaurantPopup(false);
                  }}
                >
                  Yes, select
                </button>
                <button
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => setShowNearestRestaurantPopup(false)}
                >
                  No, skip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        <QRScanModal
          open={showQrScanner}
          onClose={() => setShowQrScanner(false)}
          onScan={handleQrScanSuccess}
        />
      </div>
    </div>
  );
};

export default RestaurantSelectionPage;
