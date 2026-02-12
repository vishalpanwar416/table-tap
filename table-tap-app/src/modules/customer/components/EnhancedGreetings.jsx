import React from 'react';
import { motion } from 'framer-motion';

const EnhancedGreetings = ({ userName }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const isGuest = !userName || userName.toLowerCase() === 'guest';
  const displayName = isGuest ? 'Guest' : userName;

  return (
    <div className="relative overflow-hidden px-6 pt-6 pb-2">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-600/5 rounded-full blur-2xl -ml-12 -mb-12" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        <div className="flex flex-col">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-orange-200/60 text-xs font-medium uppercase tracking-[0.2em] mb-1 px-0.5"
          >
            {getGreeting()}
          </motion.span>

          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-white">Hello, </span>
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-300 bg-clip-text text-transparent drop-shadow-sm">
                {displayName}
              </span>
            </h1>

            {isGuest && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2"
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedGreetings;