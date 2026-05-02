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

const underlineVariants = {
  hidden: { width: 0 },
  visible: {
    width: '100%',
    transition: { duration: 0.8, ease: "easeOut", delay: 0.5 }
  }
};

// Helper for time-based greetings
const getGreetingText = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 5 && currentHour < 12) return "Good Morning";
  if (currentHour >= 12 && currentHour < 17) return "Good Afternoon";
  if (currentHour >= 17 && currentHour < 21) return "Good Evening";
  return "Hello";
};

export default function EnhancedGreetings({ userName = "Guest" }) {
  const [greeting, setGreeting] = useState(getGreetingText());
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

      setTimeString(`${formattedHours}:${formattedMinutes} ${ampm}`);
      setGreeting(getGreetingText());
      setDateString(
        now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-6 mt-0 mb-2"
    >
      <div className="flex flex-col">
        <div className="flex items-center">
          <motion.h1
            variants={textVariants}
            className="text-[29px] font-spartan-bold text-white flex items-center flex-wrap tracking-tight mb-0 leading-tight"
          >
            {greeting}
            <motion.span
              variants={nameVariants}
              className="text-primary-500 ml-2.5"
            >
              {userName || "Guest"}!
            </motion.span>
          </motion.h1>
        </div>

        <motion.div
          variants={textVariants}
          className="text-[11px] text-gray-400 -mt-0.5 opacity-80"
        >
          It's <span className="font-semibold">{timeString}</span> on <span className="font-semibold">{dateString}</span>
        </motion.div>

        <motion.div
          variants={underlineVariants}
          className="h-[1px] mt-1.5 max-w-xs"
          style={{ background: 'linear-gradient(to right, rgba(249,115,22,0.7), transparent)' }}
        />
      </div>
    </motion.div>
  );
}