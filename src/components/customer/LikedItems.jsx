import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../config/CartContent';
import { useLikes } from '../../config/LikesContent';
import { useNavigate } from 'react-router-dom';
import PriceDisplay from './PriceDisplay';
import OrderCard from './itemCard';

const LikedItems = ({ foodItems }) => {
  const { likedItems } = useLikes();
  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate(); 

  const [selectedItem, setSelectedItem] = React.useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = React.useState(false);

  if (!foodItems || !Array.isArray(foodItems)) return null;
  
  const likedFoodItems = foodItems.filter(item => 
    likedItems.some(likedItem => likedItem.id === item.id)
  );
  console.log(likedFoodItems);

  if (likedFoodItems.length === 0) return null;

  const FoodItem = ({ item }) => {
    const cartItem = cartItems.find(i => i.id === item.id);
    const quantity = cartItem?.quantity || 0;

    const handleDecrement = () => {
      if (quantity === 1) {
        removeItem(item.id, item.category);
      } else {
        updateQuantity(item.id, item.category, quantity - 1); 
      }
    };

    const handleImageClick = () => {
      setSelectedItem(item);
      setIsOrderCardOpen(true);
    };

    return (
      <div className="w-[150px] flex-shrink-0 rounded-xl overflow-hidden relative shadow-lg group 
                    hover:shadow-xl transition-shadow duration-200
                    md:w-[250px] md:h-[200px]">
        <button
          onClick={handleImageClick}
          className="w-full h-28 md:h-[200px] block focus:outline-none"
          style={{ padding: 0, border: 'none', background: 'none' }}
        >
          <img src={item.image} alt={item.name} className="w-full h-28 md:h-[200px] object-cover" />
        </button>
        {/* Price Tag */}
        <div className="absolute top-1 right-1 bg-black/80 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 min-w-[80px] min-h-[22px] md:min-w-[100px] md:min-h-[26px]">
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

        {/* Quantity Controls or Add Button */}
        {quantity > 0 ? (
          <div className="absolute bottom-0 right-0 flex items-center bg-black/80 rounded-md px-1 py-1 space-x-1 md:s">
            <button 
              onClick={handleDecrement}
              className="text-white text-xs hover:bg-black/90 px-1 rounded md:text-xl"
            >
              -
            </button>
            <span className="text-white text-xs md:text-xl">{quantity}</span>
            <button 
              onClick={() => addToCart({
                ...item,
                category: item.category
              })}
              className="text-white text-xs hover:bg-black/90 px-1 rounded md:text-xl"
            >
              +
            </button>
          </div>
        ) : (
          <button 
            onClick={() => addToCart(item)}
            className="absolute bottom-0 right-0 px-1 py-1 bg-black/80 text-orange-100 rounded-md
                      text-[10px] font-medium hover:bg-black/90 transition-colors duration-200"
          >
            <ShoppingBag className="w-5 h-5 md:w-7 md:h-7" />
          </button>
        )}
        <div className="absolute bottom-0 left-0 text-center px-0.2 pb-0.2 ">
          <span className="text-white text-xs font-medium bg-black/35 rounded-xl px-2 py-1 md:text-xl">
            {item.name}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 px-1 text-black">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-thick font-spartan-bold md:text-3xl">Liked Items</h2>
        <button onClick={() => navigate('/liked-items')} className="text-orange-500 md:text-xl text-sm flex items-center hover:underline">
          View All <span className="ml-1 md:text-xl">›</span>
        </button>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-2 scroll-smooth">
        {likedFoodItems.map(item => <FoodItem key={item.id} item={item} />)}
      </div>
      <div className="my-4 w-full mx-auto h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent"></div>
      <OrderCard
        isOpen={isOrderCardOpen}
        onClose={() => setIsOrderCardOpen(false)}
        item={selectedItem}
      />
    </div>
  );
};

export default LikedItems;