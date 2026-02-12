import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Premium animation variants for an aesthetic entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.15
    }
  }
};

const textVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const nameVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: "easeOut", delay: 0.3 }
  }
};

const emojiVariants = {
  hidden: { scale: 0, rotate: -45 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.5
    }
  }
};

const getGreetingText = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 5 && currentHour < 12) return "Good Morning";
  if (currentHour >= 12 && currentHour < 17) return "Good Afternoon";
  if (currentHour >= 17 && currentHour < 21) return "Good Evening";
  return "Hello";
};

const getTimeEmoji = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 5 && currentHour < 12) return "☀️";
  if (currentHour >= 12 && currentHour < 17) return "✨";
  if (currentHour >= 17 && currentHour < 21) return "🌙";
  return "👋";
};

export default function EnhancedGreetings({ userName = "Guest" }) {
  const [greeting, setGreeting] = useState(getGreetingText());
  const [emoji, setEmoji] = useState(getTimeEmoji());

  useEffect(() => {
    const update = () => {
      setGreeting(getGreetingText());
      setEmoji(getTimeEmoji());
    };
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-6 mt-6 mb-4"
    >
      <div className="flex items-center">
        <motion.h1
          variants={textVariants}
          className="text-[29px] font-spartan-bold text-white flex items-center flex-wrap tracking-tight"
        >
          {greeting}
          <motion.span
            variants={nameVariants}
            className="text-orange-500 ml-2.5"
          >
            {userName || "Guest"}!
          </motion.span>

          <motion.span
            variants={emojiVariants}
            className="ml-3 text-3xl"
          >
            {emoji}
          </motion.span>
        </motion.h1>
      </div>
    </motion.div>
  );
}