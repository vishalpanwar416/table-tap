import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../shared/supabase';
import { useAuth } from '../../shared/config/AuthContext';

const AdminRestaurantContext = createContext();

// Restaurants we never want to surface in the admin UI (legacy demo data)
const BLOCKED_RESTAURANT_NAMES = ['Restaurant-1', 'Resturant-1'];
const filterBlockedRestaurants = (list = []) =>
  list.filter(r => !BLOCKED_RESTAURANT_NAMES.includes((r.name || '').trim()));

// Helper function to store in localStorage
const localStorageStore = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
    }
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
    } catch (error) {
    }
  }
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
      if (userRole && userRestaurantId === currentStoredId && restaurant && (userRole !== 'owner' || ownedRestaurants.length > 0)) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        if (!userRole) setLoading(true);
        setError(null);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('profile_role')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;

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

        let role = profileData.profile_role || 'customer';
        setUserRole(role);

        let targetId = null;

        if (role === 'admin') {
          targetId = urlRestaurantId || localStorageStore.get('admin_selected_restaurant');
        } else if (role === 'manager' || role === 'captain' || role === 'chef' || role === 'waiter' || role === 'cashier') {
          // Use limit(1) instead of maybeSingle() so multiple staff rows don't cause an error
          const { data: staffRows, error: staffError } = await supabase
            .from('restaurant_staff')
            .select('restaurant_id, staff_role')
            .eq('user_id', user.id)
            .eq('connected', true)
            .limit(1);

          if (staffError && staffError.name === 'AbortError') return;
          if (staffRows && staffRows.length > 0) {
            targetId = staffRows[0].restaurant_id;
          }
        } else if (role === 'owner') {
          // For owners, fetch ALL connected restaurants
          const { data: staffDataArray, error: staffError } = await supabase
            .from('restaurant_staff')
            .select('restaurant_id')
            .eq('user_id', user.id)
            .eq('connected', true);

          if (staffError && staffError.name === 'AbortError') return;

          if (staffDataArray && staffDataArray.length > 0) {
            // Fetch details for all owned restaurants
            const ids = staffDataArray.map(item => item.restaurant_id);
            const { data: restaurantsData, error: restsError } = await supabase
              .from('restaurants')
              .select('*')
              .in('id', ids)
              .eq('is_active', true);

            if (restsError) {
              console.error('Error fetching owned restaurants:', restsError);
            } else {
              const filteredRestaurants = filterBlockedRestaurants(restaurantsData || []);
              setOwnedRestaurants(filteredRestaurants);

              // Determine which one to select
              // 1. URL param
              // 2. Previously selected in local storage (if it belongs to them)
              // 3. The first one in the list
              const storedId = localStorageStore.get('admin_selected_restaurant');
              const filteredIds = filteredRestaurants.map(r => r.id);

              if (urlRestaurantId && filteredIds.includes(urlRestaurantId)) {
                targetId = urlRestaurantId;
              } else if (storedId && filteredIds.includes(storedId)) {
                targetId = storedId;
              } else if (filteredRestaurants.length > 0) {
                targetId = filteredRestaurants[0].id;
              }
            }
          }
        }

        // Fallback: if no restaurant yet (e.g. profile_role is customer but user is staff), check restaurant_staff
        if (!targetId && (role === 'customer' || role === 'staff')) {
          const { data: staffRows, error: staffError } = await supabase
            .from('restaurant_staff')
            .select('restaurant_id, staff_role')
            .eq('user_id', user.id)
            .eq('connected', true)
            .limit(1);

          if (!staffError && staffRows && staffRows.length > 0) {
            targetId = staffRows[0].restaurant_id;
            const effectiveRole = staffRows[0].staff_role || 'captain';
            setUserRole(effectiveRole);
            role = effectiveRole;
          }
        }

        if (!mounted) return;
        setUserRestaurantId(targetId);

        if (targetId) {
          // If we already fetched the restaurant data in the owner block, use it
          if (role === 'owner' && ownedRestaurants.length > 0) {
            const selected = ownedRestaurants.find(r => r.id === targetId);
            if (selected) setRestaurant(selected);
            localStorageStore.set('admin_selected_restaurant', targetId);
          } else {
            const { data: restaurantData, error: restError } = await supabase
              .from('restaurants')
              .select('*')
              .eq('id', targetId)
              .maybeSingle();

            if (restError && restError.name === 'AbortError') return;
            if (!mounted) return;

            const isStaffAssigned = ['captain', 'manager', 'chef', 'waiter', 'cashier'].includes(role);
            const isAdminUser = role === 'admin';
            const isBlocked = BLOCKED_RESTAURANT_NAMES.includes((restaurantData?.name || '').trim());
            if (restaurantData && (!isBlocked || isStaffAssigned || isAdminUser)) {
              setRestaurant(restaurantData);
              if (role === 'admin' || role === 'owner') {
                localStorageStore.set('admin_selected_restaurant', targetId);
              }
            } else if (restaurantData && !isStaffAssigned && !isAdminUser) {
              setError('Selected restaurant is no longer available.');
            }
          }
        }

      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[AdminRestaurantContext] Initialization error:', err);
        setError('System error loading management data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUserRoleAndRestaurant();
    return () => { mounted = false; };
  }, [user?.id, urlRestaurantId]);

  // Function to set restaurant for admin users
  const setAdminRestaurant = React.useCallback(async (restaurantId) => {
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
  }, [userRole]);

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

  const updateRestaurant = React.useCallback(async (updates) => {
    if (userRole !== 'admin' && !userRestaurantId) {
      return false;
    }

    if (!['admin', 'manager'].includes(userRole)) {
      return false;
    }

    try {
      const restaurantId = userRole === 'admin' ? updates.restaurant_id || userRestaurantId : userRestaurantId;

      if (!restaurantId) {
        return false;
      }

      const { data, error } = await supabase
        .from('restaurants')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
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
  }, [userRole, userRestaurantId]);

  const refreshRestaurant = React.useCallback(async (restaurantId = null) => {
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
  }, [userRole, userRestaurantId]);

  // Function to set restaurant for owner users
  const setOwnerRestaurant = React.useCallback(async (restaurantId) => {
    if (userRole !== 'owner') {
      return false;
    }

    try {
      setLoading(true);

      // Verify ownership locally first for speed
      const targetRestaurant = ownedRestaurants.find(r => r.id === restaurantId);

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
  }, [userRole, ownedRestaurants, user?.id]);

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
    isOwner
  };

  return (
    <AdminRestaurantContext.Provider value={value}>
      {children}
    </AdminRestaurantContext.Provider>
  );
};

export const useAdminRestaurant = () => {
  const context = useContext(AdminRestaurantContext);
  if (context === undefined) {
    throw new Error('useAdminRestaurant must be used within a AdminRestaurantProvider');
  }
  return context;
};
