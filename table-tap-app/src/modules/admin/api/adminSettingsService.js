import { supabase } from '../../shared/supabase';

/**
 * Admin Settings Service
 * Manages API keys, configuration, and system settings
 */

// Setting Categories
export const SETTING_CATEGORIES = {
  PAYMENT: 'payment',
  EMAIL: 'email',
  GENERAL: 'general',
  LANDING_PAGE: 'landing_page',
  ANALYTICS: 'analytics',
  AI: 'ai'
};

/**
 * Get all admin settings
 */
export const getAllSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('setting_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get settings by category
 */
export const getSettingsByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('category', category)
      .order('setting_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get a single setting by key
 */
export const getSetting = async (settingKey) => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('setting_key', settingKey)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get setting value directly
 */
export const getSettingValue = async (settingKey, defaultValue = null) => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('setting_value, setting_type')
      .eq('setting_key', settingKey)
      .single();

    if (error || !data) return defaultValue;

    // Parse value based on type
    switch (data.setting_type) {
      case 'number':
        return parseFloat(data.setting_value) || defaultValue;
      case 'boolean':
        return data.setting_value === 'true';
      case 'json':
        try {
          return JSON.parse(data.setting_value);
        } catch {
          return defaultValue;
        }
      default:
        return data.setting_value || defaultValue;
    }
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Update a setting
 */
export const updateSetting = async (settingKey, value) => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .update({
        setting_value: String(value),
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', settingKey)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Update multiple settings at once
 */
export const updateMultipleSettings = async (settings) => {
  try {
    const updates = Object.entries(settings).map(async ([key, value]) => {
      return supabase
        .from('admin_settings')
        .update({
          setting_value: String(value),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', key);
    });

    await Promise.all(updates);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create a new setting
 */
export const createSetting = async (settingData) => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .insert([{
        setting_key: settingData.setting_key,
        setting_name: settingData.setting_name,
        setting_value: settingData.setting_value || '',
        setting_type: settingData.setting_type || 'text',
        category: settingData.category || 'general',
        description: settingData.description || '',
        is_encrypted: settingData.is_encrypted || false,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Delete a setting
 */
export const deleteSetting = async (settingKey) => {
  try {
    const { error } = await supabase
      .from('admin_settings')
      .delete()
      .eq('setting_key', settingKey);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get payment settings
 */
export const getPaymentSettings = async () => {
  return getSettingsByCategory(SETTING_CATEGORIES.PAYMENT);
};

/**
 * Get email settings
 */
export const getEmailSettings = async () => {
  return getSettingsByCategory(SETTING_CATEGORIES.EMAIL);
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = async (featureKey) => {
  const value = await getSettingValue(featureKey, false);
  return value === true || value === 'true';
};

export default {
  getAllSettings,
  getSettingsByCategory,
  getSetting,
  getSettingValue,
  updateSetting,
  updateMultipleSettings,
  createSetting,
  deleteSetting,
  getPaymentSettings,
  getEmailSettings,
  isFeatureEnabled,
  SETTING_CATEGORIES
};
