import React, { useState, useEffect } from 'react';
import AliceCarousel from 'react-alice-carousel';
import 'react-alice-carousel/lib/alice-carousel.css';
import { fetchMaincaroselData, fallbackMaincaroselData } from '../../api/foodData';
import OrderCard from './itemCard';
import { useRestaurant } from '../../Pages/Restaurantselection/RestaurantContext';

const responsive = {
  0: { items: 1 },
  1024: { items: 1 }
};

const Maincarosel = () => {
  const [carouselData, setCarouselData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0); // Track active slide
  const { restaurantId } = useRestaurant();

  useEffect(() => {
    const loadCarouselData = async () => {
      try {
        const data = await fetchMaincaroselData(restaurantId);
        setCarouselData(data.length === 0 ? fallbackMaincaroselData : data);
      } catch {
        setCarouselData(fallbackMaincaroselData);
      } finally {
        setLoading(false);
      }
    };
    loadCarouselData();
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
      className={`
        flex flex-row w-full h-[220px] md:h-[280px] rounded-[3rem] overflow-hidden shadow-2xl cursor-pointer group border border-gray-200 bg-white/60 backdrop-blur-md transition-transform duration-500
        ${activeIndex === index ? 'scale-105 z-10' : 'scale-95 opacity-80'}
      `}
      style={{ minHeight: 180 }}
      onClick={() => handleItemClick(item)}
    >
      {/* Text section */}
      <div className="w-1/2 flex flex-col justify-center items-center px-8 h-full bg-gradient-to-br from-black/95 via-gray-900/90 to-gray-800/80 backdrop-blur-md">
        <p className="text-2xl md:text-3xl font-extrabold text-white text-center drop-shadow-lg animate-fade-in-up">
          {item.message}
        </p>
        <span className="mt-3 text-3xl md:text-4xl font-black text-orange-400 drop-shadow-lg animate-fade-in-up delay-100 glow-orange whitespace-nowrap px-2">
          {item.discount}
        </span>
        <p className="text-base md:text-lg text-gray-200 font-medium text-center mt-2 opacity-80">
          {item.name}
        </p>
        <button className="mt-4 px-6 py-2 bg-orange-500/90 text-white rounded-full shadow hover:bg-orange-600 transition-colors duration-200 font-semibold text-base md:text-lg animate-fade-in-up delay-200">
          Order Now
        </button>
      </div>
      {/* Image section */}
      <div className="w-1/2 h-full overflow-hidden relative">
        <img
          src={item.imade || '/api/placeholder/300/200'}
          alt={item.name || "Dish"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.src = '/api/placeholder/300/200';
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 pointer-events-none" />
        <div className="absolute inset-0 rounded-[3rem] pointer-events-none group-hover:shadow-[0_0_40px_10px_rgba(255,140,0,0.25)] transition-all duration-500" />
      </div>
    </div>
  ));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[220px] md:h-[280px] rounded-[3rem] bg-gray-100">
        <div className="text-gray-500">Loading offers...</div>
      </div>
    );
  }

  if (items.length === 0) return null;

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
      <OrderCard
        isOpen={isOrderCardOpen}
        onClose={handleCloseOrderCard}
        item={selectedItem}
      />
    </>
  );
};

export default Maincarosel;