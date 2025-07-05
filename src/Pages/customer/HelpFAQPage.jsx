import React, { useState, useCallback } from 'react';
import { ArrowLeft, Search, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Phone, Mail, Clock, Star, BookOpen, Shield, CreditCard, Truck, User, Settings, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../Restaurantselection/RestaurantContext';
import { motion, AnimatePresence } from 'framer-motion';

const HelpFAQPage = () => {
  const { restaurant, loading, error, tableNumber } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleFaqToggle = useCallback((faqId) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  }, [expandedFaq]);

  const handleContactSupport = useCallback(() => {
    navigate('/contact');
  }, [navigate]);

  const faqCategories = [
    {
      id: 'ordering',
      title: 'Ordering & Menu',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'from-orange-400 to-red-500'
    },
    {
      id: 'payment',
      title: 'Payment & Billing',
      icon: <CreditCard className="w-5 h-5" />,
      color: 'from-green-400 to-blue-500'
    },
    {
      id: 'delivery',
      title: 'Service & Delivery',
      icon: <Truck className="w-5 h-5" />,
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: <User className="w-5 h-5" />,
      color: 'from-blue-400 to-indigo-500'
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'from-yellow-400 to-orange-500'
    },
    {
      id: 'safety',
      title: 'Safety & Security',
      icon: <Shield className="w-5 h-5" />,
      color: 'from-red-400 to-pink-500'
    }
  ];

  const faqData = [
    // Ordering & Menu
    {
      id: 'order-1',
      category: 'ordering',
      question: 'How do I place an order?',
      answer: 'Simply browse our menu, add items to your cart, and proceed to checkout. You can customize your order with special instructions and dietary preferences.'
    },
    {
      id: 'order-2',
      category: 'ordering',
      question: 'Can I modify my order after placing it?',
      answer: 'Orders can be modified within 2 minutes of placement. Contact our staff immediately if you need to make changes to your order.'
    },
    {
      id: 'order-3',
      category: 'ordering',
      question: 'What if an item is out of stock?',
      answer: 'If an item becomes unavailable, we\'ll notify you immediately and offer alternatives or a refund for that item.'
    },
    {
      id: 'order-4',
      category: 'ordering',
      question: 'How do I know my order status?',
      answer: 'Track your order in real-time through the order tracking feature. You\'ll receive notifications at each stage of preparation.'
    },

    // Payment & Billing
    {
      id: 'payment-1',
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, digital wallets (PayPal, Apple Pay, Google Pay), and cash payments at the restaurant.'
    },
    {
      id: 'payment-2',
      category: 'payment',
      question: 'Is my payment information secure?',
      answer: 'Yes, we use industry-standard encryption and secure payment gateways to protect your payment information.'
    },
    {
      id: 'payment-3',
      category: 'payment',
      question: 'Can I get a refund?',
      answer: 'Refunds are processed within 3-5 business days. Contact our support team for any billing issues or disputes.'
    },
    {
      id: 'payment-4',
      category: 'payment',
      question: 'Do you offer any discounts?',
      answer: 'Yes! Check our offers section for current promotions, first-time user discounts, and loyalty rewards.'
    },

    // Service & Delivery
    {
      id: 'delivery-1',
      category: 'delivery',
      question: 'How long does food preparation take?',
      answer: 'Typical preparation time is 15-25 minutes, depending on order complexity and current restaurant volume.'
    },
    {
      id: 'delivery-2',
      category: 'delivery',
      question: 'What if my food arrives late or cold?',
      answer: 'We guarantee food quality and timely service. If you experience issues, contact us immediately for resolution.'
    },
    {
      id: 'delivery-3',
      category: 'delivery',
      question: 'Can I request special dietary accommodations?',
      answer: 'Absolutely! We accommodate various dietary needs including vegetarian, vegan, gluten-free, and allergen-free options.'
    },
    {
      id: 'delivery-4',
      category: 'delivery',
      question: 'What are your operating hours?',
      answer: `Our current operating hours are: ${restaurant?.opening_hours || 'Please check our contact page for current hours.'}`
    },

    // Account & Profile
    {
      id: 'account-1',
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Sign up using your email or social media accounts. You can also order as a guest without creating an account.'
    },
    {
      id: 'account-2',
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Go to your profile page to update personal information, delivery addresses, and payment methods.'
    },
    {
      id: 'account-3',
      category: 'account',
      question: 'Can I save my favorite orders?',
      answer: 'Yes! Create an account to save your favorite items and reorder them quickly in the future.'
    },
    {
      id: 'account-4',
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Use the "Forgot Password" option on the login page. You\'ll receive a reset link via email.'
    },

    // Technical Support
    {
      id: 'tech-1',
      category: 'technical',
      question: 'The app is not working properly. What should I do?',
      answer: 'Try refreshing the page, clearing your browser cache, or updating to the latest version. Contact support if issues persist.'
    },
    {
      id: 'tech-2',
      category: 'technical',
      question: 'I can\'t access the menu or place orders.',
      answer: 'Check your internet connection and ensure you\'re using a supported browser. Contact our technical support for assistance.'
    },
    {
      id: 'tech-3',
      category: 'technical',
      question: 'How do I enable notifications?',
      answer: 'Allow notifications when prompted by your browser. You can manage notification settings in your browser preferences.'
    },
    {
      id: 'tech-4',
      category: 'technical',
      question: 'Is the app available on mobile devices?',
      answer: 'Yes! Our web app is fully responsive and works on all mobile devices and tablets.'
    },

    // Safety & Security
    {
      id: 'safety-1',
      category: 'safety',
      question: 'What safety measures do you follow?',
      answer: 'We follow strict food safety protocols, regular sanitization, and maintain high hygiene standards in our kitchen.'
    },
    {
      id: 'safety-2',
      category: 'safety',
      question: 'How do you handle food allergies?',
      answer: 'We take food allergies seriously. Clearly communicate any allergies when ordering, and our staff will ensure safe preparation.'
    },
    {
      id: 'safety-3',
      category: 'safety',
      question: 'Is my personal information secure?',
      answer: 'We protect your personal information with industry-standard security measures and never share it with third parties.'
    },
    {
      id: 'safety-4',
      category: 'safety',
      question: 'What if I have a complaint about food quality?',
      answer: 'Contact us immediately with details about your concern. We take all complaints seriously and will address them promptly.'
    }
  ];

  // Filter FAQs based on search and category
  const filteredFaqs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-red-500/30 border-b-red-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
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
    <div className="min-h-screen bg-black">
      {/* Sticky Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10"
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="flex items-center text-white/80 hover:text-white transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back</span>
          </motion.button>
          <h1 className="text-xl font-bold text-white">Help & FAQ</h1>
          <div className="w-20" />
        </div>
      </motion.div>

      <div className="flex justify-center items-center py-12 px-4 min-h-[85vh]">
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-4xl"
        >
          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-8 text-white">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4">
                    <HelpCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-1">Help & FAQ</h2>
                    <p className="text-white/80">Find answers to common questions</p>
                  </div>
                </div>
                
                {/* Table Number Badge - Centered */}
                {tableNumber && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center"
                  >
                    <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
                      <User className="w-5 h-5 mr-2" />
                      <span className="font-semibold text-lg">Table {tableNumber}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="p-8">
              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-8"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </motion.div>

              {/* Category Filter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory('all')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedCategory === 'all'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg flex items-center justify-center mr-2">
                        <HelpCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">All</span>
                    </div>
                  </motion.button>
                  
                  {faqCategories.map((category) => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedCategory === category.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center mr-2`}>
                          {category.icon}
                        </div>
                        <span className="text-sm font-medium">{category.title}</span>
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
                className="space-y-4 mb-8"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {filteredFaqs.length > 0 
                    ? `Found ${filteredFaqs.length} question${filteredFaqs.length !== 1 ? 's' : ''}`
                    : 'No questions found'
                  }
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
                        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">{faq.question}</h4>
                          <p className="text-sm text-gray-500">
                            {faqCategories.find(cat => cat.id === faq.category)?.title}
                          </p>
                        </div>
                        <div className="ml-4">
                          {expandedFaq === faq.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
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
                            <div className="px-6 pb-6">
                              <div className="border-t border-gray-200 pt-4">
                                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
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
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Still Need Help?</h3>
                <p className="text-gray-600 text-center mb-6">
                  Can't find what you're looking for? Our support team is here to help!
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContactSupport}
                    className="flex items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">Contact Support</p>
                      <p className="text-sm text-gray-600">Send us a message</p>
                    </div>
                  </motion.button>

                  {restaurant.contact_phone && (
                    <motion.a
                      href={`tel:${restaurant.contact_phone}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">Call Us</p>
                        <p className="text-sm text-gray-600">Speak directly</p>
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