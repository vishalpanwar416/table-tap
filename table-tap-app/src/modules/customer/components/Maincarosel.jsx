import React, { useState, useEffect } from 'react';
import AliceCarousel from 'react-alice-carousel';
import 'react-alice-carousel/lib/alice-carousel.css';
import { fetchMaincaroselData } from '../api/foodData';
import OrderCard from './itemCard';
import { useRestaurant } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';

const responsive = {
  0: { items: 1 },
  1024: { items: 1 },
};

const Maincarosel = () => {
  const [carouselData, setCarouselData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0); // Track active slide
  const { restaurantId } = useRestaurant();

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const safetyTimer = setTimeout(() => {
      if (!cancelled) {
        setCarouselData([]);
        setLoading(false);
      }
    }, 5000);

    const loadCarouselData = async () => {
      try {
        const data = await fetchMaincaroselData(restaurantId);
        if (!cancelled) setCarouselData(data);
      } catch {
        if (!cancelled) setCarouselData([]);
      } finally {
        clearTimeout(safetyTimer);
        if (!cancelled) setLoading(false);
      }
    };

    loadCarouselData();
    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
    };
  }, [restaurantId]);

  const handleItemClick = (item) => {
    // If carouselData items are missing restaurant_id, you need to add it here
    setSelectedItem({
      ...item,
      image: item.imade || item.image,
      restaurant_id: item.restaurant_id || restaurantId, // Ensure this is set!
    });
    setIsOrderCardOpen(true);
  };

  const handleCloseOrderCard = () => {
    setIsOrderCardOpen(false);
    setSelectedItem(null);
  };

  // --- ZOOM EFFECT LOGIC ---
  const items = carouselData.map((item, index) => (
    <div
      key={item.id || index}
      className="flex flex-row w-full h-[200px] md:h-[255px] rounded-[2.5rem] overflow-hidden shadow-2xl cursor-pointer group border border-gray-200 bg-white/60 backdrop-blur-md"
      onClick={() => handleItemClick(item)}
    >
      {/* Text section — name + short tagline + discount must fit fixed height */}
      <div className="w-1/2 flex flex-col justify-center items-center gap-1 px-3 sm:px-5 py-3 h-full min-h-0 overflow-hidden bg-gradient-to-br from-black/95 via-gray-900/90 to-gray-800/80 backdrop-blur-md">
        <p className="text-base sm:text-lg font-extrabold text-white text-center leading-tight line-clamp-2 drop-shadow-lg">
          {item.name}
        </p>
        {item.message && item.message !== item.name && (
          <p className="text-[11px] sm:text-xs text-gray-300 text-center leading-snug line-clamp-2 max-w-full px-1">
            {item.message}
          </p>
        )}
        <span className="mt-1 text-xl sm:text-2xl md:text-3xl font-black text-orange-400 drop-shadow-lg glow-orange whitespace-nowrap">
          {item.discount}
        </span>
        <button className="mt-2 px-4 py-1.5 sm:px-5 sm:py-2 bg-orange-500/90 text-white rounded-full shadow hover:bg-orange-600 transition-colors duration-200 font-semibold text-xs sm:text-sm">
          Order Now
        </button>
      </div>
      {/* Image section */}
      <div className="w-1/2 h-full overflow-hidden relative">
        <img
          src={item.imade}
          alt={item.name || 'Dish'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.style.background =
              'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)';
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 pointer-events-none" />
        <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none group-hover:shadow-[0_0_40px_10px_rgba(255,140,0,0.25)] transition-all duration-500" />
      </div>
    </div>
  ));

  if (loading || items.length === 0) return null;

  return (
    <>
      <AliceCarousel
        mouseTracking
        items={items}
        responsive={responsive}
        controlsStrategy="responsive"
        autoPlay
        autoPlayInterval={3000}
        infinite
        disableDotsControls
        disableButtonsControls
        animationType="fade"
        animationDuration={1000}
        activeIndex={activeIndex}
        onSlideChanged={({ item }) => setActiveIndex(item)}
      />
      <OrderCard isOpen={isOrderCardOpen} onClose={handleCloseOrderCard} item={selectedItem} />
    </>
  );
};

export default Maincarosel;
