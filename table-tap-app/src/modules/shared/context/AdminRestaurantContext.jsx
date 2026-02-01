import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../shared/supabase';
import { useAuth } from '../../shared/config/AuthContext';

const AdminRestaurantContext = createContext();

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

  useEffect(() => {
    let mounted = true;

    const fetchUserRoleAndRestaurant = async () => {
      if (!user?.id) {
        if (mounted) setLoading(false);
        return;
      }

      // Avoid redundant loading if possible
      const currentStoredId = urlRestaurantId || localStorageStore.get('admin_selected_restaurant');
      if (userRole && userRestaurantId === currentStoredId && restaurant) {
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

        const role = profileData.profile_role || 'customer';
        setUserRole(role);

        let targetId = null;

        if (role === 'admin') {
          targetId = urlRestaurantId || localStorageStore.get('admin_selected_restaurant');
        } else if (role === 'manager' || role === 'captain') {
          const { data: staffData, error: staffError } = await supabase
            .from('restaurant_staff')
            .select('restaurant_id')
            .eq('user_id', user.id)
            .eq('connected', true)
            .maybeSingle();

          if (staffError && staffError.name === 'AbortError') return;
          targetId = staffData?.restaurant_id;
        }

        if (!mounted) return;
        setUserRestaurantId(targetId);

        if (targetId) {
          const { data: restaurantData, error: restError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', targetId)
            .maybeSingle();

          if (restError && restError.name === 'AbortError') return;
          if (!mounted) return;

          if (restaurantData) {
            setRestaurant(restaurantData);
            if (role === 'admin') {
              localStorageStore.set('admin_selected_restaurant', targetId);
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
        .eq('is_active', true)
        .maybeSingle();

      if (restaurantError) {
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

  const canEdit = React.useCallback(() => {
    return ['admin', 'manager'].includes(userRole);
  }, [userRole]);

  const canView = React.useCallback(() => {
    return ['captain', 'admin', 'manager'].includes(userRole);
  }, [userRole]);

  const isAdmin = React.useCallback(() => {
    return userRole === 'admin';
  }, [userRole]);

  const value = {
    restaurant,
    userRole,
    userRestaurantId,
    updateRestaurant,
    refreshRestaurant,
    setAdminRestaurant,
    clearAdminRestaurant,
    loading,
    error,
    canEdit,
    canView,
    isAdmin
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