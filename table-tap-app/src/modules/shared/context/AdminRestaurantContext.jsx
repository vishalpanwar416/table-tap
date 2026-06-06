import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../shared/supabase';
import { useAuth } from '../../shared/config/AuthContext';

const AdminRestaurantContext = createContext();

// Restaurants we never want to surface in the admin UI (legacy demo data) - currently empty to allow all for development
const BLOCKED_RESTAURANT_NAMES = []; // was ['Restaurant-1', 'Resturant-1']
const filterBlockedRestaurants = (list = []) =>
  list.filter((r) => !BLOCKED_RESTAURANT_NAMES.includes((r.name || '').trim()));

// Helper function to store in localStorage
const localStorageStore = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {}
  },
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {}
  },
};

export const AdminRestaurantProvider = ({ children }) => {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userRestaurantId, setUserRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();

  // Get restaurant ID from URL
  const urlRestaurantId = new URLSearchParams(location.search).get('restaurant');

  const [ownedRestaurants, setOwnedRestaurants] = useState([]); // List of restaurants owned by the user

  useEffect(() => {
    let mounted = true;

    const fetchUserRoleAndRestaurant = async () => {
      if (!user?.id) {
        if (mounted) setLoading(false);
        return;
      }

      // Avoid redundant loading if possible
      const currentStoredId = urlRestaurantId || localStorageStore.get('admin_selected_restaurant');
      if (
        userRole &&
        userRestaurantId === currentStoredId &&
        restaurant &&
        (userRole !== 'owner' || ownedRestaurants.length > 0)
      ) {
        if (mounted) setLoading(false);
        return;
      }

      const safetyTimer = setTimeout(() => {
        if (mounted && loading) {
          console.warn('[AdminRestaurantContext] Initialization timeout, force clearing...');
          if (userRole === null) setUserRole('customer');
          if (ownedRestaurants.length === 0) setOwnedRestaurants([]);
          setLoading(false);
        }
      }, 10000);

      try {
        if (!userRole) setLoading(true);
        setError(null);

        // 1. Fetch Profile Role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('profile_role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          if (profileError.name === 'AbortError') return;
          console.error('[AdminRestaurantContext] Profile fetch error:', profileError);
          setError('Failed to load profile permissions');
          setLoading(false);
          return;
        }

        if (!profileData) {
          setError('Profile not found.');
          setLoading(false);
          return;
        }

        const role = profileData.profile_role || 'customer';
        // Removed early setUserRole(role) to avoid intermediate 'access denied' states
        // while fetching restaurants. Role is now set at the end of the flow.

        let availableRestaurants = [];

        // 2. Fetch Restaurants via Edge Function
        // This handles Admin (all active), Owner (all connected), and Manager/Staff (single connected) logic securely
        try {
          const { data: funcData, error: funcError } =
            await supabase.functions.invoke('fetch-owner-restaurants');

          if (!funcError && funcData && funcData.restaurants) {
            availableRestaurants = funcData.restaurants;
          } else {
            if (funcError)
              console.warn(
                '[AdminRestaurantContext] Edge Function error, falling back:',
                funcError,
              );
            throw new Error('Edge function failed');
          }
        } catch (funcErr) {
          // Fallback to basic DB fetch if edge function fails or causes CORS/network error
          if (role === 'admin') {
            const { data: allRests } = await supabase
              .from('restaurants')
              .select('*')
              .eq('is_active', true);
            availableRestaurants = allRests || [];
          } else {
            const { data: staffRows } = await supabase
              .from('restaurant_staff')
              .select('restaurant_id')
              .eq('user_id', user.id)
              .eq('connected', true);

            if (staffRows && staffRows.length > 0) {
              const ids = staffRows.map((r) => r.restaurant_id);
              const { data: rests } = await supabase
                .from('restaurants')
                .select('*')
                .in('id', ids)
                .eq('is_active', true);
              availableRestaurants = rests || [];
            }
          }
        }

        if (!mounted) return;

        // Filter and Set Owned Restaurants
        const filteredRestaurants = filterBlockedRestaurants(availableRestaurants || []);
        setOwnedRestaurants(filteredRestaurants);

        // 3. Selection Logic
        let targetId = null;
        const storedId = localStorageStore.get('admin_selected_restaurant');
        const filteredIds = filteredRestaurants.map((r) => r.id);

        if (urlRestaurantId && filteredIds.includes(urlRestaurantId)) {
          targetId = urlRestaurantId;
        } else if (storedId && filteredIds.includes(storedId)) {
          targetId = storedId;
        } else if (filteredRestaurants.length === 1) {
          // Only auto-select if exactly 1 restaurant is available (or for non-admins)
          targetId = filteredRestaurants[0].id;
        } else if (!['admin', 'owner'].includes(role) && filteredRestaurants.length > 0) {
          // For managers, staff, etc - always pick their assigned one
          targetId = filteredRestaurants[0].id;
        }

        // Set all related states together to avoid intermediate 'access denied' states
        // in components like RestaurantDashboardWrapper
        if (targetId) {
          const selected = filteredRestaurants.find((r) => r.id === targetId);
          if (selected) {
            setRestaurant(selected);
            if (['admin', 'owner'].includes(role)) {
              localStorageStore.set('admin_selected_restaurant', targetId);
            }
          }
        }

        setUserRestaurantId(targetId);
        setUserRole(role);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[AdminRestaurantContext] Initialization error:', err);
        setError('System error loading management data');
      } finally {
        clearTimeout(safetyTimer);
        if (mounted) setLoading(false);
      }
    };

    fetchUserRoleAndRestaurant();
    return () => {
      mounted = false;
    };
  }, [user?.id, urlRestaurantId]);

  // Function to set restaurant for admin users
  const setAdminRestaurant = React.useCallback(
    async (restaurantId) => {
      if (userRole !== 'admin') {
        return false;
      }

      try {
        setLoading(true);

        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .maybeSingle();

        if (restaurantError) {
          setError('Restaurant not found');
          return false;
        }

        if (!restaurantData) {
          setError('Restaurant not found or inactive');
          return false;
        }

        setRestaurant(restaurantData);
        setUserRestaurantId(restaurantId);
        localStorageStore.set('admin_selected_restaurant', restaurantId);

        // Update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('restaurant', restaurantId);
        window.history.replaceState({}, '', url);

        setError(null);
        return true;
      } catch (err) {
        if (err.name === 'AbortError') return false;
        setError('Failed to set restaurant');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userRole],
  );

  // Function to clear admin restaurant selection
  const clearAdminRestaurant = React.useCallback(() => {
    if (userRole !== 'admin') {
      return false;
    }

    setRestaurant(null);
    setUserRestaurantId(null);
    localStorageStore.remove('admin_selected_restaurant');

    // Remove restaurant parameter from URL
    const url = new URL(window.location);
    url.searchParams.delete('restaurant');
    window.history.replaceState({}, '', url);

    return true;
  }, [userRole]);

  const updateRestaurant = React.useCallback(
    async (updates) => {
      if (userRole !== 'admin' && !userRestaurantId) {
        return false;
      }

      if (!['admin', 'manager', 'owner'].includes(userRole)) {
        return false;
      }

      try {
        const restaurantId =
          userRole === 'admin' ? updates.restaurant_id || userRestaurantId : userRestaurantId;

        if (!restaurantId) {
          return false;
        }

        // SECURITY: Filter out protected fields for non-admins
        const filteredUpdates = { ...updates };
        if (userRole !== 'admin') {
          delete filteredUpdates.swiggy_api_key;
          delete filteredUpdates.zomato_api_key;
          // You can add other sensitive fields here like razorpay_key_id if needed
        }

        const { data, error } = await supabase
          .from('restaurants')
          .update({
            ...filteredUpdates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', restaurantId)
          .select()
          .maybeSingle();

        if (error) {
          if (error.name === 'AbortError') return false;
          return false;
        }

        if (userRole !== 'admin' || restaurantId === userRestaurantId) {
          setRestaurant(data);
        }
        return true;
      } catch (err) {
        return false;
      }
    },
    [userRole, userRestaurantId],
  );

  const refreshRestaurant = React.useCallback(
    async (restaurantId = null) => {
      const targetRestaurantId = userRole === 'admin' ? restaurantId : userRestaurantId;

      if (!targetRestaurantId) {
        return false;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', targetRestaurantId)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          if (error.name === 'AbortError') return false;
          setError(error.message);
          return false;
        }

        if (userRole !== 'admin' || targetRestaurantId === userRestaurantId) {
          setRestaurant(data);
        }
        setError(null);
        return true;
      } catch (err) {
        if (err.name === 'AbortError') return false;
        setError('Failed to refresh restaurant data');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userRole, userRestaurantId],
  );

  // Function to set restaurant for owner users
  const setOwnerRestaurant = React.useCallback(
    async (restaurantId) => {
      if (userRole !== 'owner') {
        return false;
      }

      try {
        setLoading(true);

        // Verify ownership locally first for speed
        const targetRestaurant = ownedRestaurants.find((r) => r.id === restaurantId);

        if (!targetRestaurant) {
          // Double check with DB to be safe
          const { data: staffData, error: staffError } = await supabase
            .from('restaurant_staff')
            .select('restaurant_id')
            .eq('user_id', user.id)
            .eq('restaurant_id', restaurantId)
            .eq('connected', true)
            .maybeSingle();

          if (staffError || !staffData) {
            setError('You do not have access to this restaurant');
            return false;
          }

          const { data: restaurantData, error: restaurantError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', restaurantId)
            .eq('is_active', true)
            .maybeSingle();

          if (restaurantData) {
            setRestaurant(restaurantData);
          } else {
            setError('Restaurant not found or inactive');
            return false;
          }
        } else {
          setRestaurant(targetRestaurant);
        }

        setUserRestaurantId(restaurantId);
        localStorageStore.set('admin_selected_restaurant', restaurantId);

        // Update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('restaurant', restaurantId);
        window.history.replaceState({}, '', url);

        setError(null);
        return true;
      } catch (err) {
        if (err.name === 'AbortError') return false;
        setError('Failed to set restaurant');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userRole, ownedRestaurants, user?.id],
  );

  const canEdit = React.useCallback(() => {
    return ['admin', 'manager', 'owner'].includes(userRole);
  }, [userRole]);

  const canView = React.useCallback(() => {
    return ['captain', 'admin', 'manager', 'owner', 'chef', 'waiter', 'cashier'].includes(userRole);
  }, [userRole]);

  const isAdmin = React.useCallback(() => {
    return userRole === 'admin';
  }, [userRole]);

  const isOwner = React.useCallback(() => {
    return userRole === 'owner';
  }, [userRole]);

  const value = {
    restaurant,
    userRole,
    userRestaurantId,
    ownedRestaurants, // Expose the list of owned restaurants
    updateRestaurant,
    refreshRestaurant,
    setAdminRestaurant,
    setOwnerRestaurant, // Expose for owners
    clearAdminRestaurant,
    loading,
    error,
    canEdit,
    canView,
    isAdmin,
    isOwner,
  };

  return (
    <AdminRestaurantContext.Provider value={value}>{children}</AdminRestaurantContext.Provider>
  );
};

export const useAdminRestaurant = () => {
  const context = useContext(AdminRestaurantContext);
  if (context === undefined) {
    throw new Error('useAdminRestaurant must be used within a AdminRestaurantProvider');
  }
  return context;
};
