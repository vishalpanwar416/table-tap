import React, { useRef, useEffect, useState } from 'react';
import { Search, X, ShoppingCart, Bell, User, MapPin } from 'lucide-react';
import { useCart } from '../../config/CartContent';
import { useRestaurant } from '../../context/RestaurantContext';

const Header = ({ 
  isSearchActive, 
  toggleSearch, 
  toggleSidebar,
  toggleNotifications,
  toggleCart,
  onSearch
}) => {
  const inputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { cartItems } = useCart();
  const { restaurant } = useRestaurant();

  useEffect(() => {
    if (isSearchActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchActive]);

  const handleSearchInput = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    toggleSearch();
  };

  const handleLocationClick = () => {
    if (restaurant.google_maps_link) {
      window.open(restaurant.google_maps_link, '_blank');
    }
  };

  return (
    <div className="px-4 flex justify-between items-center w-full relative">
      {/* Left side - Restaurant info */}
      <div className={`flex-1 transition-all duration-500 ease-out ${isSearchActive ? 'opacity-0 pointer-events-none transform -translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
        <button 
          onClick={handleLocationClick}
          className="flex flex-col items-start justify-center text-left hover:opacity-80 transition-opacity duration-200"
        >
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-white" />
            <h2 className="text-white text-[17px] font-spartan">{restaurant.name}</h2>
          </div>
          <p className="text-[8px] text-gray-300 truncate max-w-[200px] ml-5">
            {restaurant.address || "Gourmet Restaurant"}
          </p>
        </button>
      </div>

      {/* Search input section - positioned absolutely when active */}
      <div className={`transition-all duration-500 ease-out ${
        isSearchActive 
          ? 'absolute left-4 right-4 top-1/2 transform -translate-y-1/2 z-10' 
          : 'relative'
      }`}>
        <form onSubmit={handleSearchSubmit} className="SearchBar">
          <div className={`flex items-center ${isSearchActive ? 'px-6 py-6' : 'px-2 py-2'} rounded-xl bg-transparent overflow-hidden transition-all duration-500 ease-out`}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search food, drinks, etc."
              value={searchQuery}
              onChange={handleSearchInput}
              className={`transition-all duration-500 ease-out bg-white text-gray-700 text-base outline-none font-medium rounded-full px-3 py-2 ${
                isSearchActive ? 'w-full opacity-100 pr-4 transform scale-100' : 'w-0 opacity-0 pointer-events-none transform scale-95'
              }`}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
            />
            <div className="flex items-center ml-2">
              {isSearchActive ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="cursor-pointer text-white text-xl flex-shrink-0 transition-all duration-300 ease-out transform hover:scale-110"
                >
                  <X size={20} />
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      {/* Right side - Icons section */}
      <div className={`flex space-x-4 transition-all duration-500 ease-out ${isSearchActive ? 'opacity-20 transform translate-x-2' : 'opacity-100 transform translate-x-0'}`}>
        <button
          type="button"
          onClick={toggleSearch}
          className="cursor-pointer text-white text-xl transition-transform duration-300 ease-out hover:scale-110"
        >
          <Search size={25} />
        </button>
        
        <button onClick={toggleCart} className="relative transition-transform duration-300 ease-out hover:scale-110">
          <ShoppingCart className="w-6 h-6 md:w-9 md:h-9 text-white" />
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </button>
        
        <button onClick={toggleNotifications} className="text-white transition-transform duration-300 ease-out hover:scale-110">
          <Bell className="w-6 h-6 md:w-9 md:h-9" />
        </button>
        
        <button onClick={toggleSidebar} className="text-white transition-transform duration-300 ease-out hover:scale-110">
          <User className="w-6 h-6 md:w-9 md:h-9" />
        </button>
      </div>
    </div>
  );
};

export default Header;