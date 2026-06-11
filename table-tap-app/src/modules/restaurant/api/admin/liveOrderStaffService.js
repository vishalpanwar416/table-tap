import { supabase } from '../../../shared/supabase';
import { calculateOrderTotals } from '../../../customer/api/paymentService';
import { appendKotToLiveOrder } from '../../../customer/api/liveOrderService';

const normalizeItem = (item) => ({
  food_item_id: item.food_item_id || item.id,
  quantity: Number(item.quantity) || 0,
  price: item.price,
  name: item.name,
  category: item.category,
  image: item.image,
  note: item.note || null,
});

export const getActiveLiveOrders = async (restaurantId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('order_kind', 'live_order')
    .eq('payment_status', 'pending')
    .in('status', ['pending', 'preparing', 'ready'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getOrderKots = async (orderId) => {
  const { data, error } = await supabase
    .from('order_kots')
    .select('*')
    .eq('order_id', orderId)
    .order('kot_number', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const updateLiveOrderItems = async (orderId, items) => {
  const normalizedItems = items.map(normalizeItem).filter((item) => item.quantity > 0);

  if (!normalizedItems.length) {
    throw new Error('Live order must have at least one item');
  }

  const totals = calculateOrderTotals(normalizedItems);

  const { data, error } = await supabase
    .from('orders')
    .update({
      items: normalizedItems,
      subtotal: totals.subtotalAfterDiscount,
      gst: totals.cgst + totals.sgst,
      discount: totals.discountAmount,
      total: totals.finalTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('order_kind', 'live_order')
    .select();

  if (error) throw error;

  const updated = data?.[0];
  if (!updated) {
    throw new Error('Failed to update live order');
  }

  return updated;
};

export const staffAppendKot = async (orderId, restaurantId, items) => {
  if (!items?.length) {
    throw new Error('Select items to send as KOT');
  }
  return appendKotToLiveOrder(orderId, restaurantId, items);
};
