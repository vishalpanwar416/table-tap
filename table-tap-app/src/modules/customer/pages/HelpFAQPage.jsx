import React, { useState, useCallback } from 'react';
import {
  ChevronLeft,
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageCircle,
  Phone,
  BookOpen,
  Shield,
  CreditCard,
  Truck,
  User,
  Smartphone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../../shared/components/LoadingScreen';

const HelpFAQPage = () => {
  const { restaurant, loading, error, tableNumber } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleFaqToggle = useCallback(
    (faqId) => {
      setExpandedFaq(expandedFaq === faqId ? null : faqId);
    },
    [expandedFaq],
  );

  const handleContactSupport = useCallback(() => {
    navigate('/contact');
  }, [navigate]);

  const faqCategories = [
    {
      id: 'ordering',
      title: 'Ordering & Menu',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'from-orange-400 to-red-500',
    },
    {
      id: 'payment',
      title: 'Payment & Billing',
      icon: <CreditCard className="w-5 h-5" />,
      color: 'from-green-400 to-blue-500',
    },
    {
      id: 'service',
      title: 'Services',
      icon: <Truck className="w-5 h-5" />,
      color: 'from-purple-400 to-pink-500',
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: <User className="w-5 h-5" />,
      color: 'from-blue-400 to-indigo-500',
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'from-yellow-400 to-orange-500',
    },
    {
      id: 'safety',
      title: 'Safety & Security',
      icon: <Shield className="w-5 h-5" />,
      color: 'from-red-400 to-pink-500',
    },
  ];

  const faqData = [
    // Ordering & Menu
    {
      id: 'order-1',
      category: 'ordering',
      question: 'How do I place an order?',
      answer:
        'Simply browse our menu, add items to your cart, and proceed to checkout. You can customize your order with special instructions and dietary preferences.',
    },
    {
      id: 'order-2',
      category: 'ordering',
      question: 'Can I modify my order after placing it?',
      answer:
        'Orders can be modified within 2 minutes of placement. Contact our staff immediately if you need to make changes to your order.',
    },
    {
      id: 'order-3',
      category: 'ordering',
      question: 'What if an item is out of stock?',
      answer:
        "If an item becomes unavailable, we'll notify you immediately and offer alternatives or a refund for that item.",
    },
    {
      id: 'order-4',
      category: 'ordering',
      question: 'How do I know my order status?',
      answer:
        "Track your order in real-time through the order tracking feature. You'll receive notifications at each stage of preparation.",
    },

    // Payment & Billing
    {
      id: 'payment-1',
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards, digital wallets (PayPal, Apple Pay, Google Pay), and cash payments at the restaurant.',
    },
    {
      id: 'payment-2',
      category: 'payment',
      question: 'Is my payment information secure?',
      answer:
        'Yes, we use industry-standard encryption and secure payment gateways to protect your payment information.',
    },
    {
      id: 'payment-3',
      category: 'payment',
      question: 'Can I get a refund?',
      answer:
        'Refunds are processed within 3-5 business days. Contact our support team for any billing issues or disputes.',
    },
    {
      id: 'payment-4',
      category: 'payment',
      question: 'Do you offer any discounts?',
      answer:
        'Yes! Check our offers section for current promotions, first-time user discounts, and loyalty rewards.',
    },

    // Service
    {
      id: 'service-1',
      category: 'service',
      question: 'How long does food preparation take at the restaurant?',
      answer:
        'Typical preparation time is 15-25 minutes, depending on order complexity and current restaurant volume.',
    },
    {
      id: 'service-2',
      category: 'service',
      question: 'Can I request special dietary accommodations?',
      answer:
        'Absolutely! We accommodate various dietary needs including vegetarian, vegan, gluten-free, and allergen-free options.',
    },
    {
      id: 'service-3',
      category: 'service',
      question: 'What are your operating hours?',
      answer: `Our current operating hours are: ${restaurant?.opening_hours || 'Please check our contact page for current hours.'}`,
    },

    // Account & Profile
    {
      id: 'account-1',
      category: 'account',
      question: 'How do I create an account?',
      answer:
        'Sign up using your email or social media accounts. You can also order as a guest without creating an account.',
    },
    {
      id: 'account-2',
      category: 'account',
      question: 'How do I update my profile information?',
      answer:
        'Go to your profile page to update personal information, delivery addresses, and payment methods.',
    },
    {
      id: 'account-3',
      category: 'account',
      question: 'Can I save my favorite orders?',
      answer:
        'Yes! Create an account to save your favorite items and reorder them quickly in the future.',
    },
    {
      id: 'account-4',
      category: 'account',
      question: 'How do I reset my password?',
      answer:
        'Use the "Forgot Password" option on the login page. You\'ll receive a reset link via email.',
    },

    // Technical Support
    {
      id: 'tech-1',
      category: 'technical',
      question: 'The app is not working properly. What should I do?',
      answer:
        'Try refreshing the page, clearing your browser cache, or updating to the latest version. Contact support if issues persist.',
    },
    {
      id: 'tech-2',
      category: 'technical',
      question: "I can't access the menu or place orders.",
      answer:
        "Check your internet connection and ensure you're using a supported browser. Contact our technical support for assistance.",
    },
    {
      id: 'tech-3',
      category: 'technical',
      question: 'How do I enable notifications?',
      answer:
        'Allow notifications when prompted by your browser. You can manage notification settings in your browser preferences.',
    },
    {
      id: 'tech-4',
      category: 'technical',
      question: 'Is the app available on mobile devices?',
      answer: 'Yes! Our web app is fully responsive and works on all mobile devices and tablets.',
    },

    // Safety & Security
    {
      id: 'safety-1',
      category: 'safety',
      question: 'What safety measures do you follow?',
      answer:
        'We follow strict food safety protocols, regular sanitization, and maintain high hygiene standards in our kitchen.',
    },
    {
      id: 'safety-2',
      category: 'safety',
      question: 'How do you handle food allergies?',
      answer:
        'We take food allergies seriously. Clearly communicate any allergies when ordering, and our staff will ensure safe preparation.',
    },
    {
      id: 'safety-3',
      category: 'safety',
      question: 'Is my personal information secure?',
      answer:
        'We protect your personal information with industry-standard security measures and never share it with third parties.',
    },
    {
      id: 'safety-4',
      category: 'safety',
      question: 'What if I have a complaint about food quality?',
      answer:
        'Contact us immediately with details about your concern. We take all complaints seriously and will address them promptly.',
    },
  ];

  // Filter FAQs based on search and category
  const filteredFaqs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <LoadingScreen message="Loading help..." variant="page" />;
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Restaurant Not Found</h2>
          <p className="text-gray-400 mb-6">Unable to load restaurant details</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg"
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-mobile-shell md:max-w-4xl lg:max-w-6xl flex flex-col mx-auto">
      {/* Header */}
      {/* Header */}
      <div className="w-full px-6 py-6 sm:py-8 relative flex items-center justify-between">
        <button
          onClick={handleBack}
          className="text-orange-500 hover:text-orange-600 transition-all duration-300 p-2 rounded-full hover:bg-orange-500/10 active:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/30 z-10"
          aria-label="Go back"
        >
          <ChevronLeft size={24} className="sm:w-[30px] sm:h-[30px]" />
        </button>

        <div className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2 w-full max-w-[200px] sm:max-w-none pointer-events-none">
          <h1 className="text-gray-100 text-2xl sm:text-3xl font-medium text-center pointer-events-auto">
            Help & FAQ's
          </h1>
          <p className="text-orange-100/60 text-xs sm:text-sm mt-1 text-center pointer-events-auto">
            Everything you need to know.
          </p>
        </div>

        {/* Search Icon */}
        <button
          onClick={() => setIsSearchActive(!isSearchActive)}
          className="text-white hover:text-orange-400 transition-all duration-300 p-2 rounded-full hover:bg-white/10 active:bg-white/20 focus:outline-none z-10"
          aria-label="Search FAQs"
        >
          <Search size={22} className="sm:w-[24px] sm:h-[24px]" />
        </button>
      </div>

      {/* Search Bar (appears when search is active) */}
      <AnimatePresence>
        {isSearchActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6 pb-4 relative z-20"
          >
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-md text-white placeholder-gray-400 rounded-full px-5 py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-white/20 text-sm sm:text-base"
                autoFocus
              />
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center items-center pt-0 sm:pt-12 px-0 sm:px-4 min-h-[85vh]">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-mobile-shell md:max-w-4xl lg:max-w-6xl mx-auto"
        >
          {/* Main Card */}
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden w-full">
            <div className="p-4 sm:p-8">
              {/* Category Filter - was below search bar, now top item */}

              {/* Category Filter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6 sm:mb-8"
              >
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                  Categories
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory('all')}
                    className={`p-2 sm:p-3 rounded-xl border-2 transition-all ${
                      selectedCategory === 'all'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg flex items-center justify-center mr-2">
                        <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">All</span>
                    </div>
                  </motion.button>

                  {faqCategories.map((category) => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-2 sm:p-3 rounded-xl border-2 transition-all ${
                        selectedCategory === category.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center mr-2`}
                        >
                          {React.cloneElement(category.icon, {
                            className: 'w-3.5 h-3.5 sm:w-5 sm:h-5 text-white',
                          })}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{category.title}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* FAQ List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3 sm:space-y-4 mb-6 sm:mb-8"
              >
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                  {filteredFaqs.length > 0
                    ? `Found ${filteredFaqs.length} question${filteredFaqs.length !== 1 ? 's' : ''}`
                    : 'No questions found'}
                </h3>

                <AnimatePresence>
                  {filteredFaqs.map((faq, index) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden"
                    >
                      <button
                        onClick={() => handleFaqToggle(faq.id)}
                        className="w-full p-3 sm:p-6 text-left flex items-start sm:items-center justify-between hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 pr-2">
                          <h4 className="font-semibold text-xs sm:text-base text-gray-800 mb-0.5 sm:mb-1">
                            {faq.question}
                          </h4>
                          <p className="text-[10px] sm:text-sm text-gray-500">
                            {faqCategories.find((cat) => cat.id === faq.category)?.title}
                          </p>
                        </div>
                        <div className="mt-0.5 sm:mt-0">
                          {expandedFaq === faq.id ? (
                            <ChevronUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedFaq === faq.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 sm:px-6 sm:pb-6">
                              <div className="border-t border-gray-200 pt-2 sm:pt-4">
                                <p className="text-xs sm:text-base text-gray-700 leading-relaxed">
                                  {faq.answer}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Contact Support */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-blue-100"
              >
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-4 text-center">
                  Still Need Help?
                </h3>
                <p className="text-xs sm:text-base text-gray-600 text-center mb-3 sm:mb-6">
                  Can't find what you're looking for? Our support team is here to help!
                </p>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContactSupport}
                    className="flex flex-col sm:flex-row items-center justify-center p-3 sm:p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group text-center sm:text-left"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs sm:text-base text-gray-800">
                        Contact Support
                      </p>
                      <p className="text-[10px] sm:text-sm text-gray-600 hidden sm:block">
                        Send us a message
                      </p>
                    </div>
                  </motion.button>

                  {restaurant.contact_phone && (
                    <motion.a
                      href={`tel:${restaurant.contact_phone}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex flex-col sm:flex-row items-center justify-center p-3 sm:p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group text-center sm:text-left"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 group-hover:scale-110 transition-transform">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs sm:text-base text-gray-800">Call Us</p>
                        <p className="text-[10px] sm:text-sm text-gray-600 hidden sm:block">
                          Speak directly
                        </p>
                      </div>
                    </motion.a>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpFAQPage;
