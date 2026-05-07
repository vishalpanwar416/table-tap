import React, { memo, useCallback, useMemo } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../../shared/config/CartContent';
import { useLikes } from '../../shared/config/LikesContent';
import { LazyImage } from '../../shared/utils/imageOptimization';

const OptimizedFoodItem = memo(
  ({
    item,
    onImageClick,
    showDescription = true,
    className = '',
    variant = 'default', // "default", "compact", "featured"
  }) => {
    const { toggleLike, likedItems } = useLikes();
    const { cartItems, addToCart, updateQuantity, removeItem } = useCart();

    // Memoize expensive calculations
    const cartItem = useMemo(() => cartItems.find((i) => i.id === item.id), [cartItems, item.id]);

    const quantity = cartItem?.quantity || 0;

    const isLiked = useMemo(
      () => likedItems.some((likedItem) => likedItem.id === item.id),
      [likedItems, item.id],
    );

    // Memoize handlers
    const handleDecrement = useCallback(() => {
      if (quantity === 1) {
        removeItem(item.id, item.category);
      } else {
        updateQuantity(item.id, item.category, quantity - 1);
      }
    }, [quantity, removeItem, updateQuantity, item.id, item.category]);

    const handleAddToCart = useCallback(() => {
      addToCart(item);
    }, [addToCart, item]);

    const handleToggleLike = useCallback(() => {
      toggleLike(item);
    }, [toggleLike, item]);

    // Memoize price calculations
    const priceInfo = useMemo(() => {
      const originalPrice = Number(item.price).toFixed(2);

      if (!item.discounttype || !item.discountvalue) {
        return { finalPrice: originalPrice, isDiscounted: false };
      }

      let finalPrice;
      if (item.discounttype === 'Percentage') {
        finalPrice = (item.price - item.price * (item.discountvalue / 100)).toFixed(2);
      } else {
        finalPrice = Math.max(0, item.price - item.discountvalue).toFixed(2);
      }

      return {
        finalPrice,
        originalPrice,
        isDiscounted: true,
      };
    }, [item.price, item.discounttype, item.discountvalue]);

    // Memoize variant classes
    const variantClasses = useMemo(() => {
      switch (variant) {
        case 'compact':
          return 'h-32 md:h-40';
        case 'featured':
          return 'h-48 md:h-56';
        default:
          return 'aspect-square';
      }
    }, [variant]);

    // Memoize price display
    const priceDisplay = useMemo(() => {
      if (priceInfo.isDiscounted) {
        return (
          <div className="flex flex-col items-end">
            <span className="line-through text-gray-300 text-xs">₹{priceInfo.originalPrice}</span>
            <span className="text-orange-400 font-semibold text-sm">₹{priceInfo.finalPrice}</span>
          </div>
        );
      }

      return <span className="text-white font-semibold text-sm">₹{priceInfo.finalPrice}</span>;
    }, [priceInfo]);

    // Memoize quantity controls
    const quantityControls = useMemo(() => {
      if (quantity > 0) {
        return (
          <div className="flex items-center bg-black/90 rounded-lg px-2 py-1 gap-2">
            <button
              onClick={handleDecrement}
              className="text-white text-xs hover:bg-black/80 px-1 rounded transition-colors"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="text-white text-xs min-w-[20px] text-center">{quantity}</span>
            <button
              onClick={handleAddToCart}
              className="text-white text-xs hover:bg-black/80 px-1 rounded transition-colors"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        );
      }

      return (
        <button
          className="bg-black/90 hover:bg-black p-1 rounded-lg transition-colors"
          onClick={handleAddToCart}
          aria-label="Add to cart"
        >
          <ShoppingBag className="w-4 h-4 text-white" />
        </button>
      );
    }, [quantity, handleDecrement, handleAddToCart]);

    return (
      <motion.div
        className={`relative h-full flex flex-col group hover:shadow-lg transition-all duration-200 ${className}`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        layout
      >
        <div className={`relative rounded-xl overflow-hidden mb-2 flex-1 ${variantClasses}`}>
          <LazyImage
            src={item.image}
            alt={item.name}
            category={item.category}
            className="w-full h-full object-cover cursor-pointer"
            onClick={onImageClick}
          />

          {/* Discount Badge */}
          {priceInfo.isDiscounted && (
            <motion.div
              className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg font-semibold shadow-lg z-10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {item.discounttype === 'Percentage'
                ? `${item.discountvalue}% off`
                : `₹${item.discountvalue} off`}
            </motion.div>
          )}

          {/* Like Button */}
          <button
            className="absolute top-2 right-2 bg-white/80 rounded-full p-1.5 backdrop-blur-sm hover:bg-white transition-colors z-10"
            onClick={handleToggleLike}
            aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
            />
          </button>

          {/* Price Display */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-xs px-2.5 py-1 rounded-lg flex flex-col items-end">
            {priceDisplay}
          </div>
        </div>

        <div className="text-black space-y-1 flex-1 flex flex-col">
          <h3 className="font-medium text-sm md:text-base line-clamp-1">{item.name}</h3>

          {showDescription && item.description && (
            <p className="text-[10px] md:text-xs text-gray-600 line-clamp-2 flex-1">
              {item.description}
            </p>
          )}

          <div className="flex justify-between items-center mt-auto">
            {showDescription && item.description && (
              <div className="flex-1 pr-2">
                <p className="text-[10px] md:text-xs text-gray-600 line-clamp-1">
                  {item.description}
                </p>
              </div>
            )}

            {quantityControls}
          </div>
        </div>
      </motion.div>
    );
  },
);

OptimizedFoodItem.displayName = 'OptimizedFoodItem';

export default OptimizedFoodItem;
