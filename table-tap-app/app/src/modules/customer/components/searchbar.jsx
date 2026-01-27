import React from 'react';
import { FaShoppingCart, FaBell, FaUser, FaSlidersH } from 'react-icons/fa';

const DashboardHeader = () => {
  return (
    <div className="bg-black text-white p-4 flex flex-col gap-4">
      {/* Top Row: Search + Icons */}
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search"
            className="w-full py-2 px-4 pr-10 rounded-full text-black focus:outline-none"
          />
          <FaSlidersH className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black" />
        </div>

        {/* Icons */}
        <div className="flex items-center gap-3 ml-4">
          <div className="bg-white text-black p-2 rounded-full cursor-pointer">
            <FaShoppingCart />
          </div>
          <div className="bg-white text-black p-2 rounded-full cursor-pointer">
            <FaBell />
          </div>
          <div className="bg-white text-black p-2 rounded-full cursor-pointer">
            <FaUser />
          </div>
        </div>
      </div>

      {/* Greeting Text */}
      <div>
        <h2 className="text-2xl font-bold">Good Morning</h2>
        {/* Optional subtext can go here */}
      </div>
    </div>
  );
};

export default DashboardHeader;
