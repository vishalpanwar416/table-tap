import React, { useRef, useEffect, useState } from 'react';
import { Search, X, ShoppingCart, Bell, User } from 'lucide-react';
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

  return (
    <div className="px-4 flex justify-between items-center w-full">
      {/* Search input section */}
      <div className="relative flex-1 mr-2">
        <form onSubmit={handleSearchSubmit} className="SearchBar">
          <div className={`flex items-center ${isSearchActive ? 'px-6 py-6' : 'px-2 py-2'} rounded-xl bg-transparent overflow-hidden transition-all`}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search food, drinks, etc."
              value={searchQuery}
              onChange={handleSearchInput}
              className={`transition-all duration-700 ease-in-out bg-white text-gray-700 text-base outline-none font-medium rounded-full px-3 py-2 ${
                isSearchActive ? 'max-w-full opacity-100 pr-4' : 'max-w-0 opacity-0'
              }`}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
            />
            <div className="flex items-center ml-2">
              {isSearchActive ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="cursor-pointer text-white text-xl"
                >
                  <X size={20} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleSearch}
                  className="cursor-pointer text-white text-xl"
                >
                  <Search size={25} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Restaurant name styled like in PaymentPage */}
      <div className={`flex-1 text-center transition-all duration-500 ${isSearchActive ? 'opacity-0 pointer-events-none transform -translate-y-2' : 'opacity-100 transform translate-y-0'}`}>
        <div className="flex flex-col items-center justify-center mr-4">
          <h2 className="text-white text-[17px] font-spartan">{restaurant.name}</h2>
          <p className="text-[8px] text-gray-300">{restaurant.address || "Gourmet Restaurant"}</p>
        </div>
      </div>

      {/* Icons section */}
      <div className={`flex space-x-4 transition-all duration-300 ${isSearchActive ? 'translate-x-4 opacity-30' : ''}`}>
        <button onClick={toggleCart} className="relative">
          <ShoppingCart className="w-6 h-6  md:w-9 md:h-9 text-white" />
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </button>
        <button onClick={toggleNotifications} className="text-white">
          <Bell className="w-6 h-6 md:w-9 md:h-9" />
        </button>
        <button onClick={toggleSidebar} className="text-white">
          <User className="w-6 h-6  md:w-9 md:h-9" />
        </button>
      </div>
    </div>
  );
};

export default Header;