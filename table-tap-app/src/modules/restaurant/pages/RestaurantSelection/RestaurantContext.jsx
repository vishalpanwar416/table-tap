import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../shared/supabase';
import { useAuth } from '../../../shared/config/AuthContext';

const RestaurantContext = createContext();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    restaurantId: urlParams.get('restaurant'),
    tableNumber: urlParams.get('table')
  };
};

const localStorageStore = {
  set: (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} },
  get: (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } },
  remove: (key) => { try { localStorage.removeItem(key); } catch (_) {} },
  clear: () => { ['restaurantId', 'tableNumber'].forEach(k => { try { localStorage.removeItem(k); } catch (_) {} }); }
};

const isAuthError = (err) =>
  err?.code === 'PGRST301' ||
  err?.status === 401 ||
  err?.message?.includes('JWT') ||
  err?.message?.includes('expired') ||
  err?.message?.includes('Invalid Refresh Token') ||
  err?.message?.includes('Refresh Token Not Found');

// Maps raw Supabase/network errors to user-friendly messages.
// Never exposes internal details to the customer.
const toUserMessage = (err) => {
  if (!err) return 'An unexpected error occurred. Please try again.';
  if (isAuthError(err)) return 'AUTH_ERROR';
  if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('network'))
    return 'No internet connection. Please check your network and try again.';
  if (err.message?.includes('timeout') || err.message?.includes('ETIMEDOUT'))
    return 'Request timed out. Please try again.';
  // Fallback — log internally but show generic message to user
  console.error('[RestaurantContext] Unexpected error:', err);
  return 'Something went wrong. Please try again.';
};

// Returns true if the subscription allows restaurant access (includes 7-day grace window).
const isSubscriptionAccessible = (subscription) => {
  if (!subscription) return false;
  if (subscription.status === 'active' || subscription.status === 'grace_period') return true;
  if (subscription.status === 'expired' && subscription.end_date) {
    const daysSinceExpiry = Math.ceil(
      (Date.now() - new Date(subscription.end_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceExpiry <= 7;
  }
  // Belt-and-suspenders: stale 'active' status where end_date has already passed
  if (subscription.status === 'active' && subscription.end_date) {
    if (new Date(subscription.end_date) < new Date()) {
      const daysSinceExpiry = Math.ceil(
        (Date.now() - new Date(subscription.end_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceExpiry <= 7;
    }
  }
  return false;
};

// Core fetch — shared by initial load and refresh.
// Returns { restaurant } on success, throws on failure.
// Caller must check signal.aborted after each await to bail out on unmount.
const fetchRestaurantData = async (restaurantId, signal) => {
  const { data: restaurantData, error: restaurantError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .eq('is_active', true)
    .maybeSingle();

  if (signal.aborted) return null;
  if (restaurantError) throw restaurantError;
  if (!restaurantData) {
    const err = new Error('Restaurant not found or inactive');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('id, status, end_date')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (signal.aborted) return null;
  if (subscriptionError && isAuthError(subscriptionError)) throw subscriptionError;

  if (!isSubscriptionAccessible(subscription)) {
    const err = new Error('This restaurant is currently unavailable. Please try again later.');
    err.code = 'SUBSCRIPTION_INACTIVE';
    throw err;
  }

  return {
    restaurant: {
      ...restaurantData,
      subscription_status: subscription?.status,
      subscription_end_date: subscription?.end_date
    }
  };
};

// ─── Provider ────────────────────────────────────────────────────────────────

export const RestaurantProvider = ({ children }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableNumber, setTableNumber] = useState(null);
  const { loading: authLoading } = useAuth();
  const abortRef = useRef(null);

  // Resolve restaurant ID from URL params or localStorage
  useEffect(() => {
    const urlParams = getUrlParams();
    if (urlParams.restaurantId && urlParams.tableNumber) {
      localStorageStore.set('restaurantId', urlParams.restaurantId);
      localStorageStore.set('tableNumber', urlParams.tableNumber);
      setRestaurantId(urlParams.restaurantId);
      setTableNumber(urlParams.tableNumber);
    } else {
      const storedId = localStorageStore.get('restaurantId');
      const storedTable = localStorageStore.get('tableNumber');
      if (storedId && storedTable) {
        setRestaurantId(storedId);
        setTableNumber(storedTable);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Fetch restaurant whenever restaurantId or auth state changes
  useEffect(() => {
    if (authLoading) return;
    if (!restaurantId) { setLoading(false); return; }

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let safetyTimer;

    const load = async () => {
      setLoading(true);
      setError(null);

      // Safety valve: unblock UI after 8s regardless
      safetyTimer = setTimeout(() => {
        if (!controller.signal.aborted) setLoading(false);
      }, 8000);

      try {
        const result = await fetchRestaurantData(restaurantId, controller.signal);
        if (!result || controller.signal.aborted) return;
        setRestaurant(result.restaurant);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted || err?.name === 'AbortError') return;
        const msg = toUserMessage(err);
        if (msg === 'AUTH_ERROR') {
          setError('AUTH_ERROR');
        } else if (err.code === 'NOT_FOUND') {
          setError('Restaurant not found. Please scan the QR code again.');
        } else if (err.code === 'SUBSCRIPTION_INACTIVE') {
          setError('This restaurant is currently unavailable. Please try again later.');
        } else {
          setError(msg);
        }
      } finally {
        if (!controller.signal.aborted) {
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      }
    };

    load();
    return () => { controller.abort(); clearTimeout(safetyTimer); };
  }, [restaurantId, authLoading]);

  const updateRestaurant = useCallback(async (updates) => {
    if (!restaurantId) return false;
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', restaurantId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('[RestaurantContext] updateRestaurant failed:', error);
        return false;
      }
      if (data) setRestaurant(prev => ({ ...prev, ...data }));
      return true;
    } catch (err) {
      console.error('[RestaurantContext] updateRestaurant threw:', err);
      return false;
    }
  }, [restaurantId]);

  const refreshRestaurant = useCallback(async () => {
    if (!restaurantId) return false;

    // Cancel any in-flight initial load
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const result = await fetchRestaurantData(restaurantId, controller.signal);
      if (!result || controller.signal.aborted) return false;
      setRestaurant(result.restaurant);
      setError(null);
      return true;
    } catch (err) {
      if (controller.signal.aborted || err?.name === 'AbortError') return false;
      const msg = toUserMessage(err);
      setError(msg === 'AUTH_ERROR' ? 'AUTH_ERROR' : msg);
      return false;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [restaurantId]);

  const setRestaurantAndTable = useCallback((newRestaurantId, newTableNumber) => {
    setRestaurant(null);
    setError(null);
    localStorageStore.set('restaurantId', newRestaurantId);
    localStorageStore.set('tableNumber', newTableNumber);
    setRestaurantId(newRestaurantId);
    setTableNumber(newTableNumber);

    // Clear stale food data cache for previous restaurant
    try {
      const staleKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('fooddata_')) staleKeys.push(key);
      }
      staleKeys.forEach(k => sessionStorage.removeItem(k));
    } catch (_) {}
  }, []);

  const clearSession = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    localStorageStore.clear();
    setRestaurantId(null);
    setTableNumber(null);
    setRestaurant(null);
    setError(null);
  }, []);

  return (
    <RestaurantContext.Provider value={{
      restaurant,
      restaurantId,
      tableNumber,
      loading,
      error,
      updateRestaurant,
      refreshRestaurant,
      setRestaurantAndTable,
      clearSession
    }}>
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
