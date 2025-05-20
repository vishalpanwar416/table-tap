import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo1 from '../../assets/images/Food/Burger.jpg';
import logo2 from '../../assets/images/Food/chickencurry.jpg';
import { useNavigate } from 'react-router-dom';

export default function OnboardingScreens() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const navigate = useNavigate();
  
  const screens = [
    {
      id: 1,
      image: logo1,
      title: "Order For Food",
      imagePlaceholder: "Pizza with melted cheese and basil"
    },
    {
      id: 2,
      image: logo2,
      title: "Easy Payment",
      imagePlaceholder: "Brownie with ice cream and mint"
    }
  ];

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      navigate('/home');
    }
  };

  const handleSkip = () => {
    navigate('/home');
  };

  // Animation variants
  const imageVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  };

  const contentVariants = {
    enter: { y: 50, opacity: 0 },
    center: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black md: w-full">s
      <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-lg min-h-screen md">
        <AnimatePresence mode='wait'>
          {/* Image Section */}
          <motion.div
            key={currentScreen}
            variants={imageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-2/3 w-full relative"
          >
            <img 
              src={screens[currentScreen].image} 
              alt={screens[currentScreen].imagePlaceholder}
              className="w-[600px] h-[600px] object-cover rounded-b-3xl"
            />
            <button 
              onClick={handleSkip}
              className="absolute top-12 right-6 px-3 py-1 bg-white bg-opacity-80 rounded-full flex items-center text-orange-600"
            >
              <span className="mr-1 text-sm font-medium">Skip</span>
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Content Section */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentScreen}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="min-h-1/3 flex flex-col items-center justify-between py-8 px-6"
          >
            <h1 className="text-3xl font-bold text-center">
              {screens[currentScreen].title}
            </h1>
            
            {/* Pagination Dots */}
            <div className="flex space-x-2 my-6">
              {screens.map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ width: '0.5rem', backgroundColor: '#e5e7eb' }}
                  animate={{
                    width: index === currentScreen ? '2rem' : '0.5rem',
                    backgroundColor: index === currentScreen ? '#1f2937' : '#e5e7eb'
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-1 rounded-full"
                />
              ))}
            </div>
            
            {/* Animated Button */}
            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-300 text-black font-medium py-3 px-12 rounded-full"
            >
              <motion.span
                key={currentScreen}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {currentScreen === screens.length - 1 ? 'Get Started' : 'Next'}
              </motion.span>
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}