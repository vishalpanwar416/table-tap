import { supabase } from '../../shared/supabase';
import { calculateOrderTotals, createOrder } from './paymentService';
import { createNotification } from '../../shared/api/notificationService';

const LIVE_ORDER_STATUSES = ['pending', 'preparing', 'ready'];

const normalizeCartItem = (item) => ({
  food_item_id: item.food_item_id || item.id,
  quantity: item.quantity,
  price: item.price,
  name: item.name,
  category: item.category,
  image: item.image,
  note: item.note || null,
});

const itemKey = (item) => `${item.food_item_id || item.id}-${item.category || ''}`;

export const getOrderItemQty = (cartItem, orderItems = []) => {
  const key = itemKey(cartItem);
  const match = (orderItems || []).find((item) => itemKey(item) === key);
  return match?.quantity || 0;
};

/** Items in cart that are not yet on the live order (or have a higher quantity). */
export const getCartDeltaForKot = (cartItems, orderItems = []) => {
  const orderQtyByKey = new Map();
  (orderItems || []).forEach((item) => {
    orderQtyByKey.set(itemKey(item), item.quantity || 0);
  });

  const delta = [];
  for (const item of cartItems) {
    const orderQty = orderQtyByKey.get(itemKey(item)) || 0;
    const deltaQty = (item.quantity || 0) - orderQty;
    if (deltaQty > 0) {
      delta.push({ ...item, quantity: deltaQty });
    }
  }
  return delta;
};

export const mergeOrderItems = (existingItems = [], newItems = []) => {
  const map = new Map();

  const addToMap = (item) => {
    const key = `${item.food_item_id || item.id}-${item.category}`;
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
    } else {
      map.set(key, { ...item });
    }
  };

  existingItems.forEach(addToMap);
  newItems.map(normalizeCartItem).forEach(addToMap);

  return Array.from(map.values());
};

const getNextKotNumber = async (orderId) => {
  const { data, error } = await supabase
    .from('order_kots')
    .select('kot_number')
    .eq('order_id', orderId)
    .order('kot_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.kot_number || 0) + 1;
};

export const getActiveLiveOrder = async (restaurantId, tableNumber) => {
  if (!restaurantId || !tableNumber) return null;

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('table_number', String(tableNumber))
    .eq('order_kind', 'live_order')
    .eq('payment_status', 'pending')
    .in('status', LIVE_ORDER_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const notifyLiveOrderKot = async (order, kotNumber, isFirstKot) => {
  try {
    await createNotification({
      title: isFirstKot ? 'New Live Order' : `Live Order · KOT #${kotNumber}`,
      message: isFirstKot
        ? `Table ${order.table_number} started a live order (₹${Number(order.total).toFixed(2)})`
        : `Table ${order.table_number} added items — KOT #${kotNumber} (₹${Number(order.total).toFixed(2)} total)`,
      type: isFirstKot ? 'order_received' : 'kot_added',
      restaurant_id: order.restaurant_id,
      is_admin_notification: true,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        table_number: order.table_number,
        kot_number: kotNumber,
        order_kind: 'live_order',
        total_amount: order.total,
      },
    });
  } catch (err) {
    console.warn('Live order notification failed:', err);
  }
};

export const createLiveOrderWithKot = async ({
  restaurantId,
  tableNumber,
  userId,
  customerName,
  customerEmail,
  customerPhone,
  items,
  specialInstructions,
}) => {
  const existing = await getActiveLiveOrder(restaurantId, tableNumber);
  if (existing) {
    return appendKotToLiveOrder(existing.id, restaurantId, items);
  }

  const normalizedItems = items.map(normalizeCartItem);
  const totals = calculateOrderTotals(normalizedItems);

  const order = await createOrder({
    restaurantId,
    userId,
    customerName,
    customerEmail,
    customerPhone,
    tableNumber,
    items: normalizedItems,
    paymentMethod: 'direct',
    paymentStatus: 'pending',
    status: 'preparing',
    specialInstructions,
    orderKind: 'live_order',
    kotCount: 1,
  });

  const { error: kotError } = await supabase.from('order_kots').insert([
    {
      order_id: order.id,
      restaurant_id: restaurantId,
      kot_number: 1,
      items: normalizedItems,
      subtotal: totals.subtotalAfterDiscount,
      status: 'sent',
    },
  ]);

  if (kotError) throw kotError;

  await notifyLiveOrderKot(order, 1, true);
  return order;
};

export const appendKotToLiveOrder = async (orderId, restaurantId, items) => {
  const { data: existingOrder, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('order_kind', 'live_order')
    .single();

  if (fetchError) throw fetchError;
  if (!existingOrder) throw new Error('Live order not found');
  if (existingOrder.payment_status !== 'pending') {
    throw new Error('This live order is already paid and cannot be updated.');
  }

  const normalizedItems = items.map(normalizeCartItem);
  const kotTotals = calculateOrderTotals(normalizedItems);
  const mergedItems = mergeOrderItems(existingOrder.items || [], normalizedItems);
  const totals = calculateOrderTotals(mergedItems);
  const nextKotNumber = await getNextKotNumber(orderId);

  const { error: kotError } = await supabase.from('order_kots').insert([
    {
      order_id: orderId,
      restaurant_id: restaurantId,
      kot_number: nextKotNumber,
      items: normalizedItems,
      subtotal: kotTotals.subtotalAfterDiscount,
      status: 'sent',
    },
  ]);

  if (kotError) throw kotError;

  const orderPatch = {
    items: mergedItems,
    subtotal: totals.subtotalAfterDiscount,
    gst: totals.cgst + totals.sgst,
    discount: totals.discountAmount,
    total: totals.finalTotal,
    kot_count: nextKotNumber,
    updated_at: new Date().toISOString(),
    status: 'preparing',
  };

  const { data: updatedRows, error: updateError } = await supabase
    .from('orders')
    .update(orderPatch)
    .eq('id', orderId)
    .select();

  if (updateError) throw updateError;

  let updatedOrder = updatedRows?.[0];
  if (!updatedOrder) {
    const { data: refetched, error: refetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (refetchError) throw refetchError;
    updatedOrder = refetched || { ...existingOrder, ...orderPatch };
  }

  await notifyLiveOrderKot(updatedOrder, nextKotNumber, false);
  return updatedOrder;
};
