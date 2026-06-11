import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRestaurant } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';
import { useAuth } from '../config/AuthContext';
import { useCart } from '../config/CartContent';
import {
  appendKotToLiveOrder,
  createLiveOrderWithKot,
  getActiveLiveOrder,
  getCartDeltaForKot,
} from '../../customer/api/liveOrderService';
import { subscribeToOrderUpdates } from '../../restaurant/api/admin/orderService';
import { supabase } from '../supabase';

const LiveOrderContext = createContext(null);

const storageKey = (restaurantId, tableNumber) => `liveOrder_${restaurantId}_${tableNumber}`;

export const LiveOrderProvider = ({ children }) => {
  const { restaurant, restaurantId, tableNumber } = useRestaurant();
  const { user } = useAuth();
  const { cartItems, syncCartFromOrderItems, addDeltaToCart } = useCart();
  const cartItemsRef = useRef(cartItems);
  cartItemsRef.current = cartItems;
  const [activeLiveOrder, setActiveLiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const liveOrdersEnabled = restaurant?.enable_live_orders !== false;

  const syncCartWithLiveOrder = useCallback(
    async (order) => {
      if (!order?.items?.length) return;

      const pending = getCartDeltaForKot(cartItemsRef.current, order.items);
      await syncCartFromOrderItems(order.items);
      if (pending.length) {
        addDeltaToCart(pending);
      }
    },
    [syncCartFromOrderItems, addDeltaToCart],
  );

  const refreshActiveLiveOrder = useCallback(async () => {
    if (!restaurantId || !tableNumber || !liveOrdersEnabled) {
      setActiveLiveOrder(null);
      return null;
    }

    try {
      setLoading(true);
      const order = await getActiveLiveOrder(restaurantId, tableNumber);
      setActiveLiveOrder(order);
      if (order) {
        localStorage.setItem(storageKey(restaurantId, tableNumber), order.id);
        await syncCartWithLiveOrder(order);
      } else {
        localStorage.removeItem(storageKey(restaurantId, tableNumber));
      }
      setError(null);
      return order;
    } catch (err) {
      console.error('Failed to load live order:', err);
      setError('Could not load live order');
      return null;
    } finally {
      setLoading(false);
    }
  }, [restaurantId, tableNumber, liveOrdersEnabled, syncCartWithLiveOrder]);

  useEffect(() => {
    refreshActiveLiveOrder();
  }, [refreshActiveLiveOrder]);

  useEffect(() => {
    if (!activeLiveOrder?.id) return undefined;

    const channel = subscribeToOrderUpdates(activeLiveOrder.id, (updated) => {
      if (updated.order_kind === 'live_order') {
        setActiveLiveOrder((prev) => ({ ...prev, ...updated }));
        if (updated.items) {
          syncCartWithLiveOrder(updated);
        }
        if (updated.payment_status !== 'pending') {
          localStorage.removeItem(storageKey(restaurantId, tableNumber));
        }
      }
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeLiveOrder?.id, restaurantId, tableNumber, syncCartWithLiveOrder]);

  const getCustomerDetails = useCallback(() => {
    const guestDetails = JSON.parse(localStorage.getItem('guestOrderDetails') || '{}');
    return {
      name: user?.user_metadata?.full_name || guestDetails.name || 'Guest Customer',
      email: user?.email || guestDetails.email || '',
      phone:
        user?.user_metadata?.phone || guestDetails.phone || activeLiveOrder?.customer_phone || '',
    };
  }, [user, activeLiveOrder?.customer_phone]);

  useEffect(() => {
    setError((prev) =>
      prev === 'Increase quantities or add new dishes to send another KOT' ||
      prev === 'No new items to add to your live order'
        ? null
        : prev,
    );
  }, [cartItems]);

  const appendCartToLiveOrder = useCallback(async () => {
    if (!cartItems.length) {
      setError('Add items to your cart first');
      return null;
    }
    if (!restaurantId || !tableNumber) {
      setError('Restaurant or table not set');
      return null;
    }

    setSubmitting(true);
    setError(null);

    try {
      const customer = getCustomerDetails();
      const order = await getActiveLiveOrder(restaurantId, tableNumber);

      let itemsToSend = cartItems;

      if (order) {
        itemsToSend = getCartDeltaForKot(cartItems, order.items);
        if (!itemsToSend.length) {
          setError('Increase quantities or add new dishes to send another KOT');
          return null;
        }
        const updatedOrder = await appendKotToLiveOrder(order.id, restaurantId, itemsToSend);
        setActiveLiveOrder(updatedOrder);
        localStorage.setItem(storageKey(restaurantId, tableNumber), updatedOrder.id);
        await syncCartFromOrderItems(updatedOrder.items || []);
        return updatedOrder;
      }

      const newOrder = await createLiveOrderWithKot({
        restaurantId,
        tableNumber,
        userId: user?.id || null,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '0000000000',
        items: itemsToSend,
      });
      setActiveLiveOrder(newOrder);
      localStorage.setItem(storageKey(restaurantId, tableNumber), newOrder.id);
      await syncCartFromOrderItems(newOrder.items || []);
      return newOrder;
    } catch (err) {
      console.error('appendCartToLiveOrder failed:', err);
      setError(err.message || 'Failed to update live order');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [cartItems, syncCartFromOrderItems, getCustomerDetails, restaurantId, tableNumber, user?.id]);

  const value = useMemo(
    () => ({
      activeLiveOrder,
      hasActiveLiveOrder: Boolean(activeLiveOrder && activeLiveOrder.payment_status === 'pending'),
      liveOrdersEnabled,
      loading,
      submitting,
      error,
      refreshActiveLiveOrder,
      appendCartToLiveOrder,
      liveOrderTotal: activeLiveOrder?.total ?? 0,
      liveOrderKotCount: activeLiveOrder?.kot_count ?? 0,
    }),
    [
      activeLiveOrder,
      liveOrdersEnabled,
      loading,
      submitting,
      error,
      refreshActiveLiveOrder,
      appendCartToLiveOrder,
    ],
  );

  return <LiveOrderContext.Provider value={value}>{children}</LiveOrderContext.Provider>;
};

export const useLiveOrder = () => {
  const ctx = useContext(LiveOrderContext);
  if (!ctx) {
    throw new Error('useLiveOrder must be used within a LiveOrderProvider');
  }
  return ctx;
};
