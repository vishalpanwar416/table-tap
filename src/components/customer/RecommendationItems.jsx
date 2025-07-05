import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../config/CartContent';
import { useLikes } from '../../config/LikesContent';
import { LazyImage } from '../../utils/imageOptimization';
import { motion } from 'framer-motion';
import { useMemo, useCallback, memo, useState } from 'react';
import OrderCard from './itemCard';

const RecommendationItem = memo(({ item, onImageClick, index = 0 }) => {
  const { toggleLike, likedItems } = useLikes();
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  
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
      <span className="text-sm bg-green-100 text-green-700 font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
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
      className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100 w-[280px] h-[320px] flex flex-col"
      style={{ transform: 'translateZ(0)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className="relative h-48 overflow-hidden bg-gray-100 flex-shrink-0">
        <LazyImage
          src={item.image}
          alt={item.name}
          category={item.category}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => onImageClick && onImageClick(item)}
        />
        <button 
          className="absolute top-4 left-4 bg-white/70 rounded-full p-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(item);
          }}
        >
          <Heart 
            className={`h-6 w-6 md:w-7 md:h-7 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-500'}`}
          />
        </button>
      </div>
      <div className="flex flex-col flex-1 justify-between py-3 px-4 min-h-0">
        <div className="flex items-start justify-between flex-1">
          <div className="flex-1 min-w-0 mr-3">
            <h4 className="text-base font-bold text-gray-900 truncate mb-2 leading-tight">{item.name}</h4>
            <div className="flex items-center space-x-2">
              {item.discounttype && item.discountvalue ? (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    ₹{Number(item.price).toFixed(0)}
                  </span>
                  <span className="text-lg font-bold text-orange-600">
                    ₹{discountedPrice.toFixed(0)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  ₹{Number(item.price).toFixed(0)}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {quantity > 0 ? (
              <div className="flex items-center bg-black/90 text-white rounded-full px-4 py-2 shadow">
                <button
                  onClick={handleDecrement}
                  className="text-white px-2 text-base font-bold"
                >−</button>
                <span className="px-3 text-base">{quantity}</span>
                <button
                  onClick={handleIncrement}
                  className="text-white px-2 text-base font-bold"
                >+</button>
              </div>
            ) : (
              <button
                onClick={handleAddClick}
                className="bg-black/90 hover:bg-gray-800 text-white rounded-full px-4 py-2 flex items-center space-x-2 text-base shadow"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-end mt-3 flex-shrink-0">
          <DiscountTag />
        </div>
      </div>
    </motion.div>
  );
});

RecommendationItem.displayName = 'RecommendationItem';

const RecommendationItems = ({ allFoodItems = [], onItemClick, scrollRef, scroll }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);
  
  if (allFoodItems.length === 0) return null;

  const handleOpenItemCard = (item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
  };

  const handleCloseItemCard = () => {
    setIsOrderCardOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="px-1 pb-2 text-black flex-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-thick font-spartan-bold md:text-3xl">Our Best Recommendations</h2>
        <button 
          onClick={() => scroll(scrollRef.current?.clientWidth || 300)}
          className="p-2 rounded-full bg-white text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 md:pb-0"
        style={{ minHeight: allFoodItems.length > 0 ? 'auto' : '0' }}
      >
        {allFoodItems.map((item, index) => (
          <div 
            key={item.id}
            className="flex-shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            <RecommendationItem 
              item={item} 
              onImageClick={handleOpenItemCard} 
              index={index}
            />
          </div>
        ))}
      </div>
      <OrderCard
        isOpen={isOrderCardOpen}
        onClose={handleCloseItemCard}
        item={selectedItem}
      />
    </div>
  );
};

export default RecommendationItems;