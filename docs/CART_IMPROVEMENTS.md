# Cart System Improvements

This document outlines the comprehensive improvements made to the cart system in Table-Tap-QR.

## Overview

The cart system has been completely refactored to provide:
- **Robust data validation** and error handling
- **Server synchronization** with Supabase
- **Performance optimizations** with debouncing and memoization
- **Advanced cart operations** and utilities
- **Multi-restaurant support** with proper isolation
- **Cart analytics** and backup functionality
- **Automatic cleanup** of stale items

## Key Improvements

### 1. Enhanced CartContext (`src/config/CartContent.jsx`)

#### Features Added:
- **Data Validation**: Comprehensive validation of cart items before adding/updating
- **Server Integration**: Full Supabase integration for cart persistence
- **Error Handling**: Robust error handling with user-friendly messages
- **Debounced Saves**: Prevents excessive server calls with 2-second debouncing
- **Automatic Cleanup**: Removes stale items that no longer exist in the database
- **Multi-restaurant Support**: Proper handling of carts across different restaurants
- **Periodic Sync**: Automatic server synchronization every 5 minutes for logged-in users

#### Key Functions:
```javascript
// Add item with validation
addToCart(item)

// Update quantity with validation
updateQuantity(id, category, quantity)

// Remove item
removeItem(id, category)

// Clear entire cart
clearCart()

// Manual server sync
syncWithServer()

// Calculate effective price with discounts
calculateEffectivePrice(item)
```

### 2. Cart Utilities (`src/utils/cartUtils.js`)

#### Utility Functions:
- **`validateCartItem(item)`**: Validates cart item structure and data
- **`calculateEffectivePrice(item, userDiscount)`**: Calculates final price with all discounts
- **`cleanupStaleCartItems(cartItems, restaurantId)`**: Removes items that no longer exist
- **`mergeCarts(guestCart, userCart, restaurantId)`**: Merges guest and user carts
- **`calculateCartTotals(cartItems, userDiscount)`**: Calculates comprehensive cart totals
- **`formatPrice(price, currency)`**: Formats prices for display
- **`generateCartSummary(cartItems, maxItems)`**: Generates human-readable cart summaries
- **`exportCartData(cartItems, metadata)`**: Exports cart data for backup/transfer
- **`importCartData(exportedData)`**: Imports cart data with validation

### 3. Advanced Cart Hook (`src/hooks/useCartOperations.js`)

#### Advanced Operations:
- **`addMultipleToCart(items)`**: Add multiple items at once
- **`removeMultipleItems(itemIds)`**: Remove multiple items
- **`updateMultipleQuantities(updates)`**: Update multiple quantities
- **`duplicateItem(id, category)`**: Duplicate a cart item
- **`splitItem(id, category, quantities)`**: Split item into separate entries
- **`exportCart(metadata)`**: Export cart data
- **`importCart(exportedData, options)`**: Import cart data with merge options
- **`getCartStats()`**: Get comprehensive cart statistics

#### Computed Values:
- **`cartTotals`**: Detailed breakdown of cart totals
- **`hasMixedRestaurantsInCart`**: Check if cart has items from multiple restaurants
- **`cartRestaurants`**: List of restaurants in cart
- **`isCartEmpty`**: Check if cart is empty
- **`currentRestaurantItems`**: Items for current restaurant only
- **`otherRestaurantItems`**: Items from other restaurants

### 4. Cart Service (`src/api/cartService.js`)

#### Server Operations:
- **`loadUserCart(userId, restaurantId)`**: Load cart from server
- **`saveUserCart(userId, restaurantId, items)`**: Save cart to server
- **`deleteUserCart(userId, restaurantId)`**: Delete cart from server
- **`getUserCarts(userId)`**: Get all user carts across restaurants
- **`mergeGuestCart(userId, restaurantId, guestItems)`**: Merge guest cart with user cart
- **`getCartAnalytics(userId, timeRange)`**: Get cart analytics and statistics
- **`backupCart(userId, restaurantId, backupData)`**: Create cart backup
- **`restoreCart(userId, backupId)`**: Restore cart from backup
- **`getCartBackups(userId)`**: Get user's cart backups
- **`cleanupOldCarts(daysOld)`**: Clean up old cart data

### 5. Database Schema

#### New Tables:

**`user_carts`** - Main cart storage:
```sql
CREATE TABLE user_carts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  restaurant_id UUID REFERENCES restaurants(id),
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, restaurant_id)
);
```

**`cart_backups`** - Cart backup storage:
```sql
CREATE TABLE cart_backups (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  restaurant_id UUID REFERENCES restaurants(id),
  backup_data JSONB NOT NULL,
  backup_name VARCHAR(255),
  backup_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE
);
```

#### Features:
- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic Timestamps**: Created/updated timestamps managed by triggers
- **Indexes**: Optimized for performance
- **Foreign Key Constraints**: Data integrity
- **Cleanup Functions**: Automatic cleanup of old data

## Usage Examples

### Basic Cart Operations
```javascript
import { useCart } from '../config/CartContent';

function MyComponent() {
  const { 
    cartItems, 
    addToCart, 
    removeItem, 
    updateQuantity, 
    getTotalPrice 
  } = useCart();

  const handleAddItem = (item) => {
    addToCart(item);
  };

  const handleUpdateQuantity = (id, category, quantity) => {
    updateQuantity(id, category, quantity);
  };
}
```

### Advanced Cart Operations
```javascript
import { useCartOperations } from '../hooks/useCartOperations';

function AdvancedCartComponent() {
  const {
    cartTotals,
    hasMixedRestaurantsInCart,
    exportCart,
    importCart,
    getCartStats
  } = useCartOperations();

  const handleExport = () => {
    const exportedData = exportCart({ 
      description: 'My cart backup' 
    });
    // Save to file or share
  };

  const handleImport = (data) => {
    const result = importCart(data, { merge: true });
    if (result.success) {
      console.log(`Imported ${result.importedCount} items`);
    }
  };
}
```

### Server Operations
```javascript
import { cartService } from '../api/cartService';

// Load cart from server
const cart = await cartService.loadUserCart(userId, restaurantId);

// Save cart to server
await cartService.saveUserCart(userId, restaurantId, cartItems);

// Get cart analytics
const analytics = await cartService.getCartAnalytics(userId, '30d');
```

## Error Handling

The system includes comprehensive error handling:

### Validation Errors
- Invalid item structure
- Missing required fields
- Invalid price or quantity values
- Expired cart data

### Network Errors
- Server connection issues
- Authentication failures
- Rate limiting

### Storage Errors
- localStorage quota exceeded
- Corrupted data
- Permission issues

### Error Recovery
- Automatic retry mechanisms
- Fallback to localStorage
- Data corruption cleanup
- User-friendly error messages

## Performance Optimizations

### Debouncing
- Server saves debounced by 2 seconds
- Prevents excessive API calls

### Memoization
- Cart totals memoized
- Computed values cached
- Prevents unnecessary re-renders

### Lazy Loading
- Cart data loaded on demand
- Stale item cleanup in background

### Compression
- Cart data compression for storage
- Reduced localStorage usage

## Security Features

### Data Validation
- Input sanitization
- Type checking
- Range validation

### Access Control
- Row Level Security (RLS)
- User-specific data isolation
- Restaurant-specific access

### Data Integrity
- Foreign key constraints
- Transaction support
- Backup and restore

## Monitoring and Analytics

### Cart Analytics
- Total items and value
- Most used restaurants
- Popular items
- Cart frequency
- User behavior patterns

### Performance Metrics
- Load times
- Sync success rates
- Error rates
- Storage usage

### Usage Statistics
- Active carts
- Cart abandonment rates
- Conversion rates
- User engagement

## Migration Guide

### From Old Cart System
1. **Update imports**: Use new `useCart` hook
2. **Replace direct localStorage access**: Use provided methods
3. **Update error handling**: Use new error states
4. **Test server sync**: Ensure Supabase integration works

### Database Setup
1. Run `scripts/setup-cart-table.sql`
2. Run `scripts/setup-cart-backup-table.sql`
3. Configure RLS policies
4. Set up cleanup functions

## Future Enhancements

### Planned Features
- **Real-time sync**: WebSocket-based live updates
- **Offline support**: Service worker caching
- **Advanced analytics**: Machine learning insights
- **Integration APIs**: POS system integration
- **Mobile optimization**: Native app features

### Performance Improvements
- **Virtual scrolling**: For large carts
- **Incremental sync**: Delta updates only
- **Background sync**: Offline queue processing
- **CDN integration**: Global data distribution

## Troubleshooting

### Common Issues

**Cart not syncing**
- Check user authentication
- Verify Supabase connection
- Check RLS policies
- Review error logs

**Items disappearing**
- Check stale item cleanup
- Verify item validation
- Review restaurant switching logic
- Check localStorage quota

**Performance issues**
- Monitor cart size
- Check for memory leaks
- Review debouncing settings
- Optimize re-renders

### Debug Tools
- Browser DevTools for localStorage
- Supabase dashboard for database
- Network tab for API calls
- Console logs for debugging

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Test with minimal data
4. Contact development team

---

*Last updated: [Current Date]*
*Version: 2.0.0* 