// src/api/notificationService.js
import { supabase } from '../../shared/supabase';

// Create a notification
export const createNotification = async (notification) => {
  try {
    // Ensure we have the required fields
    if (!notification.title || !notification.message || !notification.type) {
      throw new Error('Missing required notification fields: title, message, type');
    }

    // Validate notification type
    const allowedTypes = [
      'order_received',
      'order_accepted',
      'order_preparing',
      'order_ready',
      'order_rejected',
      'payment_success',
      'payment_failed'
    ];

    if (!allowedTypes.includes(notification.type)) {
      throw new Error(`Invalid notification type. Must be one of: ${allowedTypes.join(', ')}`);
    }

    // Set default values if not provided
    const notificationData = {
      ...notification,
      read: notification.read || false,
      is_admin_notification: notification.is_admin_notification || false,
      metadata: notification.metadata || {}
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};

// Format notification for display
export const formatNotificationForDisplay = (notification) => {
  return {
    id: notification.id,
    title: notification.title || 'Notification',
    message: notification.message || '',
    type: notification.type || 'order_received',
    read: notification.read || false,
    created_at: notification.created_at,
    updated_at: notification.updated_at,
    order_id: notification.order_id,
    user_id: notification.user_id,
    metadata: notification.metadata || {},
    is_admin_notification: notification.is_admin_notification || false
  };
};

// Get user notifications
export const getUserNotifications = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

// Get admin notifications
export const getManagerNotifications = async (restaurantId = null) => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('is_admin_notification', true)
      .order('created_at', { ascending: false });

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    return [];
  }
};

// Get unread notifications
export const getUnreadNotifications = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

// Get unread admin notifications
export const getUnreadManagerNotifications = async () => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_admin_notification', true)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

// Mark all admin notifications as read
export const markAllManagerNotificationsAsRead = async () => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('is_admin_notification', true)
      .eq('read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};

// Subscribe to user notifications
export const subscribeToUserNotifications = (userId, callback) => {
  return supabase
    .channel(`user-notifications-${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, payload => {
      callback(payload.new);
    })
    .subscribe();
};

// Subscribe to admin notifications
export const subscribeToManagerNotifications = (callback, restaurantId = null) => {
  let filter = 'is_admin_notification=eq.true';
  if (restaurantId) {
    filter += `&restaurant_id=eq.${restaurantId}`;
  }

  return supabase
    .channel(`admin-notifications-${restaurantId || 'all'}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: restaurantId ? `restaurant_id=eq.${restaurantId}` : 'is_admin_notification=eq.true'
      // Note: Supabase realtime filters are simple equality checks usually. 
      // If restaurantId is provided, filtering just by restaurant_id AND is_admin code-side might be safer or using the filter string carefully.
      // However, realtime only supports single column filter in the config object usually unless using logical replication slots which is complex.
      // Standard way: filter by restaurant_id, then check is_admin in callback.
    }, (payload) => {
      if (payload.new && !payload.new.is_admin_notification) return; // Client-side filter for admin type if we only filter by restaurant
      callback(payload);
    })
    .subscribe();
};