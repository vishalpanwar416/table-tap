import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../shared/supabase';
import { useAuth } from './AuthContext';
import { useRestaurant } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';

const LikesContext = createContext();

export const LikesProvider = ({ children }) => {
  const [likedItems, setLikedItems] = useState([]); // Only for current restaurant
  const [likedItemIds, setLikedItemIds] = useState([]); // Global list of liked item IDs
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cache for liked items per restaurant (key: restaurantId, value: items array)
  const restaurantCache = useRef(new Map());

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
      setIsInitialized(false);
      restaurantCache.current.clear(); // Clear cache on logout
    }
  }, [user, restaurantId]);

  // Load user liked items from profiles table, filtered by current restaurant
  const loadUserLikes = async (userId, currentRestaurantId) => {
    try {
      // Check if we have cached data for this restaurant
      const cachedItems = restaurantCache.current.get(currentRestaurantId);
      if (cachedItems && isInitialized) {
        // Use cached data immediately, refresh in background
        setLikedItems(cachedItems);
      } else if (!isInitialized) {
        setLoading(true);
      }

      // Get liked items from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('liked_items')
        .eq('id', userId)
        .single();

      if (error) {
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
          setLikedItems([]);
        } else {
          const items = foodItems || [];
          setLikedItems(items);
          // Cache the results
          restaurantCache.current.set(currentRestaurantId, items);
        }
      } else {
        setLikedItemIds([]);
        setLikedItems([]);
        restaurantCache.current.set(currentRestaurantId, []);
      }
    } catch (error) {
      setLikedItems([]);
      setLikedItemIds([]);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  // Update liked items in profiles table (global list)
  const updateLikedItemsInDB = useCallback(async (newLikedItemIds) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ liked_items: newLikedItemIds })
        .eq('id', user.id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating liked items:', error);
    }
  }, [user]);

  // Optimistic toggle like - updates UI immediately, then syncs with DB
  const toggleLike = useCallback(async (item) => {
    if (!user) return;
    if (item.restaurant_id !== restaurantId) return;

    const isCurrentlyLiked = likedItemIds.includes(item.id);
    let newLikedItemIds;
    let newLikedItems;

    if (isCurrentlyLiked) {
      // Removing like - optimistic update
      newLikedItemIds = likedItemIds.filter(id => id !== item.id);
      newLikedItems = likedItems.filter(i => i.id !== item.id);
    } else {
      // Adding like - optimistic update
      newLikedItemIds = [...likedItemIds, item.id];
      newLikedItems = [...likedItems, item];
    }

    // Update UI immediately (optimistic)
    setLikedItemIds(newLikedItemIds);
    setLikedItems(newLikedItems);

    // Update cache
    restaurantCache.current.set(restaurantId, newLikedItems);

    // Sync with database in background (fire-and-forget)
    updateLikedItemsInDB(newLikedItemIds);
  }, [user, restaurantId, likedItemIds, likedItems, updateLikedItemsInDB]);

  // Check if an item is liked (global)
  const isLiked = useCallback((itemId) => {
    return likedItemIds.includes(itemId);
  }, [likedItemIds]);

  // Clear all likes
  const clearAllLikes = useCallback(async () => {
    if (!user) return;
    setLikedItems([]);
    setLikedItemIds([]);
    restaurantCache.current.clear();
    await updateLikedItemsInDB([]);
  }, [user, updateLikedItemsInDB]);

  return (
    <LikesContext.Provider value={{
      likedItems,
      likedItemIds,
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