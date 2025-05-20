import { Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../config/CartContent';
import { useLikes } from '../../config/LikesContent';
import PriceDisplay from './PriceDisplay';

const RecommendationItem = ({ item }) => {
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
      <div className="absolute top-1 right-1 bg-black/80 px-2 py-1 pt-1.5 rounded-xl text-white text-xs font-medium md:w-[64px] md:h-6">
        <PriceDisplay item={item} className='md:text-[17px]' />
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

export default RecommendationItem;