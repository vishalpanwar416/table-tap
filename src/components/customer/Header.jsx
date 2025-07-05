import React, { useRef, useEffect, useState } from 'react';
import { Search, X, ShoppingCart, Bell, User, MapPin, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../config/AuthContext';
import { useCart } from '../../config/CartContent';
import { useRestaurant } from '../../Pages/Restaurantselection/RestaurantContext';

const Header = ({ 
  isSearchActive, 
  toggleSearch, 
  toggleSidebar,
  toggleNotifications,
  toggleCart,
  onSearch,
  onSearchClose,
  showRestaurantInfo = true // New prop to control restaurant info visibility
}) => {
  const inputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { cartItems } = useCart();
  const { restaurant, loading, error } = useRestaurant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we should show restaurant info based on current route
  const shouldShowRestaurantInfo = showRestaurantInfo && location.pathname === '/home';

  useEffect(() => {
    if (isSearchActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchActive]);

  // Real-time search as user types
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Call onSearch for real-time filtering
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Search is already happening in real-time, so just prevent form submission
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (onSearch) {
      onSearch(''); // Clear the search
    }
    if (onSearchClose) {
      onSearchClose(); // Close search
    }
  };

  const handleLocationClick = () => {
    if (restaurant?.google_maps_link) {
      window.open(restaurant.google_maps_link, '_blank');
    }
  };

  const handleChangeRestaurant = () => {
    navigate('/restaurant-selection');
  };

  // Handle search icon click
  const handleSearchIconClick = () => {
    if (isSearchActive) {
      // If search is active, clear and close it
      clearSearch();
    } else {
      // Open search
      toggleSearch();
    }
  };

  // Show loading state or error fallback
  const getRestaurantDisplay = () => {
    if (loading) {
      return {
        name: "Loading...",
        address: "Please wait..."
      };
    }
    
    if (error || !restaurant) {
      return {
        name: "Restaurant",
        address: "Unable to load location"
      };
    }
    
    return {
      name: restaurant.name,
      address: restaurant.address
    };
  };

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
        // Empty div to maintain layout when restaurant info is hidden
        <div className="flex-1"></div>
      )}

      {/* Search input section - positioned absolutely when active */}
      <div className={`transition-all duration-500 ease-out ${
        isSearchActive 
          ? 'absolute left-2 sm:left-4 right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10' 
          : 'relative'
      }`}>
        <form onSubmit={handleSearchSubmit} className="SearchBar">
          <div className={`flex items-center ${isSearchActive ? 'px-4 sm:px-6 py-4 sm:py-6' : 'px-1 sm:px-2 py-1 sm:py-2'} rounded-xl bg-transparent overflow-hidden transition-all duration-500 ease-out`}>
            <input
              ref={inputRef}
              type="text"
              placeholder={shouldShowRestaurantInfo ? "Search best sellers..." : "Search items..."}
              value={searchQuery}
              onChange={handleSearchInput}
              className={`transition-all duration-500 ease-out bg-white text-gray-700 text-sm sm:text-base outline-none font-medium rounded-full px-2 sm:px-3 py-1.5 sm:py-2 ${
                isSearchActive ? 'w-full opacity-100 pr-4 transform scale-100' : 'w-0 opacity-0 pointer-events-none transform scale-95'
              }`}
            />
            <div className="flex items-center ml-1 sm:ml-2">
              {isSearchActive ? (
                <button
                  type="button"
                  onClick={clearSearch}
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
          className={`cursor-pointer text-white text-lg sm:text-xl transition-all duration-300 ease-out hover:scale-110 ${
            isSearchActive ? 'text-blue-300' : ''
          }`}
        >
          <Search size={22} className="sm:w-6 sm:h-6" />
        </button>
        
        <button onClick={toggleCart} className="relative transition-transform duration-300 ease-out hover:scale-110">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 md:w-9 md:h-9 text-white" />
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </button>
        
        <button onClick={toggleNotifications} className="text-white transition-transform duration-300 ease-out hover:scale-110">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 md:w-9 md:h-9" />
        </button>
        
        <button
          onClick={toggleSidebar}
          className="text-white transition-transform duration-300 ease-out hover:scale-110"
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-9 md:h-9" />
        </button>
      </div>
    </div>
  );
};

export default Header;