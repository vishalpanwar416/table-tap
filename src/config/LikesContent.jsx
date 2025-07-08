import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import { useRestaurant } from '../Pages/Restaurantselection/RestaurantContext';

const LikesContext = createContext();

export const LikesProvider = ({ children }) => {
  const [likedItems, setLikedItems] = useState([]); // Only for current restaurant
  const [likedItemIds, setLikedItemIds] = useState([]); // Global list of liked item IDs
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { restaurantId } = useRestaurant();

  // Load liked items and IDs when user or restaurant changes
  useEffect(() => {
    if (user) {
      loadUserLikes(user.id, restaurantId);
    } else {
      setLikedItems([]);
      setLikedItemIds([]);
      setLoading(false);
    }
  }, [user, restaurantId]);

  // Load user liked items from profiles table, filtered by current restaurant
  const loadUserLikes = async (userId, currentRestaurantId) => {
    try {
      setLoading(true);
      // Get liked items from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('liked_items')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('Error loading user likes:', error);
        setLikedItems([]);
        setLikedItemIds([]);
        return;
      }
      // Set global liked item IDs
      if (profile?.liked_items && profile.liked_items.length > 0) {
        setLikedItemIds(profile.liked_items);
        // Only fetch liked items for the current restaurant
        const { data: foodItems, error: foodError } = await supabase
          .from('fooditems')
          .select('*')
          .in('id', profile.liked_items)
          .eq('is_active', true)
          .eq('restaurant_id', currentRestaurantId);
        if (foodError) {
          console.error('Error fetching liked food items:', foodError);
          setLikedItems([]);
        } else {
          setLikedItems(foodItems || []);
        }
      } else {
        setLikedItemIds([]);
        setLikedItems([]);
      }
    } catch (error) {
      console.error('Error loading user likes:', error);
      setLikedItems([]);
      setLikedItemIds([]);
    } finally {
      setLoading(false);
    }
  };

  // Update liked items in profiles table (global list)
  const updateLikedItemsInDB = async (likedItemIds) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ liked_items: likedItemIds })
        .eq('id', user.id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating liked items:', error);
    }
  };

  // Toggle like for an item (update global list, then filter for current restaurant)
  const toggleLike = async (item) => {
    if (!user) {
      console.error('User must be logged in to like items');
      return;
    }
    if (item.restaurant_id !== restaurantId) {
      console.error('Cannot like items from different restaurants');
      return;
    }
    let newLikedItemIds;
    if (likedItemIds.includes(item.id)) {
      newLikedItemIds = likedItemIds.filter(id => id !== item.id);
    } else {
      newLikedItemIds = [...likedItemIds, item.id];
    }
    setLikedItemIds(newLikedItemIds);
    // Update likedItems for the current restaurant only for UI
    try {
      const { data: foodItems, error } = await supabase
        .from('fooditems')
        .select('*')
        .in('id', newLikedItemIds)
        .eq('is_active', true)
        .eq('restaurant_id', restaurantId);
      if (error) {
        console.error('Error fetching liked food items:', error);
        setLikedItems([]);
      } else {
        setLikedItems(foodItems || []);
      }
    } catch (error) {
      setLikedItems([]);
    }
    await updateLikedItemsInDB(newLikedItemIds);
  };

  // Check if an item is liked (global)
  const isLiked = (itemId) => {
    return likedItemIds.includes(itemId);
  };

  // Clear all likes (optional utility function)
  const clearAllLikes = async () => {
    if (!user) return;
    setLikedItems([]);
    setLikedItemIds([]);
    await updateLikedItemsInDB([]);
  };

  return (
    <LikesContext.Provider value={{ 
      likedItems, // Only for current restaurant
      likedItemIds, // Global
      toggleLike, 
      isLiked, 
      clearAllLikes, 
      loading 
    }}>
      {children}
    </LikesContext.Provider>
  );
};

export const useLikes = () => {
  const context = useContext(LikesContext);
  if (!context) throw new Error('useLikes must be used within a LikesProvider');
  return context;
};