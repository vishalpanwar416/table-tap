import React, { useState, useCallback } from 'react';
import { ArrowLeft, MapPin, Phone, Mail, Globe, MessageCircle, Send, Building, Users, Clock, CheckCircle, AlertCircle, Instagram, Facebook, FileText, Hash, Star, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../Restaurantselection/RestaurantContext';
import { motion, AnimatePresence } from 'framer-motion';

const ContactUsPage = () => {
  const { restaurant, loading, error, tableNumber } = useRestaurant();
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitStatus('success');
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitStatus(null), 3000);
    } catch (error) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSocialMediaClick = (platform) => {
    if (platform === 'instagram' && restaurant.social_media?.instagram) {
      const instagramHandle = restaurant.social_media.instagram.startsWith('@') 
        ? restaurant.social_media.instagram 
        : `@${restaurant.social_media.instagram}`;
      window.open(`https://instagram.com/${instagramHandle.substring(1)}`, '_blank');
    } else if (platform === 'facebook' && restaurant.social_media?.facebook) {
      window.open(`https://facebook.com/${restaurant.social_media.facebook}`, '_blank');
    }
  };

  const handleGoogleMapsFeedback = () => {
    if (restaurant.google_maps_link) {
      // Extract place ID from Google Maps link if available
      const placeIdMatch = restaurant.google_maps_link.match(/place_id=([^&]+)/);
      if (placeIdMatch) {
        const placeId = placeIdMatch[1];
        window.open(`https://www.google.com/maps/place/?q=place_id:${placeId}&action=review`, '_blank');
      } else {
        // Fallback: search for restaurant name and address
        const searchQuery = encodeURIComponent(`${restaurant.name} ${restaurant.address || ''}`);
        window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
      }
    } else if (restaurant.address) {
      // If no Google Maps link, search by name and address
      const searchQuery = encodeURIComponent(`${restaurant.name} ${restaurant.address}`);
      window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
    } else {
      // Fallback: just search by restaurant name
      const searchQuery = encodeURIComponent(restaurant.name);
      window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
    }
  };

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

  // Debug: Log restaurant data to console

  // Build contact info array with proper null handling
  const contactInfo = [
    {
      icon: MapPin,
      title: 'Address',
      value: restaurant.address,
      color: 'from-orange-400 to-orange-600',
      textColor: 'text-orange-600',
      link: restaurant.google_maps_link,
      action: restaurant.google_maps_link ? 'Get Directions' : 'Search on Maps',
      showAlways: true
    },
    {
      icon: Phone,
      title: 'Phone',
      value: restaurant.contact_phone,
      color: 'from-green-400 to-green-600',
      textColor: 'text-green-600',
      link: restaurant.contact_phone ? `tel:${restaurant.contact_phone}` : null,
      showAlways: true
    },
    {
      icon: Mail,
      title: 'Email',
      value: restaurant.contact_email,
      color: 'from-blue-400 to-blue-600',
      textColor: 'text-blue-600',
      link: restaurant.contact_email ? `mailto:${restaurant.contact_email}` : null,
      showAlways: true
    },
    {
      icon: Clock,
      title: 'Opening Hours',
      value: restaurant.opening_hours,
      color: 'from-yellow-400 to-yellow-600',
      textColor: 'text-yellow-600',
      link: null,
      showAlways: true
    }
  ];

  // Build additional info array
  const additionalInfo = [
    {
      icon: Hash,
      title: 'Cuisine Type',
      value: restaurant.cuisine_type,
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: FileText,
      title: 'GST Number',
      value: restaurant.gst_number,
      color: 'from-indigo-400 to-indigo-600'
    },
    {
      icon: FileText,
      title: 'FSSAI License',
      value: restaurant.fssai_license,
      color: 'from-teal-400 to-teal-600'
    }
  ];

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
          <h1 className="text-xl font-bold text-white">Contact Us</h1>
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
            
            {/* Restaurant Header */}
            <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 p-8 text-white">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4">
                    {restaurant.logo_url ? (
                      <img 
                        src={restaurant.logo_url} 
                        alt={restaurant.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <Building className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-1">{restaurant.name}</h2>
                    <p className="text-white/80">{restaurant.description || 'Get in touch with us'}</p>
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
                      <Users className="w-5 h-5 mr-2" />
                      <span className="font-semibold text-lg">Table {tableNumber}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="p-8">
              {/* Contact Information Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {contactInfo.map((info, index) => (
                  <motion.div
                    key={info.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    {info.link ? (
                      <a
                        href={info.link}
                        target={info.title === 'Address' ? '_blank' : undefined}
                        rel={info.title === 'Address' ? 'noopener noreferrer' : undefined}
                        className="block"
                      >
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                          <div className={`w-12 h-12 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                            <info.icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-gray-800 mb-2">{info.title}</h3>
                          <p className="text-gray-600 text-sm mb-1">
                            {info.value || `${info.title} not available`}
                          </p>
                          {info.action && (
                            <p className={`text-xs ${info.textColor} font-medium`}>{info.action}</p>
                          )}
                        </div>
                      </a>
                    ) : (
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <div className={`w-12 h-12 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center mb-4`}>
                          <info.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">{info.title}</h3>
                        <p className="text-gray-600 text-sm">
                          {info.value || `${info.title} not available`}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 mb-8"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Quick Actions</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleMapsFeedback}
                    className="flex items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">Give Us Feedback</p>
                      <p className="text-sm text-gray-600">Rate us on Google Maps</p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">Send Message</p>
                      <p className="text-sm text-gray-600">Contact us directly</p>
                    </div>
                  </motion.button>
                </div>
              </motion.div>

              {/* Additional Restaurant Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Restaurant Information</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {additionalInfo.map((info, index) => (
                    <div key={info.title} className="flex items-center">
                      <div className={`w-8 h-8 bg-gradient-to-br ${info.color} rounded-lg flex items-center justify-center mr-3`}>
                        <info.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{info.title}</p>
                        <p className="text-sm text-gray-800 font-semibold">
                          {info.value || 'Not available'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Social Media */}
              {(restaurant.social_media?.instagram || restaurant.social_media?.facebook) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Follow Us</h3>
                  <div className="flex justify-center space-x-4">
                    {restaurant.social_media?.instagram && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSocialMediaClick('instagram')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl hover:shadow-lg transition-all duration-300"
                      >
                        <Instagram className="w-6 h-6" />
                      </motion.button>
                    )}
                    {restaurant.social_media?.facebook && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSocialMediaClick('facebook')}
                        className="bg-blue-600 text-white p-4 rounded-xl hover:shadow-lg transition-all duration-300"
                      >
                        <Facebook className="w-6 h-6" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Contact Form */}
              <motion.div
                id="contact-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Send us a Message</h2>
                    <p className="text-gray-500">We'd love to hear from you!</p>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="name"
                          value={contactForm.name}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField('name')}
                          onBlur={() => setActiveField(null)}
                          required
                          className={`w-full px-4 py-4 border-2 rounded-xl transition-all duration-300 ${
                            activeField === 'name' 
                              ? 'border-orange-500 bg-orange-50/50' 
                              : 'border-gray-200 hover:border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                          placeholder="Enter your name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={contactForm.email}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField('email')}
                          onBlur={() => setActiveField(null)}
                          required
                          className={`w-full px-4 py-4 border-2 rounded-xl transition-all duration-300 ${
                            activeField === 'email' 
                              ? 'border-orange-500 bg-orange-50/50' 
                              : 'border-gray-200 hover:border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="subject"
                        value={contactForm.subject}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField('subject')}
                        onBlur={() => setActiveField(null)}
                        required
                        className={`w-full px-4 py-4 border-2 rounded-xl transition-all duration-300 ${
                          activeField === 'subject' 
                            ? 'border-orange-500 bg-orange-50/50' 
                            : 'border-gray-200 hover:border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                        placeholder="What's this about?"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                    <div className="relative">
                      <textarea
                        name="message"
                        value={contactForm.message}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField('message')}
                        onBlur={() => setActiveField(null)}
                        required
                        rows={5}
                        className={`w-full px-4 py-4 border-2 rounded-xl transition-all duration-300 resize-none ${
                          activeField === 'message' 
                            ? 'border-orange-500 bg-orange-50/50' 
                            : 'border-gray-200 hover:border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {submitStatus && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className={`p-4 rounded-xl flex items-center ${
                          submitStatus === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        {submitStatus === 'success' ? (
                          <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 mr-3 text-red-600" />
                        )}
                        <span className="font-medium">
                          {submitStatus === 'success'
                            ? "Message sent successfully! We'll get back to you soon."
                            : "Failed to send message. Please try again."}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-3" />
                        Send Message
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactUsPage; 