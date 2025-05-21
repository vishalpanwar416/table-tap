import React, { useState, useRef, useEffect } from 'react';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import Header from '../../components/customer/Header';
import Sidebar from '../../components/customer/Slidebar';
import CartSidebar from '../../components/customer/CartSidebar';
import { profileImg } from '../../assets/images/Food/Index';
import { useCart } from '../../config/CartContent';
import { useNavigate } from 'react-router-dom';
import { useLikes } from '../../config/LikesContent';
import NotificationSidebar from '../../components/customer/NotificationSlidebar';
import OrderCard from '../../components/customer/itemCard';

const LikedItem = ({ image, name, price, description, item, onImageClick }) => {
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const { toggleLike, likedItems } = useLikes();
  const cartItem = cartItems.find(i => i.id === item.id);
  const quantity = cartItem?.quantity || 0;
  const isLiked = likedItems.some(li => li.id === item.id);

  const handleDecrement = () => {
    quantity === 1 ? removeItem(item.id, item.category) : updateQuantity(item.id, item.category, quantity - 1);
  };

  return (
    <div className="relative h-full flex flex-col group hover:shadow-lg transition-shadow">
      <div className="relative rounded-xl overflow-hidden mb-2 flex-1 aspect-square">
        {/* Offer Badge */}
        {item.discounttype && item.discountvalue ? (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg font-semibold shadow-lg z-10">
            {item.discounttype === 'Percentage'
              ? `${item.discountvalue}% off`
              : `₹${item.discountvalue} off`
            }
          </div>
        ) : null}

        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => onImageClick(item)}
        />
        
        <button 
          className="absolute top-2 right-2 bg-white/80 rounded-full p-1.5 backdrop-blur-sm hover:bg-white transition-colors"
          onClick={() => toggleLike(item)}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
        </button>

        {/* Price Tag */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2.5 py-1 rounded-lg flex flex-col items-end">
          {item.discounttype && item.discountvalue ? (
            <>
              <span className="line-through text-gray-300 mr-1 whitespace-nowrap">₹{Number(item.price).toFixed(2)}</span>
              <span className="text-orange-400 font-semibold whitespace-nowrap">
                ₹{item.discounttype === 'Percentage'
                  ? (item.price - (item.price * (item.discountvalue / 100))).toFixed(2)
                  : Math.max(0, item.price - item.discountvalue).toFixed(2)
                }
              </span>
            </>
          ) : (
            <span className="font-semibold whitespace-nowrap text-white">₹{Number(item.price).toFixed(2)}</span>
          )}
        </div>
      </div>
      
      <div className="text-black space-y-1 mt-2">
        <h3 className="font-medium text-sm md:text-base line-clamp-1">{name}</h3>
        <div className="flex justify-between items-center">
          <p className="text-[10px] md:text-xs text-gray-600 line-clamp-2 pr-2 flex-1">
            {description}
          </p>
          
          {quantity > 0 ? (
            <div className="flex items-center bg-black/90 rounded-lg px-2 py-1 gap-2">
              <button 
                onClick={handleDecrement}
                className="text-white text-xs md:text-sm hover:bg-black/80 px-1 rounded"
              >
                -
              </button>
              <span className="text-white text-xs md:text-sm">{quantity}</span>
              <button 
                onClick={() => addToCart(item)}
                className="text-white text-xs md:text-sm hover:bg-black/80 px-1 rounded"
              >
                +
              </button>
            </div>
          ) : (
            <button 
              className="bg-black/90 hover:bg-black p-1.5 rounded-lg transition-colors"
              onClick={() => addToCart(item)}
            >
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const LikedItemsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const { likedItems, loading } = useLikes();
  const containerRef = useRef(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);

  // No need to filter from allFoodItems, we can use the likedItems directly
  const likedFoodItems = likedItems;

  // For debugging
  useEffect(() => {
    console.log("likedItems from context:", likedItems);
    console.log("likedFoodItems to display:", likedFoodItems);
  }, [likedItems]);

  const toggle = {
    sidebar: () => setIsSidebarOpen(!isSidebarOpen),
    cart: () => setIsCartOpen(!isCartOpen),
    search: () => setIsSearchActive(!isSearchActive),
    notification: () => setIsNotificationOpen(!isNotificationOpen),
  };

  const handleImageClick = (item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-black p-4">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        <Header 
          iisSearchActive={isSearchActive}
          toggleSearch={toggle.search}
          toggleSidebar={toggle.sidebar}
          toggleNotifications={toggle.notification}
          toggleCart={toggle.cart}
          cartItems={cartItems}
          className="mb-2 md:mb-3"
        />

        <button 
          className="absolute left-4 top-7 md:left-8 md:top-8 text-orange-500 hover:text-orange-600 transition-colors z-10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={30} className="md:w-8 md:h-8" />
        </button>

        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggle.sidebar}
          profileImg={profileImg}
          userName="Vishal Panwar"
          userEmail="Vishalpanwar416@gmail.com"
        />

        {isNotificationOpen && (
          <NotificationSidebar 
            isOpen={isNotificationOpen}
            onClose={toggle.notification}
          />
        )}

        <CartSidebar
          isOpen={isCartOpen}
          onClose={toggle.cart}
          cartItems={cartItems}
        />

        <div className="pt-4 md:pt-6 pb-6 relative">
          <h1 className="text-3xl md:text-3xl text-center text-white font-spartan-medium">
            Liked Items
          </h1>
        </div>

        <div 
          ref={containerRef}
          className="bg-white rounded-3xl p-4 md:p-6 flex-1 flex flex-col min-h-[calc(100vh-200px)] overflow-y-auto shadow-xl"
        >
          <p className="justify-center text-center text-black font-medium text-lg md:text-xl mb-4 md:mb-6 font-spartan-medium">
              It's time to buy your favorite dish.
          </p>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p>Loading your liked items...</p>
            </div>
          ) : likedFoodItems.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64">
              <Heart className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">You haven't liked any items yet.</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {likedFoodItems.map((item) => (
                <div key={item.id} className="aspect-square">
                  <LikedItem {...item} item={item} onImageClick={handleImageClick} />
                </div>
              ))}
            </div>
          )}
          <OrderCard
            isOpen={isOrderCardOpen}
            onClose={() => setIsOrderCardOpen(false)}
            item={selectedItem}
          />
        </div>
      </div>
    </div>
  );
};

export default LikedItemsPage;