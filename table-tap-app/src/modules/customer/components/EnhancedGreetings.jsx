import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';


// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.15,
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const badgeVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 15 }
  }
};

const getTimeOfDay = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 5 && currentHour < 12) return "morning";
  if (currentHour >= 12 && currentHour < 17) return "afternoon";
  if (currentHour >= 17 && currentHour < 21) return "evening";
  return "night";
};

const getGreetingText = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Hello There";
};

const getEmojiData = (timeOfDay) => {
  const emojis = {
    morning: ["🌅", "☕", "🥚", "✨", "🌞"],
    afternoon: ["☀️", "🥣", "🥗", "🍕", "🥤"],
    evening: ["🌆", "🍵", "🍝", "🍹", "🌙"],
    night: ["🌌", "🍦", "🍷", "🍕", "🦉"]
  };
  const list = emojis[timeOfDay] || ["✨"];
  return list[Math.floor(Math.random() * list.length)];
};

const getAestheticQuote = (userName) => {
  const isGuest = userName.toLowerCase() === 'guest';
  if (isGuest) {
    return [
      "Embark on a culinary journey with us.",
      "Flavor is the story of a culture.",
      "Good food is the foundation of genuine happiness.",
      "Savor every moment, taste every dream."
    ][Math.floor(Math.random() * 4)];
  }
  return [
    "Your table is ready for a new experience.",
    "Treat yourself to something extraordinary today.",
    "Fueling your passions, one bite at a time.",
    "The perfect meal is closer than you think."
  ][Math.floor(Math.random() * 4)];
};

export default function EnhancedGreetings({ userName = "Guest" }) {
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [emoji, setEmoji] = useState(getEmojiData(timeOfDay));
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");

  const isGuest = userName.toLowerCase() === 'guest';

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateString(now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }));
      setTimeOfDay(getTimeOfDay());
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-5 py-4"
    >
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md border border-white/10 shadow-xl">
        {/* Background Decorative Element */}
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-[-20%] left-[-10%] w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -z-10" />

        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <motion.div variants={itemVariants} className="space-y-1">
              <span className="text-orange-400 text-xs font-bold uppercase tracking-widest opacity-80">
                {isGuest ? "Welcome to TableTap" : "Welcome Back"}
              </span>
              <h1 className="text-3xl font-bold flex flex-wrap items-center gap-2 tracking-tight">
                <span className="text-white">{getGreetingText()},</span>
                <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                  {userName}
                </span>
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="inline-block"
                >
                  {emoji}
                </motion.span>
              </h1>
            </motion.div>

            <motion.div
              variants={badgeVariants}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-inner"
            >
              <span className="text-white/60 text-[10px] whitespace-nowrap font-medium tracking-wider uppercase">
                {timeString} • {dateString}
              </span>
            </motion.div>
          </div>

          <motion.p
            variants={itemVariants}
            className="text-white/60 text-sm font-medium italic leading-relaxed max-w-[85%]"
          >
            "{getAestheticQuote(userName)}"
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex items-center gap-2 pt-1"
          >
            <div className="h-0.5 w-12 bg-gradient-to-r from-orange-500 to-transparent rounded-full" />
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">
              {isGuest ? "Explore today's specials" : "Your favorites await"}
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}