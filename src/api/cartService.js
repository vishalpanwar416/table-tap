import { supabase } from '../supabase';
import { validateCartItem, cleanupStaleCartItems } from '../utils/cartUtils';

class CartService {
  // Load user cart from server
  async loadUserCart(userId, restaurantId) {
    try {
      const { data: cart, error } = await supabase
        .from('user_carts')
        .select('*')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }
      
      if (!cart) {
        return { items: [], lastSync: null };
      }
      
      // Validate and clean cart items
      const validItems = [];
      for (const item of cart.items || []) {
        try {
          validateCartItem(item);
          validItems.push(item);
        } catch (validationError) {
        }
      }
      
      // Clean up stale items
      const cleanedItems = await cleanupStaleCartItems(validItems, restaurantId);
      
      return {
        items: cleanedItems,
        lastSync: cart.updated_at,
        cartId: cart.id
      };
    } catch (error) {
      throw new Error('Failed to load cart from server');
    }
  }

  // Save user cart to server
  async saveUserCart(userId, restaurantId, items) {
    try {
      // Validate all items before saving
      for (const item of items) {
        validateCartItem(item);
      }
      
      const { data, error } = await supabase
        .from('user_carts')
        .upsert({
          user_id: userId,
          restaurant_id: restaurantId,
          items: items,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,restaurant_id'
        });
      
      if (error) throw error;
      
      return {
        success: true,
        cartId: data?.[0]?.id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Failed to save cart to server');
    }
  }

  // Delete user cart
  async deleteUserCart(userId, restaurantId) {
    try {
      const { error } = await supabase
        .from('user_carts')
        .delete()
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      throw new Error('Failed to delete cart');
    }
  }

  // Get all user carts (for multi-restaurant support)
  async getUserCarts(userId) {
    try {
      const { data: carts, error } = await supabase
        .from('user_carts')
        .select(`
          *,
          restaurants (
            id,
            name,
            logo,
            address
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Process and validate each cart
      const processedCarts = [];
      for (const cart of carts || []) {
        try {
          const validItems = [];
          for (const item of cart.items || []) {
            try {
              validateCartItem(item);
              validItems.push(item);
            } catch (validationError) {
            }
          }
          
          // Clean up stale items
          const cleanedItems = await cleanupStaleCartItems(validItems, cart.restaurant_id);
          
          processedCarts.push({
            ...cart,
            items: cleanedItems,
            restaurant: cart.restaurants
          });
        } catch (error) {
        }
      }
      
      return processedCarts;
    } catch (error) {
      throw new Error('Failed to load carts');
    }
  }

  // Merge guest cart with user cart
  async mergeGuestCart(userId, restaurantId, guestItems) {
    try {
      // Load existing user cart
      const existingCart = await this.loadUserCart(userId, restaurantId);
      
      // Merge items
      const mergedItems = [...existingCart.items];
      
      guestItems.forEach(guestItem => {
        if (guestItem.restaurant_id === restaurantId) {
          const existingItem = mergedItems.find(item => 
            item.id === guestItem.id && 
            (guestItem.category ? item.category === guestItem.category : true)
          );
          
          if (existingItem) {
            existingItem.quantity += guestItem.quantity;
          } else {
            mergedItems.push(guestItem);
          }
        }
      });
      
      // Save merged cart
      await this.saveUserCart(userId, restaurantId, mergedItems);
      
      return {
        success: true,
        mergedItems: mergedItems.length,
        totalItems: mergedItems.reduce((sum, item) => sum + item.quantity, 0)
      };
    } catch (error) {
      throw new Error('Failed to merge cart');
    }
  }

  // Get cart analytics for user
  async getCartAnalytics(userId, timeRange = '30d') {
    try {
      const { data: carts, error } = await supabase
        .from('user_carts')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const analytics = {
        totalCarts: 0,
        totalItems: 0,
        totalValue: 0,
        averageCartValue: 0,
        mostUsedRestaurants: [],
        popularItems: [],
        cartFrequency: 0,
        lastActivity: null
      };
      
      if (carts && carts.length > 0) {
        const now = Date.now();
        const timeRangeMs = this.getTimeRangeMs(timeRange);
        
        // Filter carts within time range
        const recentCarts = carts.filter(cart => {
          const cartTime = new Date(cart.updated_at).getTime();
          return now - cartTime <= timeRangeMs;
        });
        
        analytics.totalCarts = recentCarts.length;
        analytics.lastActivity = recentCarts[0]?.updated_at;
        
        // Calculate totals
        const restaurantStats = new Map();
        const itemStats = new Map();
        
        recentCarts.forEach(cart => {
          cart.items?.forEach(item => {
            // Restaurant stats
            if (!restaurantStats.has(cart.restaurant_id)) {
              restaurantStats.set(cart.restaurant_id, {
                restaurantId: cart.restaurant_id,
                itemCount: 0,
                totalValue: 0,
                cartCount: 0
              });
            }
            const restaurantStat = restaurantStats.get(cart.restaurant_id);
            restaurantStat.itemCount += item.quantity;
            restaurantStat.totalValue += (item.effectivePrice || item.price) * item.quantity;
            restaurantStat.cartCount = 1; // Will be incremented in next loop
            
            // Item stats
            const itemKey = `${item.id}_${item.category || 'default'}`;
            if (!itemStats.has(itemKey)) {
              itemStats.set(itemKey, {
                id: item.id,
                name: item.name,
                category: item.category,
                quantity: 0,
                totalValue: 0
              });
            }
            const itemStat = itemStats.get(itemKey);
            itemStat.quantity += item.quantity;
            itemStat.totalValue += (item.effectivePrice || item.price) * item.quantity;
            
            analytics.totalItems += item.quantity;
            analytics.totalValue += (item.effectivePrice || item.price) * item.quantity;
          });
        });
        
        // Calculate averages and sort
        analytics.averageCartValue = analytics.totalCarts > 0 ? analytics.totalValue / analytics.totalCarts : 0;
        analytics.mostUsedRestaurants = Array.from(restaurantStats.values())
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 5);
        analytics.popularItems = Array.from(itemStats.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10);
        
        // Calculate cart frequency (carts per week)
        const weeksInRange = timeRangeMs / (7 * 24 * 60 * 60 * 1000);
        analytics.cartFrequency = weeksInRange > 0 ? analytics.totalCarts / weeksInRange : 0;
      }
      
      return analytics;
    } catch (error) {
      throw new Error('Failed to load cart analytics');
    }
  }

  // Backup cart data
  async backupCart(userId, restaurantId, backupData) {
    try {
      const { data, error } = await supabase
        .from('cart_backups')
        .insert({
          user_id: userId,
          restaurant_id: restaurantId,
          backup_data: backupData,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      return {
        success: true,
        backupId: data[0]?.id
      };
    } catch (error) {
      throw new Error('Failed to create backup');
    }
  }

  // Restore cart from backup
  async restoreCart(userId, backupId) {
    try {
      const { data: backup, error } = await supabase
        .from('cart_backups')
        .select('*')
        .eq('id', backupId)
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      if (!backup) {
        throw new Error('Backup not found');
      }
      
      // Restore cart
      await this.saveUserCart(userId, backup.restaurant_id, backup.backup_data.items);
      
      return {
        success: true,
        restoredItems: backup.backup_data.items.length,
        restaurantId: backup.restaurant_id
      };
    } catch (error) {
      throw new Error('Failed to restore cart');
    }
  }

  // Get user's cart backups
  async getCartBackups(userId) {
    try {
      const { data: backups, error } = await supabase
        .from('cart_backups')
        .select(`
          *,
          restaurants (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return backups || [];
    } catch (error) {
      throw new Error('Failed to load backups');
    }
  }

  // Clean up old cart data
  async cleanupOldCarts(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const { data, error } = await supabase
        .from('user_carts')
        .delete()
        .lt('updated_at', cutoffDate.toISOString());
      
      if (error) throw error;
      
      return {
        success: true,
        deletedCount: data?.length || 0
      };
    } catch (error) {
      throw new Error('Failed to cleanup old carts');
    }
  }

  // Helper method to convert time range to milliseconds
  getTimeRangeMs(timeRange) {
    const ranges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
    
    return ranges[timeRange] || ranges['30d'];
  }

  // Sync cart with external systems (placeholder for future integrations)
  async syncWithExternalSystem(userId, restaurantId, cartData) {
    try {
      // This is a placeholder for future integrations
      // You could sync with POS systems, inventory systems, etc.
      
        userId,
        restaurantId,
        itemCount: cartData.items?.length || 0
      });
      
      return { success: true, synced: true };
    } catch (error) {
      throw new Error('Failed to sync with external system');
    }
  }
}

export const cartService = new CartService(); 