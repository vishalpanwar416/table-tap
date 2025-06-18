import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, MapPin, Clock, Instagram, Facebook } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

const ContactPopup = ({ isOpen, onClose }) => {
  const { restaurant } = useRestaurant();

  const popupVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const handlePhoneClick = () => {
    if (restaurant.contact_phone) {
      window.open(`tel:${restaurant.contact_phone}`, '_self');
    }
  };

  const handleEmailClick = () => {
    if (restaurant.contact_email) {
      window.open(`mailto:${restaurant.contact_email}`, '_self');
    }
  };

  const handleLocationClick = () => {
    if (restaurant.google_maps_link) {
      window.open(restaurant.google_maps_link, '_blank');
    }
  };

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

  const handleOverlayClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  const handlePopupClick = (e) => {
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="contact-overlay"
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999] backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleOverlayClick}
          />
          
          <motion.div
            key="contact-popup"
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] w-full max-w-md mx-4"
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handlePopupClick}
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white text-center">Contact Us</h2>
                <p className="text-orange-100 text-center mt-1">We'd love to hear from you!</p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Restaurant Info */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{restaurant.name}</h3>
                  <p className="text-gray-600 text-sm">{restaurant.description}</p>
                </div>

                {/* Contact Methods */}
                <div className="space-y-4">
                  {/* Phone */}
                  <button
                    onClick={handlePhoneClick}
                    className="w-full flex items-center p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group"
                  >
                    <div className="bg-orange-500 rounded-full p-3 mr-4 group-hover:bg-orange-600 transition-colors">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">Call Us</p>
                      <p className="text-gray-600 text-sm">{restaurant.contact_phone}</p>
                    </div>
                  </button>

                  {/* Email */}
                  <button
                    onClick={handleEmailClick}
                    className="w-full flex items-center p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group"
                  >
                    <div className="bg-orange-500 rounded-full p-3 mr-4 group-hover:bg-orange-600 transition-colors">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">Email Us</p>
                      <p className="text-gray-600 text-sm">{restaurant.contact_email}</p>
                    </div>
                  </button>

                  {/* Location */}
                  <button
                    onClick={handleLocationClick}
                    className="w-full flex items-center p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group"
                  >
                    <div className="bg-orange-500 rounded-full p-3 mr-4 group-hover:bg-orange-600 transition-colors">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">Visit Us</p>
                      <p className="text-gray-600 text-sm">{restaurant.address}</p>
                    </div>
                  </button>

                  {/* Opening Hours */}
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <div className="bg-gray-500 rounded-full p-3 mr-4">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">Opening Hours</p>
                      <p className="text-gray-600 text-sm">{restaurant.opening_hours}</p>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                {(restaurant.social_media?.instagram || restaurant.social_media?.facebook) && (
                  <div className="border-t pt-4">
                    <p className="text-gray-800 font-medium mb-3 text-center">Follow Us</p>
                    <div className="flex justify-center space-x-4">
                      {restaurant.social_media?.instagram && (
                        <button
                          onClick={() => handleSocialMediaClick('instagram')}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-full hover:scale-110 transition-transform"
                        >
                          <Instagram className="w-5 h-5" />
                        </button>
                      )}
                      {restaurant.social_media?.facebook && (
                        <button
                          onClick={() => handleSocialMediaClick('facebook')}
                          className="bg-blue-600 text-white p-3 rounded-full hover:scale-110 transition-transform"
                        >
                          <Facebook className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cuisine Type:</span>
                    <span className="font-medium">{restaurant.cuisine_type}</span>
                  </div>
                  {restaurant.gst_number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST Number:</span>
                      <span className="font-medium">{restaurant.gst_number}</span>
                    </div>
                  )}
                  {restaurant.fssai_license && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">FSSAI License:</span>
                      <span className="font-medium">{restaurant.fssai_license}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContactPopup; 