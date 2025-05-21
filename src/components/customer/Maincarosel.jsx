import React, { useState, useEffect } from 'react';
import AliceCarousel from 'react-alice-carousel';
import 'react-alice-carousel/lib/alice-carousel.css';
import { fetchMaincaroselData, fallbackMaincaroselData } from './MaincaroselData';
import OrderCard from './itemCard';

const responsive = {
  0: { items: 1 },
  1024: { items: 1 }
};

const Maincarosel = () => {
  const [carouselData, setCarouselData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderCardOpen, setIsOrderCardOpen] = useState(false);

  useEffect(() => {
    const loadCarouselData = async () => {
      try {
        const data = await fetchMaincaroselData();
        
        // If no carousel items found in database, use fallback data
        if (data.length === 0) {
          setCarouselData(fallbackMaincaroselData);
        } else {
          setCarouselData(data);
        }
      } catch (error) {
        console.error('Error loading carousel data:', error);
        // Use fallback data on error
        setCarouselData(fallbackMaincaroselData);
      } finally {
        setLoading(false);
      }
    };

    loadCarouselData();
  }, []);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsOrderCardOpen(true);
  };

  const handleCloseOrderCard = () => {
    setIsOrderCardOpen(false);
    setSelectedItem(null);
  };

  const items = carouselData.map((item, index) => (
    <div
      key={item.id || index}
      className="flex flex-row w-full h-[190px] md:h-[240px] rounded-[3rem] overflow-hidden shadow-md cursor-pointer"
      onClick={() => handleItemClick(item)}
    >
      <div className="w-1/2 bg-gray-700 text-white flex flex-col justify-center items-center px-3">
        <p className="text-xl md:text-2xl font-medium text-center">{item.message}</p>
        <p className="text-4xl md:text-5xl font-extrabold mt-2 text-center">{item.discount}</p>
      </div>
      <div className="w-1/2">
        <img 
          src={item.imade || '/api/placeholder/300/200'} 
          alt={item.name || "Dish"} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to placeholder image if the image fails to load
            e.target.src = '/api/placeholder/300/200';
          }}
        />
      </div>
    </div>
  ));

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[190px] md:h-[240px] rounded-[3rem] bg-gray-100">
        <div className="text-gray-500">Loading offers...</div>
      </div>
    );
  }

  // Don't render carousel if no items
  if (items.length === 0) {
    return null;
  }

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
      />
      <OrderCard
        isOpen={isOrderCardOpen}
        onClose={handleCloseOrderCard}
        item={
          selectedItem
            ? { ...selectedItem, image: selectedItem.imade || selectedItem.image }
            : null
        }
      />
    </>
  );
};

export default Maincarosel;