import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../config/AuthContext';

const AdminRestaurantContext = createContext();

// Helper function to get URL parameters
const getUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    restaurantId: urlParams.get('restaurant')
  };
};

// Helper function to store in localStorage
const localStorageStore = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error storing in localStorage:', error);
    }
  },
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
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

  // Add state to track URL changes
  const [urlRestaurantId, setUrlRestaurantId] = useState(() => {
    const urlParams = getUrlParams();
    return urlParams.restaurantId;
  });

  // Listen for URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = getUrlParams();
      setUrlRestaurantId(urlParams.restaurantId);
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);
    
    // Listen for pushstate/replacestate events (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleUrlChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleUrlChange();
    };

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    const fetchUserRoleAndRestaurant = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // First, check if user has admin profile role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('profile_role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile data:', profileError);
          setError('Access denied: Profile not found');
          setLoading(false);
          return;
        }

        // If user has admin profile role, they have full access
        if (profileData.profile_role === 'admin') {
          setUserRole('admin');
          
          // Check URL parameters first for admin users
          let targetRestaurantId = null;
          
          if (urlRestaurantId) {
            // Store the restaurant ID from URL in localStorage
            localStorageStore.set('admin_selected_restaurant', urlRestaurantId);
            targetRestaurantId = urlRestaurantId;
          } else {
            // Try to get from localStorage if no URL parameter
            targetRestaurantId = localStorageStore.get('admin_selected_restaurant');
          }
          
          setUserRestaurantId(targetRestaurantId);
          
          // If admin has a specific restaurant ID, fetch that restaurant
          if (targetRestaurantId) {
            const { data: restaurantData, error: restaurantError } = await supabase
              .from('restaurants')
              .select('*')
              .eq('id', targetRestaurantId)
              .eq('is_active', true)
              .single();

            if (restaurantError) {
              console.error('Error fetching restaurant for admin:', restaurantError);
              setError('Restaurant not found or inactive');
              setLoading(false);
              return;
            }

            setRestaurant(restaurantData);
          }
          
          setLoading(false);
          return;
        }

        // If user has captain or manager profile role, they have access
        if (profileData.profile_role === 'captain' || profileData.profile_role === 'manager') {
          setUserRole(profileData.profile_role);
          // For captain/manager with profile_role, we need to get their restaurant_id
          const { data: staffData, error: staffError } = await supabase
            .from('restaurant_staff')
            .select('restaurant_id')
            .eq('user_id', user.id)
            .eq('connected', true)
            .single();

          if (staffError || !staffData) {
            console.error('Error fetching staff data for captain/manager:', staffError);
            setError(`Access denied: ${profileData.profile_role} not assigned to restaurant`);
            setLoading(false);
            return;
          }

          setUserRestaurantId(staffData.restaurant_id);

          // Fetch the restaurant data
          const { data: restaurantData, error: restaurantError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', staffData.restaurant_id)
            .eq('is_active', true)
            .single();

          if (restaurantError) {
            console.error('Error fetching restaurant:', restaurantError);
            setError('Restaurant not found or inactive');
            setLoading(false);
            return;
          }

          setRestaurant(restaurantData);
          setLoading(false);
          return;
        }

        // For other users, check staff role and restaurant assignment
        const { data: staffData, error: staffError } = await supabase
          .from('restaurant_staff')
          .select('staff_role, restaurant_id')
          .eq('user_id', user.id)
          .eq('connected', true)
          .single();

        if (staffError) {
          console.error('Error fetching staff data:', staffError);
          setError('Access denied: Not a staff member');
          setLoading(false);
          return;
        }

        if (!staffData) {
          setError('Access denied: Not authorized');
          setLoading(false);
          return;
        }

        // Check if user has required role (captain, admin, or manager)
        const allowedRoles = ['captain', 'admin', 'manager'];
        if (!allowedRoles.includes(staffData.staff_role)) {
          setError('Access denied: Insufficient permissions');
          setLoading(false);
          return;
        }

        setUserRole(staffData.staff_role);
        setUserRestaurantId(staffData.restaurant_id);

        // Now fetch the restaurant data
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', staffData.restaurant_id)
          .eq('is_active', true)
          .single();

        if (restaurantError) {
          console.error('Error fetching restaurant:', restaurantError);
          setError('Restaurant not found or inactive');
          return;
        }

        setRestaurant(restaurantData);
        
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to load restaurant data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoleAndRestaurant();
  }, [user?.id, urlRestaurantId]); // Add urlRestaurantId to dependencies

  // Function to set restaurant for admin users
  const setAdminRestaurant = async (restaurantId) => {
    if (userRole !== 'admin') {
      console.error('Only admin users can set restaurant');
      return false;
    }

    try {
      setLoading(true);
      
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single();

      if (restaurantError) {
        console.error('Error fetching restaurant:', restaurantError);
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
      console.error('Unexpected error setting restaurant:', err);
      setError('Failed to set restaurant');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to clear admin restaurant selection
  const clearAdminRestaurant = () => {
    if (userRole !== 'admin') {
      console.error('Only admin users can clear restaurant selection');
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
  };

  const updateRestaurant = async (updates) => {
    // Admin can update any restaurant, staff need specific restaurant ID
    if (userRole !== 'admin' && !userRestaurantId) {
      console.error('No restaurant ID available');
      return false;
    }

    // Check if user has permission to update (admin or manager only)
    if (!['admin', 'manager'].includes(userRole)) {
      console.error('Access denied: Only admin and manager can update restaurant data');
      return false;
    }

    try {
      // For admin, they can update any restaurant (restaurantId should be passed in updates)
      // For staff, they can only update their assigned restaurant
      const restaurantId = userRole === 'admin' ? updates.restaurant_id || userRestaurantId : userRestaurantId;
      
      if (!restaurantId) {
        console.error('No restaurant ID specified for update');
        return false;
      }

      // Update in database
      const { data, error } = await supabase
        .from('restaurants')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) {
        console.error('Error updating restaurant:', error);
        return false;
      }

      // Update local state if it's the user's assigned restaurant
      if (userRole !== 'admin' || restaurantId === userRestaurantId) {
        setRestaurant(data);
      }
      return true;
      
    } catch (err) {
      console.error('Unexpected error updating restaurant:', err);
      return false;
    }
  };

  const refreshRestaurant = async (restaurantId = null) => {
    // Admin can refresh any restaurant, staff can only refresh their assigned one
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
        .single();

      if (error) {
        setError(error.message);
        return false;
      }

      // Update local state if it's the user's assigned restaurant
      if (userRole !== 'admin' || targetRestaurantId === userRestaurantId) {
        setRestaurant(data);
      }
      setError(null);
      return true;
      
    } catch (err) {
      setError('Failed to refresh restaurant data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const canEdit = () => {
    return ['admin', 'manager'].includes(userRole);
  };

  const canView = () => {
    return ['captain', 'admin', 'manager'].includes(userRole);
  };

  const isAdmin = () => {
    return userRole === 'admin';
  };

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