import React from 'react';
import AliceCarousel from 'react-alice-carousel';
import 'react-alice-carousel/lib/alice-carousel.css';
import { MaincaroselData } from './MaincaroselData'; // adjust path if needed


const items = MaincaroselData.map((item, index) => (
  <div
    key={index}
    className="flex flex-row w-full h-[200px] rounded-[3rem] overflow-hidden shadow-md"
  >
    <div className="w-1/2 bg-gray-700 text-white flex flex-col justify-center items-center px-3">
      <p className="text-xl font-medium text-center">{item.message}</p>
      <p className="text-4xl font-extrabold mt-2 text-center">{item.discount}</p>
    </div>
    <div className="w-1/2">
      <img src={item.imade} alt="Dish" className="w-full h-full object-cover" />
    </div>
  </div>
));

const BannerCarousel = () => (
    <div className="h-48 overflow-hidden">
  <AliceCarousel
    autoPlay
    autoPlayInterval={700}
    infinite
    ButtonsControls
    dotsControls={true}
    touchTracking
    animationType="fadeout"
    animationDuration={800}
    items={items}
  />
  </div>
);

export default BannerCarousel;
