import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo1 from '../../../../assets/images/Food/Burger.jpg';
import logo2 from '../../../../assets/images/Food/chickencurry.jpg';
import { useNavigate } from 'react-router-dom';
import { hasValidRestaurantSelection } from '../../../shared/utils/restaurantCheck';

export default function OnboardingScreens() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const navigate = useNavigate();

  const screens = [
    {
      id: 1,
      image: logo1,
      title: 'Order For Food',
      subtitle: 'Browse the menu, add items to cart, and order in a few taps.',
      imagePlaceholder: 'Pizza with melted cheese and basil'
    },
    {
      id: 2,
      image: logo2,
      title: 'Easy Payment',
      subtitle: 'Pay securely and get your order delivered to your table.',
      imagePlaceholder: 'Brownie with ice cream and mint'
    }
  ];

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      if (hasValidRestaurantSelection()) {
        navigate('/home');
      } else {
        navigate('/restaurant-selection');
      }
    }
  };

  const handleSkip = () => {
    if (hasValidRestaurantSelection()) {
      navigate('/home');
    } else {
      navigate('/restaurant-selection');
    }
  };

  const imageVariants = {
    enter: { x: 80, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -80, opacity: 0 }
  };

  const contentVariants = {
    enter: { y: 24, opacity: 0 },
    center: { y: 0, opacity: 1 },
    exit: { y: -24, opacity: 0 }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black w-full">
      <div className="w-full max-w-[390px] md:max-w-lg flex flex-col min-h-screen z-10">
        {/* Top bar with Skip - matches app header style */}
        <div className="w-full px-6 py-8 relative flex items-center justify-end">
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 transition-colors font-medium font-spartan text-base"
            aria-label="Skip onboarding"
          >
            Skip
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Image section - rounded card style */}
        <div className="px-4 flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`img-${currentScreen}`}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl bg-gray-800 flex-shrink-0"
            >
              <img
                src={screens[currentScreen].image}
                alt={screens[currentScreen].imagePlaceholder}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* Content card - matches LoginPage (bg-gray-200, rounded-t-3xl) */}
          <motion.div
            className="bg-gray-200 w-full flex-1 rounded-t-3xl mt-6 px-6 pt-8 pb-8 flex flex-col font-spartan shadow-2xl z-10 min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${currentScreen}`}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex flex-col flex-1"
              >
                <h1 className="text-2xl md:text-3xl font-semibold text-black text-center mb-2">
                  {screens[currentScreen].title}
                </h1>
                {screens[currentScreen].subtitle && (
                  <p className="text-gray-600 text-center text-base mb-6">
                    {screens[currentScreen].subtitle}
                  </p>
                )}

                {/* Pagination dots - orange active state */}
                <div className="flex justify-center gap-2 my-6">
                  {screens.map((_, index) => (
                    <motion.div
                      key={index}
                      animate={{
                        width: index === currentScreen ? 24 : 8,
                        opacity: index === currentScreen ? 1 : 0.5,
                        backgroundColor: index === currentScreen ? '#f97316' : '#d1d5db'
                      }}
                      transition={{ duration: 0.25 }}
                      className="h-2 rounded-full"
                    />
                  ))}
                </div>

                {/* Primary button - matches app (orange, rounded-xl) */}
                <div className="mt-auto pt-4">
                  <motion.button
                    onClick={handleNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-orange-500 text-white font-medium py-3.5 rounded-xl text-lg hover:bg-orange-600 transition-colors shadow-lg font-spartan"
                  >
                    {currentScreen === screens.length - 1 ? 'Get Started' : 'Next'}
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
