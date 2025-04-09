import { useState } from 'react';
import { 
  Search, 
  Mic, 
  Navigation, 
  ChevronDown, 
  Clock, 
  ShoppingCart, 
  Home, 
  User,
  Package
} from 'lucide-react';

export default function SwiggyApp() {
  return (
    <div className="flex flex-col bg-white min-h-screen max-w-md mx-auto relative">
      {/* Status Bar */}
      <div className="bg-blue-900 flex justify-between items-center px-4 py-2 text-white">
        <div className="text-lg font-semibold">7:22</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">•••</div>
          <div className="flex items-center">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12.5,2.5a10,10,0,0,1,10,10,9.87,9.87,0,0,1-3.21,7.38A1,1,0,0,1,18,20a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42A8,8,0,1,0,4.5,12.5a7.95,7.95,0,0,0,1.69,4.9,1,1,0,0,1-.15,1.4,1,1,0,0,1-1.4-.14A10,10,0,0,1,12.5,2.5Z"/>
            </svg>
          </div>
          <div className="flex items-center justify-center bg-gray-400 rounded-md px-2 text-sm">
            66
          </div>
        </div>
      </div>

      {/* Location Bar */}
      <div className="bg-blue-900 text-white px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Navigation size={24} />
          <div>
            <div className="flex items-center">
              <span className="text-lg font-semibold">Arabic College Post</span>
              <ChevronDown size={20} />
            </div>
            <div className="text-xs text-gray-300 truncate">
              Vyalikaval HBCS Layout, Nagavara, Bengaluru, Karn...
            </div>
          </div>
        </div>
        <div className="bg-gray-700 rounded-full p-2">
          <User size={24} />
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-blue-900">
        <div className="flex items-center bg-white rounded-lg p-2">
          <Search size={20} className="text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search for 'Paneer'" 
            className="flex-1 outline-none text-gray-700 bg-transparent"
          />
          <Mic size={20} className="text-orange-500" />
        </div>
      </div>

      {/* Swiggy Sixes Banner */}
      <div className="bg-blue-900 p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-orange-500 font-bold text-lg">SWIGGY SIXES</div>
            <div className="text-white text-3xl font-bold leading-tight">
              Get 66% off with<br />every SIX hit!
            </div>
            <button className="bg-orange-500 text-white px-4 py-2 rounded-full mt-4 font-bold">
              Explore Now
            </button>
          </div>
          <div>
            <img src="/api/placeholder/160/160" alt="Swiggy Sixes Promotion" className="rounded-full" />
          </div>
        </div>
      </div>

      {/* Category Tiles */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-gray-100">
        {/* Food Delivery */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="font-bold text-gray-800 text-lg">FOOD DELIVERY</div>
          <div className="text-gray-500 text-sm">MATCH TIME, SWIGGY TIME</div>
          <div className="bg-orange-100 text-orange-600 inline-block px-2 py-1 rounded-md my-2 font-bold">
            UP TO 60% OFF
          </div>
          <div className="flex justify-end">
            <img src="/api/placeholder/120/80" alt="Food" className="mt-2" />
          </div>
        </div>

        {/* Instamart */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="font-bold text-gray-800 text-lg">INSTAMART</div>
          <div className="text-gray-500 text-sm">GET ANYTHING INSTANTLY</div>
          <div className="bg-orange-100 text-orange-600 inline-block px-2 py-1 rounded-md my-2 font-bold">
            UP TO ₹100 OFF
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center bg-white rounded-full px-3 py-1 border border-orange-500">
              <Clock size={16} className="text-orange-500 mr-1" />
              <span className="font-bold">14</span>
              <span className="text-gray-500 text-sm ml-1">MINS</span>
            </div>
            <img src="/api/placeholder/120/80" alt="Instamart" className="mt-2" />
          </div>
        </div>

        {/* Dineout */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="font-bold text-gray-800 text-lg">DINEOUT</div>
          <div className="text-gray-500 text-sm">GIRF IS HERE</div>
          <div className="bg-orange-100 text-orange-600 inline-block px-2 py-1 rounded-md my-2 font-bold">
            FLAT 50% OFF
          </div>
          <div className="flex justify-end">
            <img src="/api/placeholder/120/80" alt="Dineout" className="mt-2" />
          </div>
        </div>

        {/* Genie */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="font-bold text-gray-800 text-lg">GENIE</div>
          <div className="text-gray-500 text-sm">SEND PARCELS</div>
          <div className="flex justify-end">
            <img src="/api/placeholder/120/80" alt="Genie" className="mt-2" />
          </div>
        </div>
        
        {/* Scenes */}
        <div className="bg-white rounded-lg p-4 shadow-sm col-span-2">
          <div className="flex items-center">
            <div className="font-bold text-gray-800 text-lg mr-2">SCENES</div>
            <div className="bg-red-500 text-white px-2 py-0 rounded text-xs">
              NEW
            </div>
          </div>
          <div className="text-gray-500 text-sm">CURATED EVENTS</div>
          <div className="flex justify-end">
            <img src="/api/placeholder/120/80" alt="Scenes" className="mt-2" />
          </div>
        </div>
      </div>

      {/* Cricket Timer */}
      <div className="fixed bottom-16 right-4">
        <div className="relative">
          <img src="/api/placeholder/80/80" alt="Cricket ball" className="rounded-full" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold">
            03:13
          </div>
        </div>
        <div className="bg-orange-500 text-white px-2 py-1 rounded-lg text-center mt-1">
          Swiggy Sixes
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 max-w-md mx-auto">
        <div className="flex justify-between items-center px-4">
          <div className="flex flex-col items-center">
            <Home size={24} className="text-orange-500" />
            <span className="text-xs font-medium text-orange-500">Swiggy</span>
          </div>
          <div className="flex flex-col items-center">
            <ShoppingCart size={24} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Food</span>
          </div>
          <div className="flex flex-col items-center">
            <Package size={24} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Instamart</span>
          </div>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 24 24" width="24" height="24" className="text-gray-400">
              <path fill="currentColor" d="M14,10H2V12H14V10M14,6H2V8H14V6M2,16H10V14H2V16M21.5,11.5L23,13L16,20L11.5,15.5L13,14L16,17L21.5,11.5Z" />
            </svg>
            <span className="text-xs font-medium text-gray-500">Dineout</span>
          </div>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 24 24" width="24" height="24" className="text-gray-400">
              <path fill="currentColor" d="M20,11H4V12H20V11M20,7H4V8H20V7M20,15H4V16H20V15Z" />
            </svg>
            <span className="text-xs font-medium text-gray-500">Genie</span>
          </div>
          <div className="flex flex-col items-center">
            <ShoppingCart size={24} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Reorder</span>
          </div>
        </div>
      </div>
    </div>
  );
}