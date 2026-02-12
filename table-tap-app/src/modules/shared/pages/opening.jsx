import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo1 from '../../../assets/icons/logott.png';
import { storeRestaurantSelection } from '../utils/restaurantCheck';

// Animation configurations
const ANIMATIONS = {
  logo: {
    initial: { opacity: 0, y: 20 },
    animate: (showButtons) => ({
      opacity: 1,
      y: showButtons ? -50 : 0,
      scale: showButtons ? 0.85 : 1,
    }),
    transition: {
      duration: 1.2,
      type: "spring",
      stiffness: 50,
      damping: 30,
      mass: 1
    }
  },
  container: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 40 },
    transition: { delay: 0.3, duration: 0.6, type: "spring", stiffness: 100, damping: 25 }
  },
  buttons: [
    { initial: { opacity: 0, x: -20 }, delay: 0.5 },
    { initial: { opacity: 0, x: 20 }, delay: 0.6 },
    { initial: { opacity: 0, y: 10 }, delay: 0.8 }
  ]
};

const BUTTON_STYLES = {
  primary: "py-3 bg-white border-2 border-gray-800 text-gray-800 rounded-full shadow-sm hover:bg-gray-50 transition-colors",
  skip: "mt-4 text-center text-gray-500 text-xl pt-10 hover:text-gray-700 cursor-pointer transition-colors font-spartan-medium"
};

export default function Opening() {
  const [showButtons, setShowButtons] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setShowButtons(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Preserve URL parameters when navigating
  const preserveParams = (path) => {
    const urlParams = new URLSearchParams(location.search);
    const restaurant = urlParams.get('restaurant');
    const table = urlParams.get('table');

    if (restaurant && table) {
      // Store the parameters for later use
      storeRestaurantSelection(restaurant, table);
      return `${path}?restaurant=${restaurant}&table=${table}`;
    }
    return path;
  };

  const handleSkip = useCallback(() => navigate(preserveParams('/onboarding')), [navigate, location.search]);
  const handleLogin = useCallback(() => navigate(preserveParams('/login')), [navigate, location.search]);
  const handleSignup = useCallback(() => navigate(preserveParams('/signup')), [navigate, location.search]);

  const buttons = [
    { text: "Log In", onClick: handleLogin, style: BUTTON_STYLES.primary },
    { text: "Sign Up", onClick: handleSignup, style: BUTTON_STYLES.primary },
    { text: "Skip for now", onClick: handleSkip, style: BUTTON_STYLES.skip }
  ];

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center font-spartan overflow-hidden bg-gradient-to-b from-white to-cyan-100 md:from-cyan-100 md:to-white">

      <motion.div
        {...ANIMATIONS.logo}
        animate={ANIMATIONS.logo.animate(showButtons)}
        transition={ANIMATIONS.logo.transition}
        className="flex flex-col items-center p-8"
      >
        <img src={logo1} alt="Logo" className="w-[300px] md:w-[400px]" loading="lazy" />
      </motion.div>

      <AnimatePresence>
        {showButtons && (
          <motion.div
            {...ANIMATIONS.container}
            className="mt-8 w-64 flex flex-col gap-4 pb-10 font-spartan-medium"
          >
            {buttons.map((btn, i) => (
              <motion.button
                key={btn.text}
                initial={ANIMATIONS.buttons[i].initial}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: ANIMATIONS.buttons[i].delay, duration: 0.4 }}
                className={btn.style}
                onClick={btn.onClick}
              >
                {btn.text}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}