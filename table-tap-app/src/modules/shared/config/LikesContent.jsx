import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../shared/supabase';
import { useAuth } from './AuthContext';
import { useRestaurant } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';
import { secureStorage } from '../../shared/utils/security';

const LikesContext = createContext();

export const LikesProvider = ({ children }) => {
  const [likedItems, setLikedItems] = useState([]); // Currently viewed liked items (filtered by restaurant)
  const [likedItemIds, setLikedItemIds] = useState([]); // Global list of liked item IDs
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cache/Store for liked items per restaurant (key: restaurantId, value: items array)
  // We use this to keep track of full item objects for the UI
  const restaurantCache = useRef(new Map());

  const { user } = useAuth();
  const { restaurantId } = useRestaurant();

  // Helper to get local storage key for guest likes
  const getGuestLikesKey = useCallback(() => 'guest_liked_item_ids', []);
  const getGuestLikedItemsKey = useCallback(() => 'guest_liked_items', []);

  // Load liked items and IDs when user or restaurant changes
  useEffect(() => {
    const initializeLikes = async () => {
      if (user) {
        await loadUserLikes(user.id, restaurantId);
      } else {
        loadGuestLikes(restaurantId);
      }
    };

    initializeLikes();
  }, [user, restaurantId]);

  // Load guest liked items from localStorage
  const loadGuestLikes = (currentRestaurantId) => {
    try {
      setLoading(true);
      const guestLikedIds = secureStorage.getItem(getGuestLikesKey()) || [];
      const guestLikedItems = secureStorage.getItem(getGuestLikedItemsKey()) || [];

      setLikedItemIds(guestLikedIds);

      // Filter items for the current restaurant
      const itemsForRestaurant = guestLikedItems.filter(item =>
        item.restaurant_id === currentRestaurantId && guestLikedIds.includes(item.id)
      );

      setLikedItems(itemsForRestaurant);

      // Initialize cache for guests too
      if (currentRestaurantId) {
        restaurantCache.current.set(currentRestaurantId, itemsForRestaurant);
      }
    } catch (error) {
      console.error('Error loading guest likes:', error);
      setLikedItems([]);
      setLikedItemIds([]);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

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
        console.error('Error fetching user profile for likes:', error);
        setLikedItems([]);
        setLikedItemIds([]);
        return;
      }

      let profileLikedIds = profile?.liked_items || [];

      // MERGE LOGIC: If there are guest likes, merge them with the profile likes
      const guestLikedIds = secureStorage.getItem(getGuestLikesKey());
      if (guestLikedIds && guestLikedIds.length > 0) {
        // Create a unique set of IDs from both sources
        const mergedIds = [...new Set([...profileLikedIds, ...guestLikedIds])];

        // If there were new IDs to add, update the database
        if (mergedIds.length > profileLikedIds.length) {
          profileLikedIds = mergedIds;
          await updateLikedItemsInDB(mergedIds);
        }

        // Clear guest likes after merging
        secureStorage.removeItem(getGuestLikesKey());
        secureStorage.removeItem(getGuestLikedItemsKey());
      }

      // Set global liked item IDs
      if (profileLikedIds.length > 0) {
        setLikedItemIds(profileLikedIds);

        // Only fetch liked items for the current restaurant
        if (currentRestaurantId) {
          const { data: foodItems, error: foodError } = await supabase
            .from('fooditems')
            .select('*')
            .in('id', profileLikedIds)
            .eq('is_active', true)
            .eq('restaurant_id', currentRestaurantId);

          if (foodError) {
            console.error('Error fetching food items for likes:', foodError);
            setLikedItems([]);
          } else {
            const items = foodItems || [];
            setLikedItems(items);
            // Cache the results
            restaurantCache.current.set(currentRestaurantId, items);
          }
        }
      } else {
        setLikedItemIds([]);
        setLikedItems([]);
        if (currentRestaurantId) {
          restaurantCache.current.set(currentRestaurantId, []);
        }
      }
    } catch (error) {
      console.error('Error loading user likes:', error);
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
      console.error('Error updating liked items in DB:', error);
    }
  }, [user]);

  // Optimistic toggle like - updates UI immediately, then syncs with DB or LocalStorage
  const toggleLike = useCallback(async (item) => {
    if (item.restaurant_id !== restaurantId) return;

    const isCurrentlyLiked = likedItemIds.includes(item.id);
    let newLikedItemIds;
    let newLikedItems;

    if (isCurrentlyLiked) {
      // Removing like
      newLikedItemIds = likedItemIds.filter(id => id !== item.id);
      newLikedItems = likedItems.filter(i => i.id !== item.id);
    } else {
      // Adding like
      newLikedItemIds = [...likedItemIds, item.id];
      newLikedItems = [...likedItems, item];
    }

    // Update UI immediately (optimistic)
    setLikedItemIds(newLikedItemIds);
    setLikedItems(newLikedItems);

    // Update cache
    restaurantCache.current.set(restaurantId, newLikedItems);

    if (user) {
      // Sync with database for authenticated users
      updateLikedItemsInDB(newLikedItemIds);
    } else {
      // Sync with localStorage for guests
      try {
        secureStorage.setItem(getGuestLikesKey(), newLikedItemIds);

        // Also store full item objects for guests to prevent refetching
        const guestLikedItems = secureStorage.getItem(getGuestLikedItemsKey()) || [];
        let updatedGuestLikedItems;

        if (isCurrentlyLiked) {
          updatedGuestLikedItems = guestLikedItems.filter(i => i.id !== item.id);
        } else {
          updatedGuestLikedItems = [...guestLikedItems, item];
        }

        secureStorage.setItem(getGuestLikedItemsKey(), updatedGuestLikedItems);
      } catch (error) {
        console.error('Error saving guest likes to storage:', error);
      }
    }
  }, [user, restaurantId, likedItemIds, likedItems, updateLikedItemsInDB, getGuestLikesKey, getGuestLikedItemsKey]);

  // Check if an item is liked (global)
  const isLiked = useCallback((itemId) => {
    return likedItemIds.includes(itemId);
  }, [likedItemIds]);

  // Clear all likes
  const clearAllLikes = useCallback(async () => {
    setLikedItems([]);
    setLikedItemIds([]);
    restaurantCache.current.clear();

    if (user) {
      await updateLikedItemsInDB([]);
    } else {
      secureStorage.removeItem(getGuestLikesKey());
      secureStorage.removeItem(getGuestLikedItemsKey());
    }
  }, [user, updateLikedItemsInDB, getGuestLikesKey, getGuestLikedItemsKey]);

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