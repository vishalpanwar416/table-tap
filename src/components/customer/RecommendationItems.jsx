import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../config/CartContent';
import { useLikes } from '../../config/LikesContent';
import PriceDisplay from './PriceDisplay';

const RecommendationItem = ({ item, onImageClick }) => {
  const { toggleLike, likedItems } = useLikes();
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();

  if (!item) return null;

  const { id, image, name, category } = item;

  const cartItem = cartItems.find(cartItem => cartItem.id === id);
  const quantity = cartItem?.quantity || 0;
  const isLiked = likedItems.some(likedItem => likedItem.id === id);

  const handleAddToCart = () => {
    addToCart(item);
  };

  const handleDecrement = () => {
    if (quantity === 1) {
      removeItem(id, category);
    } else {
      updateQuantity(id, category, quantity - 1);
    }
  };

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden aspect-square md:w-[80%] md:h-[80%]">
      <div className="relative h-full w-full">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover" 
          onClick={() => onImageClick && onImageClick(item)}
          style={{ cursor: 'pointer' }}
        />
      </div>

      {/* Like Button */}
      <button 
        className="absolute top-2 left-2 bg-white/70 rounded-full p-1 z-10"
        onClick={() => toggleLike(item)}
      >
        <Heart 
          className={`h-4 w-4 md:h-6 md:w-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-500'}`}
        />
      </button>

      {/* Cart Controls */}
      {quantity > 0 ? (
              <div className="absolute bottom-1 right-2 bg-black/80 text-white px-2 py-1 rounded-xl z-10 flex items-center gap-2 md: h-7">
                <button 
                  onClick={handleDecrement}
                  className="text-xs hover:bg-black/90 px-1 rounded md:text-[90%]"
                >
                  -
                </button>
                <span className="text-xs md:text-[90%]">{quantity}</span>
                <button 
                  onClick={handleAddToCart}
                  className="text-xs hover:bg-black/90 px-1 rounded md:text-[90%]"
                >
                  +
                </button>
              </div>
            ) : (
              <button 
                className="absolute bottom-1 right-1 bg-black/80 text-white px-2 py-1 rounded-xl z-10 flex items-center gap-1"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="w-4 h-4 md:h-6 md:w-6" />
                <span className="text-sx md:text-[90%]">Add</span>
              </button>
            )}

      {/* Price Display */}
      <div className="absolute top-1 right-1 bg-black/80 px-2 py-1 rounded-md flex items-center gap-1 min-w-[50px] min-h-[15px] md:min-w-[100px] md:min-h-[26px]">
        {item.discounttype && item.discountvalue ? (
          <>
            <span className="line-through text-gray-300 mr-1 whitespace-nowrap text-xs. md:text-lg font-spartan-regular">
              ₹{Number(item.price).toFixed(2)}
            </span>
            <span className="text-orange-400 font-semibold whitespace-nowrap text-base md:text-xl font-spartan-semibold">
              ₹{item.discounttype === 'Percentage'
                ? (item.price - (item.price * (item.discountvalue / 100))).toFixed(2)
                : Math.max(0, item.price - item.discountvalue).toFixed(2)
              }
            </span>
          </>
        ) : (
          <span className="font-semibold whitespace-nowrap text-white text-base md:text-xl font-spartan-semibold">
            ₹{Number(item.price).toFixed(2)}
          </span>
        )}
      </div>

      {/* Food Info */}
      <div className="absolute bottom-0 left-0 text-center px-1 pb-1 ">
          <span className="text-white text-xs font- bg-black/35 rounded-xl px-2 py-1 md:text-xl">
            {item.name}
          </span>
        </div>
      </div>
  );
};

const RecommendationItems = ({ 
  allFoodItems = [],
  onItemClick, 
  scrollRef, 
  scroll 
}) => {
  const recommendedItems = (allFoodItems || []).filter(item => 
    item?.tags?.some?.(tag => 
      tag?.toLowerCase?.() === 'recommended'
    )
  );

  if (recommendedItems.length === 0) return null;

  return (
    <div className="px-1 pb-2 text-black flex-1">
      <div className="flex justify-between items-center mb-3">
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
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:pb-0"
        style={{ minHeight: recommendedItems.length > 0 ? 'auto' : '0' }}
      >
        {recommendedItems.map((item) => (
          <div 
            key={item.id}
            className="flex-shrink-0 w-[45vw] md:w-[30vw]"
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* This is the single item card */}
            <RecommendationItem item={item} onImageClick={onItemClick} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationItems;