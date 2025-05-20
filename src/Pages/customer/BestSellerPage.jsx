
import React, { useState, useRef, useEffect } from 'react';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import Header from '../../components/customer/Header';
import Sidebar from '../../components/customer/Slidebar';
import CartSidebar from '../../components/customer/CartSidebar';
import NotificationSidebar from '../../components/customer/NotificationSlidebar';
import { profileImg } from '../../assets/images/Food/Index';
import { useCart } from '../../config/CartContent';
import { useNavigate } from 'react-router-dom';
import { useLikes } from '../../config/LikesContent';
import LogoutPopup from '../../components/auth/LogoutPopup';
import { fetchFoodItems } from '../../components/foodData';

const BestSellerItem = ({ image, name, price, description, item }) => {
  const { toggleLike, likedItems } = useLikes();
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const cartItem = cartItems.find(i => i.id === item.id);
  const quantity = cartItem?.quantity || 0;
  const isLiked = likedItems.some(likedItem => likedItem.id === item.id);

  const handleDecrement = () => {
    if (quantity === 1) {
      removeItem(item.id, item.category);
    } else {
      updateQuantity(item.id, item.category, quantity - 1);
    }
  };
  return (
    <div className="relative h-full flex flex-col group hover:shadow-lg transition-shadow">
      <div className="relative rounded-xl overflow-hidden mb-2 flex-1 aspect-square">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
        
        <button 
          className="absolute top-2 right-2 bg-white/80 rounded-full p-1.5 backdrop-blur-sm hover:bg-white transition-colors"
          onClick={() => toggleLike(item)}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
        </button>

        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2.5 py-1 rounded-lg">
          ₹{Number(price).toFixed(2)}
        </div>
      </div>
      
      <div className="text-black space-y-1">
        <h3 className="font-medium text-sm md:text-base">{name}</h3>
        <div className="flex justify-between items-center">
          <p className="text-[10px] md:text-xs text-gray-600 line-clamp-2 pr-2">
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

const BestSellerPage = () => {
  const [bestSellerItems, setBestSellerItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchFoodItems();
      setBestSellerItems(data.filter(item => 
        item.tags?.some(tag => tag.toLowerCase() === 'bestseller')
      ));
      setLoading(false);
    };
    loadData();
  }, []);

  const toggle = {
    sidebar: () => setIsSidebarOpen(!isSidebarOpen),
    cart: () => setIsCartOpen(!isCartOpen),
    search: () => setIsSearchActive(!isSearchActive),
    notification: () => setIsNotificationOpen(!isNotificationOpen),
  };

  if (loading) {
    return <div className="text-white text-center p-4">Loading best sellers...</div>;
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-black p-4">
      <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl h-screen flex flex-col">
        
      <LogoutPopup 
          isOpen={isLogoutOpen}
          onClose={() => setIsLogoutOpen(false)}
          onConfirm={() => {
            navigate('/home');
            setIsLogoutOpen(false);
            setIsSidebarOpen(false);
          }
        }
        />
        
        <Header 
          isSearchActive={isSearchActive}
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
          onLogout={() => setIsLogoutOpen(true)}
        />

        <CartSidebar
          isOpen={isCartOpen}
          onClose={toggle.cart}
          cartItems={cartItems}
        />
          {isNotificationOpen && (
           <NotificationSidebar 
             isOpen={isNotificationOpen}
             onClose={toggle.notification}
            />
          )}

        <div className="pt-4 md:pt-6 pb-6 relative">
          <h1 className="text-3xl md:text-3xl text-center text-white font-spartan-medium">
            Best Seller
          </h1>
        </div>

        <div 
          ref={containerRef}
          className="bg-white rounded-3xl p-4 md:p-6 flex-1 flex flex-col min-h-[calc(100vh-200px)] overflow-y-auto shadow-xl"
        >
          <p className="justify-center text-center text-black font-medium text-lg md:text-xl mb-4 md:mb-6 font-spartan-medium">
            Discover our most popular dishes!
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {bestSellerItems.map((item) => (
              <div key={item.id} className="aspect-square md:aspect-[1/1.1]">
                <BestSellerItem {...item} item={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestSellerPage;