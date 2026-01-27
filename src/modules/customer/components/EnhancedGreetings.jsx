import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../shared/config/AuthContext';
import { supabase } from '../../shared/supabase';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.2
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

const emojiVariants = {
  hidden: { scale: 0, rotate: -45 },
  visible: { 
    scale: 1, 
    rotate: 0, 
    transition: { 
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.7
    }
  },
  hover: { 
    scale: 1.2,
    rotate: 5,
    transition: { duration: 0.3 }
  },
  tap: { 
    scale: 0.8,
    rotate: -5,
    transition: { duration: 0.1 }
  }
};


// Helper functions defined outside the component
const getTimeOfDay = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 5 && currentHour < 12) return "morning";
  if (currentHour >= 12 && currentHour < 17) return "afternoon";
  if (currentHour >= 17 && currentHour < 21) return "evening";
  return "night";
};

const getGreetingText = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 5 && currentHour < 12) return "Good Morning";
  if (currentHour >= 12 && currentHour < 17) return "Good Afternoon";
  if (currentHour >= 17 && currentHour < 21) return "Good Evening";
  return "Hello";
};

const getRandomQuote = (timeOfDay) => {
  const quotes = {
    morning: [
      "Rise and shine! Today is full of possibilities.",
      "The early bird catches the worm!",
      "Every morning is a fresh start.",
      "Ready to seize the day?"
    ],
    afternoon: [
      "Keep up the great work today!",
      "The day is still young, make it count!",
      "How's your day going so far?",
      "Still plenty of time to accomplish your goals!"
    ],
    evening: [
      "Another day well spent!",
      "Time to start winding down.",
      "Reflect on the day's achievements.",
      "Evening is a time for relaxation and planning."
    ],
    night: [
      "The night is still young!",
      "Stars are out, dreams are waiting.",
      "Some of the best ideas come at night.",
      "Time to rest and recharge for tomorrow."
    ]
  };
  
  const quoteList = quotes[timeOfDay];
  return quoteList[Math.floor(Math.random() * quoteList.length)];
};

export default function EnhancedGreetings() {
  const { user } = useAuth();
  const [userName, setUserName] = useState("Guest");
  const [greeting, setGreeting] = useState(getGreetingText());
  const [timeString, setTimeString] = useState("");
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());  
  const [currentEmoji, setCurrentEmoji] = useState("");
  const [quote, setQuote] = useState("");
  const [isEmojiHovered, setIsEmojiHovered] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [emojiRotation, setEmojiRotation] = useState(0);
  const [dateString, setDateString] = useState(
    new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  );

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          if (data?.full_name) {
            // Split the full name and use only the first part as the first name
            const firstName = data.full_name.split(' ')[0];
            // Capitalize the first letter of the first name
            const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
            setUserName(capitalizedFirstName);
          }
        } catch (error) {
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);



  // Initialize emoji and quote
  useEffect(() => {
    setQuote(getRandomQuote(timeOfDay));
  }, [timeOfDay]);

  // Update time and greeting periodically
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
      setTimeOfDay(getTimeOfDay());
      setDateString(
        now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
      );
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle emoji click - change emoji and show quote
  const handleEmojiClick = () => {
    // Get a new random emoji from the current time period
    
    
    // Change the quote
    setQuote(getRandomQuote(timeOfDay));
    
    // Show the quote
    setShowQuote(true);
    
    // Add a small rotation for click effect
    setEmojiRotation(prev => prev === 0 ? 10 : 0);
    
    // Hide quote after 5 seconds
    setTimeout(() => {
      setShowQuote(false);
    }, 5000);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-4 mt-2"
    >
      <div className="flex flex-col">
        <div className="flex items-center">
          <motion.h1 
            variants={textVariants}
            className="text-[29px] font-spartan-bold"
          >
            {greeting}
            <motion.span 
              variants={nameVariants}
              className="text-orange-500 ml-2"
            >
              {userName}!
            </motion.span>
          </motion.h1>
          
          <motion.div
            className="ml-3 flex items-center space-x-2"
          >
            <motion.span
              variants={emojiVariants}
              whileHover="hover"
              whileTap="tap"
              animate={{ rotate: emojiRotation }}
              onClick={handleEmojiClick}
              onMouseEnter={() => setIsEmojiHovered(true)}
              onMouseLeave={() => setIsEmojiHovered(false)}
              className="text-2xl cursor-pointer"
              title="Click me for a quote!"
            >
              {currentEmoji} 
            </motion.span>
            
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-xl"
            >
            {currentEmoji}
            </motion.span>
          </motion.div>
        </div>
        
        <motion.div
          variants={textVariants}
          className="text-sm text-gray-600 mt-1"
        >
          It's <span className="font-semibold">{timeString}</span> on <span className="font-semibold">{dateString}</span>
        </motion.div>
        
        <motion.div 
          variants={underlineVariants}
          className="h-1 bg-orange-500 mt-2 max-w-xs"
        />
        
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: showQuote ? "auto" : 0,
            opacity: showQuote ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className="mt-3 overflow-hidden"
        >
          <motion.p 
            className="text-sm italic text-gray-700 bg-orange-100 p-3 rounded-lg shadow-sm"
          >
            "{quote}"
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}