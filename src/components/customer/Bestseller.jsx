import React, { useState, useMemo, useCallback, memo, lazy } from "react";
import { ShoppingBag, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../config/CartContent";
import { useLikes } from "../../config/LikesContent";
import OrderCard from './itemCard';
import { useRef } from "react";
import { LazyImage } from "../../utils/imageOptimization";

const BestSellers = ({ foodItems }) => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);

  const handleViewAll = () => {
    navigate('/best-sellers');
  };

  const handleOpenItemCard = (item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
  };

  const handleCloseItemCard = () => {
    setIsOrderCardOpen(false);
    setSelectedItem(null);
  };

  const PriceDisplay = ({ item }) => {
    const discountedPrice = useMemo(() => {
      if (!item.discounttype || !item.discountvalue) return item.price;
      return item.discounttype === 'Percentage'
        ? (item.price - (item.price * (item.discountvalue / 100)))
        : Math.max(0, item.price - item.discountvalue);
    }, [item.price, item.discounttype, item.discountvalue]);

    return (
      <div className="flex items-center space-x-1 mt-0.5">
        {item.discounttype && item.discountvalue ? (
          <>
            <span className="text-[10px] text-gray-400 line-through">
              ₹{Number(item.price).toFixed(0)}
            </span>
            <span className="text-sm font-bold text-orange-600">
              ₹{discountedPrice.toFixed(0)}
            </span>
            <span className="text-[9px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">
              {item.discounttype === 'Percentage'
                ? `${item.discountvalue}% OFF`
                : `₹${item.discountvalue} OFF`}
            </span>
          </>
        ) : (
          <span className="text-sm font-bold text-gray-900">
            ₹{Number(item.price).toFixed(0)}
          </span>
        )}
      </div>
    );
  };

  const FoodItem = memo(({ item, onItemClick, index = 0 }) => {
    const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
    const { toggleLike, likedItems } = useLikes();
    const cartItem = useMemo(() => cartItems.find(i => i.id === item.id), [cartItems, item.id]);
    const quantity = cartItem?.quantity || 0;
    const isLiked = useMemo(() => likedItems.some(likedItem => likedItem.id === item.id), [likedItems, item.id]);

    const handleAddClick = useCallback(() => addToCart(item), [addToCart, item]);
    const handleIncrement = useCallback(() => addToCart(item), [addToCart, item]);
    const handleDecrement = useCallback(() => {
      if (quantity === 1) {
        removeItem(item.id, item.category);
      } else {
        updateQuantity(item.id, item.category, quantity - 1);
      }
    }, [quantity, removeItem, updateQuantity, item.id, item.category]);

    // Helper for the discount tag
    const DiscountTag = () =>
      item.discounttype && item.discountvalue ? (
        <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
          {item.discounttype === 'Percentage'
            ? `${item.discountvalue}% OFF`
            : `₹${item.discountvalue} OFF`}
        </span>
      ) : null;

    // Helper for the price display
    const discountedPrice = useMemo(() => {
      if (!item.discounttype || !item.discountvalue) return item.price;
      return item.discounttype === 'Percentage'
        ? (item.price - (item.price * (item.discountvalue / 100)))
        : Math.max(0, item.price - item.discountvalue);
    }, [item.price, item.discounttype, item.discountvalue]);

    return (
      <motion.div
        className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100 min-w-[140px] max-w-[150px] flex flex-col"
        style={{ transform: 'translateZ(0)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <div className="relative h-28 overflow-hidden bg-gray-100">
          <LazyImage
            src={item.image}
            alt={item.name}
            category={item.category}
            className="w-full h-full object-cover"
            onClick={() => onItemClick && onItemClick(item)}
          />
          <button 
            className="absolute top-2 left-2 bg-white/70 rounded-full p-1 z-10"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(item);
            }}
          >
            <Heart 
              className={`h-4 w-4 md:w-6 md:h-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-500'}`}
            />
          </button>
        </div>
        <div className="flex flex-col flex-1 justify-between py-1 px-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
              <div className="flex items-center space-x-1">
                {item.discounttype && item.discountvalue ? (
                  <>
                    <span className="text-[10px] text-gray-400 line-through">
                      ₹{Number(item.price).toFixed(0)}
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      ₹{discountedPrice.toFixed(0)}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-gray-900">
                    ₹{Number(item.price).toFixed(0)}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-1">
              {quantity > 0 ? (
                <div className="flex items-center bg-black/90 text-white rounded-full px-2 py-0.5 shadow">
                  <button
                    onClick={handleDecrement}
                    className="text-white px-1 text-xs"
                  >−</button>
                  <span className="px-1 text-xs">{quantity}</span>
                  <button
                    onClick={handleIncrement}
                    className="text-white px-1 text-xs"
                  >+</button>
                </div>
              ) : (
                <button
                  onClick={handleAddClick}
                  className="bg-black/90 hover:bg-gray-800 text-white rounded-full px-2 py-0.5 flex items-center space-x-1 text-xs shadow"
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>Add</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-1">
            <DiscountTag />
          </div>
        </div>
      </motion.div>
    );
  });

  return (
    <div className="mt-6 px-1 text-black">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-thick font-spartan-bold md:text-3xl">Best Seller</h2>
        <button 
          onClick={handleViewAll}
          className="text-orange-500 text-sm flex items-center md:text-xl hover:underline"
        >
          View All <span className="ml-1 md:text-xl">›</span>
        </button>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-2 scroll-smooth ">
        {foodItems.map((item, index) => (
          <FoodItem 
            key={item.id}
            item={item}
            onItemClick={handleOpenItemCard}
            index={index}
          />
        ))}
      </div>
      <OrderCard isOpen={isOrderCardOpen} onClose={handleCloseItemCard} item={selectedItem} />
    </div>
  );
};

export default BestSellers;