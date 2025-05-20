import { supabase } from '../supabase';

// Food Item Functions
export const getAllFoodItems = async () => {
  const { data, error } = await supabase
    .from('fooditems')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) throw error;
  return data;
};

export const getFoodItemsByCategory = async (category) => {
  const { data, error } = await supabase
    .from('fooditems')
    .select('*')
    .eq('is_active', true)
    .eq('category', category)
    .order('name');
  
  if (error) throw error;
  return data;
};

export const getFoodItemById = async (id) => {
  const { data, error } = await supabase
    .from('fooditems')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createFoodItem = async (foodItem) => {
  const { data, error } = await supabase
    .from('fooditems')
    .insert([foodItem])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateFoodItem = async (id, updates) => {
  const { data, error } = await supabase
    .from('fooditems')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteFoodItem = async (id) => {
  const { error } = await supabase
    .from('fooditems')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

export const uploadFoodImage = async (file) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `food-images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('food-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('food-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// Order Functions
export const createOrder = async (orderData) => {
  // First create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      user_id: orderData.userId,
      table_number: orderData.tableNumber,
      customer_name: orderData.customerName,
      total: orderData.total,
      notes: orderData.notes
    }])
    .select();
  
  if (orderError) throw orderError;
  
  // Then create order items
  const orderItems = orderData.items.map(item => ({
    order_id: order[0].id,
    food_item_id: item.id,
    quantity: item.quantity,
    price_at_purchase: item.price
  }));
  
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);
  
  if (itemsError) throw itemsError;
  
  return order[0];
};

export const getOrdersByUser = async (userId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items:order_items(
        *,
        food_item:fooditems(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items:order_items(
        *,
        food_item:fooditems(*)
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getOrdersByStatus = async (status) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items:order_items(
        *,
        food_item:fooditems(*)
      )
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const updateOrderStatus = async (orderId, status) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const getOrderById = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items:order_items(
        *,
        food_item:fooditems(*)
      )
    `)
    .eq('id', orderId)
    .single();
  
  if (error) throw error;
  return data;
};

// Notification Functions
export const createNotification = async (userId, orderId, message) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      order_id: orderId,
      message
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const getUserNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const markNotificationAsRead = async (notificationId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select();
  
  if (error) throw error;
  return data[0];
};

// Real-time subscriptions
export const subscribeToOrders = (callback) => {
  return supabase
    .channel('orders-channel')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' }, 
      payload => callback(payload)
    )
    .subscribe();
};

export const subscribeToNotifications = (userId, callback) => {
  return supabase
    .channel('user-notifications')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}` 
      }, 
      payload => callback(payload)
    )
    .subscribe();
};

// User Profile Functions
export const getCurrentUser = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) throw error;
  return { ...user, profile: data };
};

export const isUserAdmin = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data.is_admin;
};

// Statistics and Dashboard Data
export const getRevenueStats = async (period = 'all') => {
  let query = supabase
    .from('orders')
    .select('created_at, total')
    .eq('status', 'completed');
    
  // Add time filter if needed
  const now = new Date();
  if (period === 'daily') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    query = query.gte('created_at', today);
  } else if (period === 'weekly') {
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    query = query.gte('created_at', weekStart);
  } else if (period === 'monthly') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    query = query.gte('created_at', monthStart);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
};

export const getOrderStats = async () => {
  const [
    pendingQuery,
    acceptedQuery,
    preparingQuery,
    completedQuery,
    rejectedQuery,
    totalQuery
  ] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'accepted'),
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'preparing'),
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'completed'),
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'rejected'),
    supabase.from('orders').select('id', { count: 'exact' })
  ]);
  
  return {
    pending: pendingQuery.count || 0,
    accepted: acceptedQuery.count || 0,
    preparing: preparingQuery.count || 0,
    completed: completedQuery.count || 0,
    rejected: rejectedQuery.count || 0,
    total: totalQuery.count || 0
  };
};

export const getActiveUsers = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data, error } = await supabase
    .from('orders')
    .select('user_id')
    .distinct()
    .gte('created_at', thirtyDaysAgo.toISOString());
  
  if (error) throw error;
  return data.length;
};

export const getPopularItems = async (limit = 5) => {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      food_item_id,
      quantity,
      food_item:fooditems(*)
    `)
    .order('quantity', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data.map(item => item.food_item);
};