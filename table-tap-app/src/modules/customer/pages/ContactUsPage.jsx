import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, MapPin, Phone, Mail, Globe, MessageCircle, Send, Building, Users, Clock, CheckCircle, AlertCircle, Instagram, Facebook, FileText, Hash, Star, MessageSquare, Medal, Heart, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../../shared/api/authService';
import { supabase } from '../../shared/supabase';
import { Link } from 'react-router-dom'; // If you want to use a link
import LoadingScreen from '../../shared/components/LoadingScreen';

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

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          // Try to get full profile for name
          let name = user.user_metadata?.full_name || user.user_metadata?.name || '';
          let email = user.email || '';
          // Optionally, fetch profile for more accurate name
          try {
            const profile = await authService.getProfile(user.id);
            if (profile?.full_name) name = profile.full_name;
            if (profile?.email) email = profile.email;
          } catch { }
          setContactForm(prev => ({
            ...prev,
            name,
            email
          }));
        }
      } catch (err) {
        // Not authenticated or error, do nothing
      }
    }
    fetchUser();
  }, []);

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
      if (!restaurant?.contact_email && !restaurant?.email) {
        throw new Error('Restaurant contact email not available');
      }

      // 1. Send Email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: restaurant.contact_email || restaurant.email,
          replyTo: contactForm.email,
          subject: `New Message from ${contactForm.name}: ${contactForm.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; border-bottom: 2px solid #f97316; padding-bottom: 10px;">New Contact Message</h2>
              <p><strong>From:</strong> ${contactForm.name} (${contactForm.email})</p>
              <p><strong>Subject:</strong> ${contactForm.subject}</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="margin: 0; color: #555; white-space: pre-wrap;">${contactForm.message}</p>
              </div>
              <p style="color: #888; font-size: 12px; margin-top: 20px;">Sent via TableTap Contact Form</p>
            </div>
          `
        }
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue to save to DB even if email fails? Maybe. Let's try to save to DB anyway.
      }

      // 2. Save message to Database
      // Get current user ID if logged in
      let userId = null;
      try {
        const user = await authService.getCurrentUser();
        userId = user?.id || null;
      } catch (e) {
        console.warn('Could not fetch user for message logging', e);
      }

      const { error: dbError } = await supabase
        .from('customer_messages')
        .insert([
          {
            restaurant_id: restaurant.id,
            name: contactForm.name,
            email: contactForm.email,
            subject: contactForm.subject,
            message: contactForm.message,
            status: 'unread',
            user_id: userId
          }
        ]);

      if (dbError) {
        console.error('Database save failed:', dbError);
        throw dbError; // If DB fails, we probably want to show error
      }

      // If either succeeded (or both), we can consider it a success, 
      // but if DB fails we threw above.

      setSubmitStatus('success');
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitStatus(null), 3000);

    } catch (error) {
      console.error('Failed to send message:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  }, [contactForm, restaurant]);

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
    return <LoadingScreen message="Loading contact info..." variant="page" />;
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
            className="px-8 py-3 bg-gradient-to-r from-primary-500 to-red-500 text-white rounded-2xl hover:from-primary-600 hover:to-red-600 transition-all duration-300 shadow-lg"
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
      color: 'from-primary-400 to-primary-600',
      textColor: 'text-primary-600',
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
      icon: Utensils,
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
    <div className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl flex flex-col mx-auto">
      {/* Header */}
      <div className="w-full px-6 py-6 sm:py-8 relative flex items-center justify-center">
        <button
          onClick={handleBack}
          className="absolute left-4 text-primary-500 hover:text-primary-600 transition-all duration-300 p-2 rounded-full hover:bg-primary-500/10 active:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-500/30 z-10 top-1/2 transform -translate-y-1/2"
          aria-label="Go back"
        >
          <ChevronLeft size={24} className="md:w-[30px] md:h-[30px]" />
        </button>

        <div className="flex flex-col items-center">
          <h1 className="text-gray-100 text-2xl md:text-3xl font-medium text-center">
            Contact Us
          </h1>
          <p className="text-primary-100/60 text-xs md:text-sm mt-1 text-center">We'd love to hear from you!</p>
        </div>
      </div>

      <div className="flex justify-center items-center py-0 md:py-4 px-0 md:px-1 min-h-[85vh]">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[390px] md:max-w-4xl lg:max-w-6xl mx-auto"
        >
          {/* Main Card */}
          <div className="bg-white rounded-t-3xl md:rounded-t-[30px] shadow-xl overflow-hidden w-full">
            {/* Restaurant Header */}
            <div className="relative p-4 md:p-6 text-black border-b border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mr-3 md:mr-4">
                  {restaurant.logo_url ? (
                    <img
                      src={restaurant.logo_url}
                      alt={restaurant.name}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <Building className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl md:text-3xl font-bold mb-0.5 md:mb-1 text-gray-900">{restaurant.name}</h2>
                  <p className="text-gray-500 text-xs md:text-base">{restaurant.description || 'Get in touch with us'}</p>
                </div>
              </div>
              {tableNumber && (
                <div className="flex flex-row items-center justify-center mt-2 gap-2 md:gap-3 w-full overflow-x-auto no-scrollbar">
                  <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1.5 md:px-4 md:py-2 border border-gray-200 whitespace-nowrap">
                    <Users className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2 text-gray-500" />
                    <span className="font-semibold text-sm md:text-base text-gray-700">Table {tableNumber}</span>
                  </div>
                  <motion.button
                    onClick={() => {
                      if (restaurant.google_maps_link) {
                        window.open(restaurant.google_maps_link, '_blank');
                      } else {
                        handleGoogleMapsFeedback();
                      }
                    }}
                    className="flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-primary-400 to-primary-600 text-white rounded-full font-spartan-medium shadow-lg border-2 border-primary-500 hover:scale-105 transition-transform duration-200 whitespace-nowrap"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  >
                    <Heart className="w-4 h-4 md:w-6 md:h-6 drop-shadow heart-beat-fill" fill="white" stroke="none" />
                    <span className="ml-1.5 md:ml-2 text-sm md:text-base font-spartan-medium">Rate Us</span>
                  </motion.button>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6">
              {/* Contact Info - Responsive 2-column grid */}
              <div className="p-0 md:p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 font-spartan mb-6 md:mb-8">
                {contactInfo.map((info, idx) => (
                  <div key={info.title} className="flex flex-col h-full bg-gray-50 rounded-2xl border border-gray-200 p-3 md:p-4">
                    <div className="flex items-center gap-3 mb-2 w-full">
                      <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-black rounded-lg flex items-center justify-center">
                        <info.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-semibold text-gray-500">{info.title}</h3>
                        {info.link ? (
                          <a
                            href={info.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-900 text-xs md:text-sm font-medium block break-words hover:underline leading-tight"
                          >
                            {info.value || 'Not available'}
                          </a>
                        ) : (
                          <p className="text-gray-900 text-xs md:text-sm font-medium break-words leading-tight">{info.value || 'Not available'}</p>
                        )}
                      </div>
                      {info.link && info.action && (
                        <button
                          onClick={() => window.open(info.link, '_blank')}
                          className="ml-2 px-2 py-1.5 md:px-3 md:py-2 bg-primary-500 text-white rounded-lg md:rounded-xl font-medium hover:bg-primary-600 transition-colors text-[10px] md:text-xs shadow whitespace-nowrap"
                        >
                          {info.action}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Restaurant Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 mb-6 md:mb-8"
              >
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Restaurant Information</h3>
                <div className="grid md:grid-cols-3 gap-3 md:gap-4">
                  {additionalInfo
                    .filter(info => !!info.value)
                    .map((info, index) => (
                      <div key={info.title} className="flex items-center">
                        <div className={`w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br ${info.color} rounded-lg flex items-center justify-center mr-3`}>
                          <info.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-500 font-medium">{info.title}</p>
                          <p className="text-xs md:text-sm text-gray-800 font-semibold">
                            {info.value}
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
                  className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 mb-6 md:mb-8"
                >
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 text-center">Follow Us</h3>
                  <div className="flex justify-center space-x-3 md:space-x-4">
                    {restaurant.social_media?.instagram && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSocialMediaClick('instagram')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 md:p-4 rounded-xl hover:shadow-lg transition-all duration-300"
                      >
                        <Instagram className="w-5 h-5 md:w-6 md:h-6" />
                      </motion.button>
                    )}
                    {restaurant.social_media?.facebook && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSocialMediaClick('facebook')}
                        className="bg-blue-600 text-white p-3 md:p-4 rounded-xl hover:shadow-lg transition-all duration-300"
                      >
                        <Facebook className="w-5 h-5 md:w-6 md:h-6" />
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
                className="bg-gray-50 rounded-2xl p-4 md:p-8 border border-gray-100"
              >
                <div className="flex items-center mb-6 md:mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-3 md:p-4 border border-blue-100 shadow-sm">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-md mr-3 md:mr-5">
                    <MessageCircle className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg md:text-3xl font-extrabold text-gray-800 leading-tight mb-0.5 md:mb-1">
                      Send us a Message
                    </h2>
                    <p className="text-gray-500 text-xs md:text-lg font-medium break-words">
                      We'd love to hear from you!
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Your Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="name"
                          value={contactForm.name}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField('name')}
                          onBlur={() => setActiveField(null)}
                          required
                          className={`w-full px-4 py-3 md:py-4 border-2 rounded-xl transition-all duration-300 text-sm md:text-base ${activeField === 'name'
                            ? 'border-primary-500 bg-primary-50/50'
                            : 'border-gray-200 hover:border-gray-300'
                            } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                          placeholder="Enter your name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={contactForm.email}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField('email')}
                          onBlur={() => setActiveField(null)}
                          required
                          className={`w-full px-4 py-3 md:py-4 border-2 rounded-xl transition-all duration-300 text-sm md:text-base ${activeField === 'email'
                            ? 'border-primary-500 bg-primary-50/50'
                            : 'border-gray-200 hover:border-gray-300'
                            } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Subject</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="subject"
                        value={contactForm.subject}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField('subject')}
                        onBlur={() => setActiveField(null)}
                        required
                        className={`w-full px-4 py-3 md:py-4 border-2 rounded-xl transition-all duration-300 text-sm md:text-base ${activeField === 'subject'
                          ? 'border-primary-500 bg-primary-50/50'
                          : 'border-gray-200 hover:border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                        placeholder="What's this about?"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Message</label>
                    <div className="relative">
                      <textarea
                        name="message"
                        value={contactForm.message}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField('message')}
                        onBlur={() => setActiveField(null)}
                        required
                        rows={5}
                        className={`w-full px-4 py-3 md:py-4 border-2 rounded-xl transition-all duration-300 resize-none text-sm md:text-base ${activeField === 'message'
                          ? 'border-primary-500 bg-primary-50/50'
                          : 'border-gray-200 hover:border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
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
                        className={`p-3 md:p-4 rounded-xl flex items-center ${submitStatus === 'success'
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                          }`}
                      >
                        {submitStatus === 'success' ? (
                          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 text-red-600" />
                        )}
                        <span className="font-medium text-sm md:text-base">
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
                    className="w-full py-3 md:py-4 px-6 bg-gradient-to-r from-primary-500 to-red-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl text-sm md:text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 md:mr-3"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
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