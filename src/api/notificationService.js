// src/api/notificationService.js
import { supabase } from '../supabase';

// Create a notification
export const createNotification = async (notification) => {
  try {
    // Ensure we have the required fields
    if (!notification.title || !notification.message || !notification.type) {
      throw new Error('Missing required notification fields: title, message, type');
    }

    // Set default values if not provided
    const notificationData = {
      ...notification,
      created_at: new Date().toISOString(),
      read: false
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
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
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Get manager notifications
export const getManagerNotifications = async () => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_manager_notification', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching manager notifications:', error);
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
    console.error('Error fetching unread notifications:', error);
    throw error;
  }
};

// Get unread manager notifications
export const getUnreadManagerNotifications = async () => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_manager_notification', true)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching unread manager notifications:', error);
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
    console.error('Error marking notification as read:', error);
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
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Mark all manager notifications as read
export const markAllManagerNotificationsAsRead = async () => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('is_manager_notification', true)
      .eq('read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all manager notifications as read:', error);
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

// Subscribe to manager notifications
export const subscribeToManagerNotifications = (callback) => {
  return supabase
    .channel('manager-notifications')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: 'is_manager_notification=eq.true'
    }, callback)
    .subscribe();
};