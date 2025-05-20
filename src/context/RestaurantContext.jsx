import React, { createContext, useState, useContext, useEffect } from 'react';

const RestaurantContext = createContext();

const defaultRestaurant = {
  id: "1",
  name: "Spice Paradise",
  address: "123 Food Street, Flavor City",
  logo_url: "/images/spice-paradise-logo.png",
  razorpay_key_id: "rzp_test_o8AUsxck5OfCWm",
  currency: "INR",
  theme_color: "#F37254",
  is_active: true,
  description: "Authentic Indian cuisine with a modern twist.",
  contact_phone: "+91 9876543210",
  contact_email: "info@spiceparadise.com",
  opening_hours: "Mon-Sun: 11am-11pm",
  cuisine_type: "Indian"
};

export const RestaurantProvider = ({ children }) => {
  const [restaurant, setRestaurant] = useState(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem('restaurantData');
    return saved ? JSON.parse(saved) : defaultRestaurant;
  });

  // Save to localStorage whenever restaurant changes
  useEffect(() => {
    localStorage.setItem('restaurantData', JSON.stringify(restaurant));
  }, [restaurant]);

  const updateRestaurant = (updates) => {
    setRestaurant(prev => ({ ...prev, ...updates }));
    return true;
  };

  const value = {
    restaurant,
    updateRestaurant
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