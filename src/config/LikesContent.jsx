import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

const LikesContext = createContext();

export const LikesProvider = ({ children }) => {
  const [likedItems, setLikedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Use the centralized auth context

  // Load liked items when user changes
  useEffect(() => {
    if (user) {
      loadUserLikes(user.id);
    } else {
      setLikedItems([]);
      setLoading(false);
    }
  }, [user]);

  // Load user liked items from profiles table
  const loadUserLikes = async (userId) => {
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
        return;
      }

      // Convert liked items from JSONB to our format
      if (profile?.liked_items && profile.liked_items.length > 0) {
        const { data: foodItems, error: foodError } = await supabase
          .from('fooditems')
          .select('*')
          .in('id', profile.liked_items)
          .eq('is_active', true);

        if (foodError) {
          console.error('Error fetching liked food items:', foodError);
          setLikedItems([]);
        } else {
          setLikedItems(foodItems || []);
        }
      } else {
        setLikedItems([]);
      }
    } catch (error) {
      console.error('Error loading user likes:', error);
      setLikedItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Update liked items in profiles table
  const updateLikedItemsInDB = async (newLikedItems) => {
    if (!user) return;

    try {
      // Convert to array of IDs for JSONB storage
      const likedItemIds = newLikedItems.map(item => item.id);

      const { error } = await supabase
        .from('profiles')
        .update({ liked_items: likedItemIds })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating liked items:', error);
    }
  };

  const toggleLike = async (item) => {
    if (!user) {
      console.error('User must be logged in to like items');
      return;
    }

    const existingIndex = likedItems.findIndex(li => li.id === item.id);
    let newLikedItems;

    if (existingIndex > -1) {
      // Remove from likes
      newLikedItems = likedItems.filter((_, index) => index !== existingIndex);
    } else {
      // Add to likes
      newLikedItems = [...likedItems, item];
    }

    setLikedItems(newLikedItems);
    await updateLikedItemsInDB(newLikedItems);
  };

  // Check if an item is liked
  const isLiked = (itemId) => {
    return likedItems.some(item => item.id === itemId);
  };

  // Clear all likes (optional utility function)
  const clearAllLikes = async () => {
    if (!user) return;

    setLikedItems([]);
    await updateLikedItemsInDB([]);
  };

  return (
    <LikesContext.Provider value={{ 
      likedItems, 
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