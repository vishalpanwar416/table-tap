import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabase';

const RestaurantContext = createContext();

// Default restaurant information that will be accessible to all users
const defaultRestaurant = {
  id: "1",
  name: "Spice Paradise",
  address: "123 Food Street, Flavor City",
  logo_url: "/images/spice-paradise-logo.png",
  location: null, // Example: 'POINT(77.5946 12.9716)'
  razorpay_key_id: "rzp_test_o8AUsxck5OfCWm",
  currency: "INR",
  description: "Authentic Indian cuisine with a modern twist.",
  contact_phone: "+91 9876543210",
  contact_email: "info@spiceparadise.com",
  opening_hours: "Mon-Sun: 11am-11pm",
  cuisine_type: "Indian",
  google_maps_link: "https://maps.google.com/?q=SpiceParadise",
  gst_number: "29AADCB2230M1ZP",
  fssai_license: "12345678901234",
  social_media: {
    instagram: "@spiceparadise",
    facebook: "SpiceParadiseOfficial"
  },
  created_at: null, // Example: new Date().toISOString()
  updated_at: null  // Example: new Date().toISOString()
};

export const RestaurantProvider = ({ children }) => {
  const [restaurant, setRestaurant] = useState(defaultRestaurant);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Replace '1' with the actual restaurant id as needed
    const fetchRestaurant = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', defaultRestaurant.id)
        .single();
      if (error) {
        setError(error.message);
      } else if (data) {
        setRestaurant(data);
      }
      setLoading(false);
    };
    fetchRestaurant();
  }, []);

  const updateRestaurant = (updates) => {
    setRestaurant(prev => ({ ...prev, ...updates }));
    return true;
  };

  const value = {
    restaurant,
    updateRestaurant,
    loading,
    error
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};