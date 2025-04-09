import React from 'react';
import { useState } from 'react';
import { Sandwich, UtensilsCrossed, CupSoda, IceCream, Tag } from 'lucide-react';
import sushiImg from '../../Photos/Sushi.jpg';
import curryImg from '../../Photos/chickencurry.jpg';
import lasagnaImg from '../../Photos/lasagna.jpg';
import cupcakeImg from '../../Photos/cupcake.jpg';
import burgerImg from '../../Photos/Burger.jpg';
import pancakeImg from '../../Photos/pancakes.jpg';
import profileImg from '../../Photos/pancakes.jpg';
import Maincarosel from '../../components/HomeCarosel/Maincarosel';
import { 
  ShoppingCart, 
  Bell, 
  User, 
  Home, 
  Coffee, 
  Heart, 
  ClipboardList, 
  Headphones,
  Search,
  X,
  ShoppingBag,
  CreditCard,
  Phone,
  HelpCircle,
  Settings,
  LogOut
} from 'lucide-react';

const FoodItem = ({ image, name, price }) => (
  <div className="min-w-[150px] rounded-xl overflow-hidden relative shadow group">
    <img src={image} alt={name} className="w-full h-24 object-cover" />
    <div className="absolute bottom-0 font-bold justify-center left-1/2 transform -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-in-out bg-black bg-opacity-60 pt-100 rounded-xl">
      <span className="text-white text-xs font-small">{name}</span>
    </div>
    <div className="absolute top-1 right-1 bg-orange-600 bg-opacity-90 px-2 py-1 rounded-md">
      <span className="text-white text-xs font-semibold">₹{price}</span>
    </div>
  </div>
);

const categories = [
    { name: 'Snacks', icon: <Sandwich className="w-6 h-6" color="gray" /> },
    { name: 'Main Course',icon: <UtensilsCrossed className="w-6 h-6" color="gray" /> },
    { name: 'Beverages',icon: <CupSoda className="w-6 h-6" color="gray" /> },
    { name: 'Dessert',icon: <IceCream className="w-6 h-6" color="gray" /> },
    { name: 'Offers',icon: <Tag className="w-6 h-6" color="gray" /> },
];

// Profile sidebar menu options
const menuOptions = [
  { name: 'My Orders', icon: <ShoppingBag className="w-6 h-6" /> },
  { name: 'My Profile', icon: <User className="w-6 h-6" /> },
  { name: 'Payment Methods', icon: <CreditCard className="w-6 h-6" /> },
  { name: 'Contact Us', icon: <Phone className="w-6 h-6" /> },
  { name: 'Help & FAQs', icon: <HelpCircle className="w-6 h-6" /> },
  { name: 'Settings', icon: <Settings className="w-6 h-6" /> },
];

export default function Homepage() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSearch = () => {
    setIsSearchActive(!isSearchActive);
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Custom image component that adds a food-like overlay to placeholder images
  const FoodImage = ({ src, alt, className, foodType }) => {
    const overlayStyles = {
      sushi: "bg-gradient-to-br from-pink-200 to-orange-300 opacity-30",
      curry: "bg-gradient-to-br from-yellow-200 to-amber-500 opacity-30",
      lasagna: "bg-gradient-to-br from-red-300 to-orange-400 opacity-30",
      cupcake: "bg-gradient-to-br from-pink-200 to-purple-300 opacity-30",
      burger: "bg-gradient-to-br from-amber-300 to-emerald-100 opacity-30",
      springRolls: "bg-gradient-to-br from-amber-100 to-lime-200 opacity-30",
      pizza: "bg-gradient-to-br from-red-400 to-yellow-300 opacity-30"
    };

    return (
      <div className={`${className} relative overflow-hidden`}>
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className={`absolute inset-0 ${overlayStyles[foodType] || ''}`}></div>
      </div>
    );
  };

  return (
    <div className="bg-black text-white font-leagueSpartan min-h-screen max-w-md mx-auto relative overflow-hidden">
      
      {/* Profile Sidebar */}
      <div 
        className={`fixed top-1 right-0 h-full w-full md:w-[30px] bg-black z-50 transform transition-all duration-300 ease-in-out rounded-l-[80px] ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          borderLeft: '1px solid rgb(103, 109, 116)',
          maxWidth: '290px',
          boxShadow: isSidebarOpen ? '-8px 0 25px rgba(0, 0, 0, 0.4)' : 'none',
          overflowY: 'auto',
          scrollbarWidth: 'thin'
        }}
      >
        {/* Close Button */}
        {/* <button 
          onClick={toggleSidebar}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-800 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button> */}

        {/* Profile Header */}
        <div className="pt-16 pb-6 px-6 flex flex-col items-center border-b border-gray-800">
          <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-purple-500">
            <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-white">Vishal Panwar</h2>
          <p className="text-gray-400 text-sm mt-1">Vishalpanwar416@gmail.com</p>
        </div>
        
        {/* Menu Options */}
        <div className="py-4">
          {menuOptions.map((option, index) => (
            <div key={index}>
              <button 
                className="w-full py-3 px-6 flex items-center text-left hover:bg-gray-800 transition-colors duration-200 group"
                onClick={() => console.log(`Clicked ${option.name}`)}
              >
                <div className="bg-gray-700 rounded-full p-3 mr-4 group-hover:bg-purple-500 transition-colors">
                  {React.cloneElement(option.icon, { className: "w-5 h-5 text-gray-300 group-hover:text-white" })}
                </div>
                <span className="text-lg text-gray-300 group-hover:text-white">{option.name}</span>
              </button>
              <div className="h-px bg-white mx-6 last:hidden"></div>
            </div>
          ))}
        </div>
       
        {/* Logout Option */}
        <div className="mt-8 mb-6">
          <button 
            className="w-full pz-5 px-20 flex items-center text-left hover:bg-gray-800 transition-colors duration-200 group"
            onClick={() => console.log('Logged out')}
          >
            <div className="bg-gray-700 rounded-full p-3 mr-4 group-hover:bg-red-500 transition-colors">
              <LogOut className="w-5 h-5 text-gray-300 group-hover:text-white" />
            </div>
            <span className="text-lg text-gray-300 group-hover:text-white">Log Out</span>
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Unified Search Bar with Animated Icons */}
      <div className="px-4 pt-4 flex justify-between items-center">
        <div className="relative flex-1 mr-4">
        <div className="SearchBar flex items-center justify-left px-2 py-2 rounded-xl bg-transparent overflow-hidden">
            <input type="text"
                   placeholder=" Search"
                   className={`transition-all duration-700 ease-in-out bg-white text-gray-700 text-base outline-none font-medium rounded-full px-3 py-2 ${
                   isSearchActive ? 'max-w-full opacity-100 pr-4' : 'max-w-0 opacity-0'
                }`}
                />
            <div onClick={toggleSearch} className="cursor-pointer text-white text-xl ml-2">
                {isSearchActive ? <X size={20} /> : <Search size={20} />}
            </div>
        </div>

        </div>
        <div className={`flex space-x-3 transition-all duration-500 ${isSearchActive ? 'translate-x-5 opacity-30' : ''}`}>
          <ShoppingCart className="w-6 h-6" />
          <Bell className="w-6 h-6" />
          <div>
            <button onClick={toggleSidebar}>
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Greeting */}
      <div className="px-4 mt-2">
        <h1 className="text-3xl font-bold" style={{fontFamily: 'League Spartan, sans-serif'}}>Good Morning</h1>
        <div className="h-1 w-48 bg-blue-500 mt-1"></div>
      </div>

      {/* Promotion Banner */}
      <div style={{justifyContent:"center",padding:"5px", marginTop:"10px"}}>
        <Maincarosel/>
      </div>

      {/* Categories */}
      <div className="mt-4 bg-white rounded-t-[30px] rounded-b-none p-6">
        <div className="flex justify-between">
          {categories.map((category, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="bg-orange-100 text-orange-600 rounded-3xl px-4 py-3 shadow-md hover:bg-orange-200 transition-all flex items-center justify-center w-16 h-16">
                {category.icon}
              </div>
              <span className="text-black text-xs mt-2">{category.name}</span>
            </div>
          ))}
        </div>
        <div className="my-4 w-full mx-auto h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent"></div>

      {/* Best Sellers */}
      <div className="mt-6 px-4 text-black">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Best Seller</h2>
          <button className="text-orange-500 text-sm flex items-center hover:underline">
            View All <span className="ml-1">›</span>
          </button>
        </div>
        <div className="flex space-x-4 overflow-x-auto pb-2 scroll-smooth ">
          <FoodItem image={sushiImg} name="Sushi Platter" price={499}  />
          <FoodItem image={curryImg} name="Chicken Curry" price={389} />
          <FoodItem image={lasagnaImg} name="Lasagna" price={199} />
          <FoodItem image={cupcakeImg} name="Cupcake" price={170} />
        </div>
      </div>
      <div className="my-4 w-full mx-auto h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent"></div>
      {/* Recommendations */}
      <div className="mt-6 px-4 pb-20 text-black">
        <h2 className="text-lg font-semibold mb-3">Recommend</h2>
        <div className="flex space-x-3">
          {/* Burger Card */}
          <div className="relative rounded-lg overflow-hidden flex-1">
            <FoodImage 
              src={burgerImg} 
              alt="Chicken Burger" 
              className="w-full h-32 object-cover" 
              foodType="burger" 
            />
            <button className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-1">
              <Heart className="h-4 w-4 text-gray-500" />
            </button>
            <div className="absolute bottom-2 right-2 bg-orange-500 px-2 py-1 rounded-md">
              <span className="text-white text-xs">169</span>
            </div>
          </div>

          {/* Spring Rolls Card */}
          <div className="relative rounded-lg overflow-hidden flex-1">
            <FoodImage 
              src={pancakeImg} 
              alt="Spring Rolls" 
              className="w-full h-32 object-cover" 
              foodType="pancake" 
            />
            <button className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-1">
              <Heart className="h-4 w-4 text-gray-500" />
            </button>
            <div className="absolute bottom-2 right-2 bg-orange-500 px-2 py-1 rounded-md">
              <span className="text-white text-xs">329</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3 pt-2">
          {/* Burger Card */}
          <div className="relative rounded-lg overflow-hidden flex-1">
            <FoodImage 
              src={burgerImg} 
              alt="Chicken Burger" 
              className="w-full h-32 object-cover" 
              foodType="burger" 
            />
            <button className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-1">
              <Heart className="h-4 w-4 text-gray-500" />
            </button>
            <div className="absolute bottom-2 right-2 bg-orange-500 px-2 py-1 rounded-md">
              <span className="text-white text-xs">169</span>
            </div>
          </div>

          {/* Spring Rolls Card */}
          <div className="relative rounded-lg overflow-hidden flex-1">
            <FoodImage 
              src={pancakeImg} 
              alt="Spring Rolls" 
              className="w-full h-32 object-cover" 
              foodType="pancake" 
            />
            <button className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-1">
              <Heart className="h-4 w-4 text-gray-500" />
            </button>
            <div className="absolute bottom-2 right-2 bg-orange-500 px-2 py-1 rounded-md">
              <span className="text-white text-xs">329</span>
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Bottom Navigation */}
      {/* <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-3 max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <button 
            className={`flex flex-col items-center ${activeTab === 'home' ? 'text-white' : 'text-gray-500'}`}
            onClick={() => setActiveTab('home')}
          >
            <Home className="h-6 w-6" />
          </button>
          <button 
            className={`flex flex-col items-center ${activeTab === 'menu' ? 'text-white' : 'text-gray-500'}`}
            onClick={() => setActiveTab('menu')}
          >
            <Coffee className="h-6 w-6" />
          </button>
          <button 
            className={`flex flex-col items-center ${activeTab === 'favorites' ? 'text-white' : 'text-gray-500'}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart className="h-6 w-6" />
          </button>
          <button 
            className={`flex flex-col items-center ${activeTab === 'orders' ? 'text-white' : 'text-gray-500'}`}
            onClick={() => setActiveTab('orders')}
          >
            <ClipboardList className="h-6 w-6" />
          </button>
          <button 
            className={`flex flex-col items-center ${activeTab === 'support' ? 'text-white' : 'text-gray-500'}`}
            onClick={() => setActiveTab('support')}
          >
            <Headphones className="h-6 w-6" />
          </button>
        </div>
      </div> */}
    </div>
    </div>
  );
}