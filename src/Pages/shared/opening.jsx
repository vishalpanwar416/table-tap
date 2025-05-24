import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo1 from '../../assets/icons/logott.png';

export default function Opening() {
  const [showButtons, setShowButtons] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButtons(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleSkip = () => navigate('/skip1');
  const handleLogin = () => navigate('/login');
  const handleSignup = () => navigate('/signup');

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center font-spartan overflow-hidden bg-gradient-to-b from-white to-cyan-100 md:from-cyan-100 md:to-white">
      
      {/* Logo with smooth transition */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: showButtons ? -50 : 0,
          scale: showButtons ? 0.85 : 1
        }}
        transition={{ 
          duration: 0.8,
          type: "spring",
          stiffness: 80,
          damping: 20
        }}
        className="flex flex-col items-center p-8"
      >
        <img src={logo1} alt="Logo" className="w-[300px] md:w-[400px]" />
      </motion.div>
      
      {/* Buttons with fade-in animation */}
      <AnimatePresence>
        {showButtons && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ 
              delay: 0.3,
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 25
            }}
            className="mt-8 w-64 flex flex-col gap-4 pb-10 font-spartan-medium"
          >
            <motion.button 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="py-3 bg-white border-2 border-gray-800 text-gray-800 rounded-full shadow-sm
                         hover:bg-gray-50 transition-colors"
              onClick={handleLogin}
            >
              Log In
            </motion.button>
            
            <motion.button 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              onClick={handleSignup}
              className="py-3 bg-white text-gray-800 border-2 border-gray-800 rounded-full shadow-sm
                              hover:bg-gray-50 transition-colors"
            >
              Sign Up
            </motion.button>
            
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              onClick={handleSkip}
              className="mt-4 text-center text-gray-500 text-xl pt-10 hover:text-gray-700 cursor-pointer
                         transition-colors font-spartan-medium"
            >
              Skip for now
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}