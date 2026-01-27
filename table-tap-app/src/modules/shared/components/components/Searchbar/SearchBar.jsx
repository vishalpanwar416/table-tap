import React, { useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

const SearchBar = () => {
  const [isActive, setIsActive] = useState(false);

  const toggleSearch = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="SearchBar flex items-center justify-left px-6 py-3 rounded-xl bg-transparent shadow-md ">
      <input
        type="text"
        placeholder=" Search"
        className={`transition-all duration-500 ease-in-out bg-white text-gray-700 text-base outline-none font-medium rounded-xl justify-right ${
          isActive ? 'w-600 pr-4' : 'w-0'
        }`}
      />
      <div onClick={toggleSearch} className="cursor-pointer text-gray-400 text-xl ml-2">
        {isActive ? <FaTimes /> : <FaSearch />}
      </div>
    </div>
  );
};

export default SearchBar;
