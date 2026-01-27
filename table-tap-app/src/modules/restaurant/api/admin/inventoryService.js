// Inventory Management Service
// Handles all inventory-related operations and data management

import { supabase } from '../../../shared/supabase';

// Activity types constants
export const ACTIVITY_TYPES = {
  ITEM_ADDED: 'item_added',
  ITEM_UPDATED: 'item_updated',
  ITEM_DELETED: 'item_deleted',
  STOCK_UPDATE: 'stock_update',
  STOCK_TAKE_OUT: 'stock_take_out',
  REORDER_PLACED: 'reorder_placed'
};

// Activity reasons constants
export const ACTIVITY_REASONS = {
  INITIAL_STOCK: 'initial_stock',
  STOCK_ADJUSTMENT: 'stock_adjustment',
  FOOD_PREPARATION: 'food_preparation',
  DAMAGED_GOODS: 'damaged_goods',
  THEFT: 'theft',
  EXPIRY: 'expiry',
  SUPPLIER_RETURN: 'supplier_return',
  AUDIT: 'audit'
};

// Stock status constants
export const STOCK_STATUS = {
  IN_STOCK: 'in-stock',
  LOW_STOCK: 'low-stock',
  OUT_OF_STOCK: 'out-of-stock'
};

// API functions for Supabase
export const inventoryService = {
  // Get all inventory items for a specific restaurant
  async getAllItems(restaurantId) {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  },

  // Get activity logs for a specific restaurant
  async getActivityLogs(restaurantId, page = 1, pageSize = 50) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    try {
      const { data, error } = await supabase
        .from('inventory_activity_logs')
        .select(`
          *,
          inventory_items (
            name,
            category,
            unit
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('timestamp', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  },

  // Add new inventory item
  async addItem(itemData, restaurantId, userInfo) {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          ...itemData,
          restaurant_id: restaurantId
        })
        .select()
        .single();

      if (error) throw error;

      // Add activity log manually
      await this.addActivityLog({
        restaurant_id: restaurantId,
        item_id: data.id,
        action: ACTIVITY_TYPES.ITEM_ADDED,
        old_value: 0,
        new_value: itemData.current_stock,
        quantity_changed: itemData.current_stock,
        reason: ACTIVITY_REASONS.INITIAL_STOCK,
        notes: 'New item added to inventory',
        user_id: userInfo.id,
        user_name: userInfo.name,
        user_role: userInfo.role
      });

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Update inventory item
  async updateItem(itemId, updateData, restaurantId, userInfo) {
    try {
      // Get current item data
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          ...updateData,
          last_updated: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      // Add activity log manually
      await this.addActivityLog({
        restaurant_id: restaurantId,
        item_id: itemId,
        action: ACTIVITY_TYPES.ITEM_UPDATED,
        old_value: currentItem.current_stock,
        new_value: data.current_stock,
        quantity_changed: data.current_stock - currentItem.current_stock,
        reason: ACTIVITY_REASONS.STOCK_ADJUSTMENT,
        notes: 'Item details updated',
        user_id: userInfo.id,
        user_name: userInfo.name,
        user_role: userInfo.role
      });

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Delete inventory item
  async deleteItem(itemId, restaurantId, userInfo) {
    try {
      // Get current item data before deletion
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Add activity log manually
      await this.addActivityLog({
        restaurant_id: restaurantId,
        item_id: itemId,
        action: ACTIVITY_TYPES.ITEM_DELETED,
        old_value: currentItem.current_stock,
        new_value: 0,
        quantity_changed: -currentItem.current_stock,
        reason: ACTIVITY_REASONS.STOCK_ADJUSTMENT,
        notes: 'Item removed from inventory',
        user_id: userInfo.id,
        user_name: userInfo.name,
        user_role: userInfo.role
      });

      return { data: currentItem, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Update stock level
  async updateStock(itemId, newStockLevel, reason, notes, restaurantId, userInfo) {
    try {
      // Get current item data
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      const quantityChanged = newStockLevel - currentItem.current_stock;

      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          current_stock: newStockLevel,
          last_updated: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      // Add activity log manually
      await this.addActivityLog({
        restaurant_id: restaurantId,
        item_id: itemId,
        action: ACTIVITY_TYPES.STOCK_UPDATE,
        old_value: currentItem.current_stock,
        new_value: newStockLevel,
        quantity_changed: quantityChanged,
        reason: reason,
        notes: notes,
        user_id: userInfo.id,
        user_name: userInfo.name,
        user_role: userInfo.role
      });

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Take out stock
  async takeOutStock(itemId, quantity, reason, notes, restaurantId, userInfo) {
    try {
      // Get current item data
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      if (currentItem.current_stock < quantity) {
        throw new Error('Insufficient stock');
      }

      const newStockLevel = currentItem.current_stock - quantity;

      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          current_stock: newStockLevel,
          last_updated: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      // Add activity log manually
      await this.addActivityLog({
        restaurant_id: restaurantId,
        item_id: itemId,
        action: ACTIVITY_TYPES.STOCK_TAKE_OUT,
        old_value: currentItem.current_stock,
        new_value: newStockLevel,
        quantity_changed: -quantity,
        reason: reason,
        notes: notes,
        user_id: userInfo.id,
        user_name: userInfo.name,
        user_role: userInfo.role
      });

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Helper function to add activity logs
  async addActivityLog(logData) {
    try {
      const { error } = await supabase
        .from('inventory_activity_logs')
        .insert(logData);

      if (error) {
      } else {
      }
    } catch (error) {
    }
  }
};

// Utility functions
export const getStockStatus = (item) => {
  if (item.current_stock <= 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (item.current_stock <= item.min_stock_level) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.IN_STOCK;
};

export const getStatusColor = (status) => {
  switch (status) {
    case STOCK_STATUS.IN_STOCK:
      return 'bg-green-100 text-green-800';
    case STOCK_STATUS.LOW_STOCK:
      return 'bg-yellow-100 text-yellow-800';
    case STOCK_STATUS.OUT_OF_STOCK:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getInventoryStats = (items) => {
  const stats = {
    total: items.length,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    expiringSoon: 0
  };

  items.forEach(item => {
    const status = getStockStatus(item);
    if (status === STOCK_STATUS.LOW_STOCK) stats.lowStock++;
    if (status === STOCK_STATUS.OUT_OF_STOCK) stats.outOfStock++;

    stats.totalValue += item.current_stock * item.cost_per_unit;

    if (item.expiry_date) {
      const daysUntilExpiry = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 15 && daysUntilExpiry > 0) stats.expiringSoon++;
    }
  });

  return stats;
};

// Constants for the component
export const INVENTORY_CATEGORIES = [
  'Vegetables', 'Meat', 'Grains', 'Dairy', 'Oils', 'Spices', 'Beverages', 'Fruits', 'Seafood', 'Others'
];

export const INVENTORY_UNITS = [
  'kg', 'L', 'pieces', 'boxes', 'bottles', 'packets', 'cans', 'bags'
];

// Function to get role display color
export const getRoleColor = (role) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'manager':
      return 'bg-purple-100 text-purple-800';
    case 'captain':
      return 'bg-blue-100 text-blue-800';
    case 'chef':
      return 'bg-orange-100 text-orange-800';
    case 'waiter':
      return 'bg-green-100 text-green-800';
    case 'cashier':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Function to get role display name
export const getRoleDisplayName = (role) => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};