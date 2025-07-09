import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Search, X, ShoppingCart, Bell, User, MapPin, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../config/AuthContext';
import { useCart } from '../../config/CartContent';
import { useRestaurant } from '../../Pages/Restaurantselection/RestaurantContext';

// Debounce utility
function useDebouncedCallback(callback, delay) {
  const timeoutRef = useRef();
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; }, [callback]);
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}

const Header = memo(({ 
  isSearchActive, 
  toggleSearch, 
  toggleSidebar,
  toggleNotifications,
  toggleCart,
  onSearch,
  onSearchClose,
  showRestaurantInfo = true
}) => {
  const inputRef = useRef(null);
  const searchBarRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { cartItems } = useCart();
  const { restaurant, loading, error } = useRestaurant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const shouldShowRestaurantInfo = showRestaurantInfo && location.pathname === '/home';

  // Debounced search callback
  const debouncedSearch = useDebouncedCallback((query) => {
    if (onSearch) onSearch(query);
  }, 250);

  useEffect(() => {
    if (isSearchActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchActive]);

  // Close search on outside click or Escape
  useEffect(() => {
    if (!isSearchActive) return;
    function handleClick(e) {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        handleCloseSearch();
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') {
        handleCloseSearch();
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isSearchActive]);

  const handleSearchInput = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    if (onSearch) onSearch('');
    if (onSearchClose) onSearchClose();
  }, [onSearch, onSearchClose]);

  // Unified close handler
  const handleCloseSearch = useCallback(() => {
    clearSearch();
    if (isSearchActive) toggleSearch();
  }, [clearSearch, isSearchActive, toggleSearch]);

  const handleLocationClick = useCallback(() => {
    if (restaurant?.google_maps_link) {
      window.open(restaurant.google_maps_link, '_blank');
    }
  }, [restaurant]);

  const handleChangeRestaurant = useCallback(() => {
    navigate('/restaurant-selection');
  }, [navigate]);

  const handleSearchIconClick = useCallback(() => {
    if (isSearchActive) {
      handleCloseSearch();
    } else {
      toggleSearch();
    }
  }, [isSearchActive, handleCloseSearch, toggleSearch]);

  const getRestaurantDisplay = useCallback(() => {
    if (loading) {
      return { name: 'Loading...', address: 'Please wait...' };
    }
    if (error || !restaurant) {
      return { name: 'Restaurant', address: 'Unable to load location' };
    }
    return { name: restaurant.name, address: restaurant.address };
  }, [loading, error, restaurant]);

  const displayData = getRestaurantDisplay();

  return (
    <div className="px-2 sm:px-4 py-2 sm:py-3 flex justify-between items-center w-full relative">
      {/* Left side - Restaurant info (only shown on home page) */}
      {shouldShowRestaurantInfo ? (
        <div className={`flex-1 transition-all duration-500 ease-out ${isSearchActive ? 'opacity-0 pointer-events-none transform -translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
          <div className="flex flex-col items-start justify-center text-left">
            <div className="flex items-center gap-1 sm:gap-2 w-full">
              <button 
                onClick={handleLocationClick}
                disabled={loading || error || !restaurant?.google_maps_link}
                aria-label="Open restaurant location in Google Maps"
                className={`flex items-center gap-1 transition-opacity duration-200 flex-1 min-w-0 ${
                  loading || error || !restaurant?.google_maps_link 
                    ? 'cursor-default opacity-70' 
                    : 'hover:opacity-80 cursor-pointer'
                }`}
              >
                <MapPin size={12} className="sm:w-[14px] sm:h-[14px] text-white flex-shrink-0" />
                <h2 className="text-white text-[14px] sm:text-[17px] font-spartan truncate" title={displayData.name}>
                  {displayData.name}
                </h2>
              </button>
              {/* Change Restaurant Button - Smaller on mobile */}
              <button
                onClick={handleChangeRestaurant}
                aria-label="Change restaurant"
                className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[7px] sm:text-[8px] text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0"
                title="Change Restaurant"
              >
                <RefreshCw size={7} className="sm:w-2 sm:h-2" />
                <span className="hidden xs:inline">Change</span>
                <span className="xs:hidden">Ch</span>
              </button>
            </div>
            <p className="text-[7px] sm:text-[8px] text-gray-300 truncate max-w-[150px] sm:max-w-[200px] ml-4 sm:ml-5">
              {displayData.address}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1"></div>
      )}

      {/* Search input section - positioned absolutely when active */}
      <div
        ref={searchBarRef}
        className={`transition-all duration-500 ease-out ${
          isSearchActive 
            ? 'absolute left-2 sm:left-4 right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10' 
            : 'relative'
        }`}
      >
        <form onSubmit={handleSearchSubmit} className="SearchBar">
          <div className={`flex items-center ${isSearchActive ? 'px-4 sm:px-6 py-4 sm:py-6' : 'px-1 sm:px-2 py-1 sm:py-2'} rounded-xl bg-transparent overflow-hidden transition-all duration-500 ease-out`}>
            <input
              ref={inputRef}
              type="text"
              placeholder={shouldShowRestaurantInfo ? "Search best sellers..." : "Search items..."}
              value={searchQuery}
              onChange={handleSearchInput}
              aria-label="Search menu items"
              className={`transition-all duration-500 ease-out bg-white text-gray-700 text-sm sm:text-base outline-none font-medium rounded-full px-2 sm:px-3 py-1.5 sm:py-2 ${
                isSearchActive ? 'w-full opacity-100 pr-4 transform scale-100' : 'w-0 opacity-0 pointer-events-none transform scale-95'
              }`}
            />
            <div className="flex items-center ml-1 sm:ml-2">
              {isSearchActive ? (
                <button
                  type="button"
                  onClick={handleCloseSearch}
                  aria-label="Clear search"
                  className="cursor-pointer text-white text-lg sm:text-xl flex-shrink-0 transition-all duration-300 ease-out transform hover:scale-110"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      {/* Right side - Icons section */}
      <div className={`flex space-x-2 sm:space-x-4 transition-all duration-500 ease-out ${isSearchActive ? 'opacity-20 transform translate-x-2' : 'opacity-100 transform translate-x-0'}`}>
        <button
          type="button"
          onClick={handleSearchIconClick}
          aria-label="Toggle search bar"
          className={`cursor-pointer text-white text-lg sm:text-xl transition-all duration-300 ease-out hover:scale-110 ${
            isSearchActive ? 'text-blue-300' : ''
          }`}
        >
          <Search size={28} className="sm:w-8 sm:h-8" />
        </button>
        
        <button onClick={toggleCart} aria-label="Open cart" className="relative transition-transform duration-300 ease-out hover:scale-110">
          <ShoppingCart className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 text-white" />
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </button>
        
        <button onClick={toggleNotifications} aria-label="Open notifications" className="text-white transition-transform duration-300 ease-out hover:scale-110">
          <Bell className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11" />
        </button>
        
        <button
          onClick={toggleSidebar}
          aria-label="Open sidebar menu"
          className="text-white transition-transform duration-300 ease-out hover:scale-110"
        >
          <User className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11" />
        </button>
      </div>
    </div>
  );
});

export default Header;