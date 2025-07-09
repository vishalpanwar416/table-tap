# Notification System Overview

This document provides a comprehensive overview of all files that handle updating notifications on the server in the Table-Tap-QR application.

## Core Service Files

### 1. `src/api/notificationService.js` - Main Notification Service
**Primary functions that update the server:**

- **`createNotification(notification)`** - Creates new notifications
- **`markNotificationAsRead(notificationId)`** - Updates notification read status
- **`markAllNotificationsAsRead(userId)`** - Marks all user notifications as read
- **`markAllManagerNotificationsAsRead()`** - Marks all manager notifications as read
- **`deleteNotification(notificationId)`** - Deletes notifications
- **`formatNotificationForDisplay(notification)`** - Formats notifications for UI display

**Real-time subscriptions:**
- **`subscribeToUserNotifications(userId, callback)`** - Real-time user notifications
- **`subscribeToManagerNotifications(callback)`** - Real-time manager notifications

### 2. `src/api/NotificationServiceuser.js` - User Notification Service
**Functions that update the server:**

- **`getUserNotifications(userId)`** - Fetches user notifications
- **`getUnreadCount(userId)`** - Gets unread notification count
- **`markAsRead(notificationId)`** - Marks notification as read
- **`markAllAsRead(userId)`** - Marks all notifications as read
- **`deleteNotification(notificationId)`** - Deletes notification
- **`createNotification(notificationData)`** - Creates new notification
- **`subscribeToNotifications(userId, callback)`** - Real-time subscription

### 3. `src/api/orderService.js` - Order Service with Notifications
**Functions that update the server:**

- **`createManagerOrderNotification(order)`** - Creates manager notifications for new orders
- **`createOrderStatusNotification(order)`** - Creates user notifications for order status changes
- **`updateOrderStatus(orderId, status)`** - Updates order status and creates notifications

### 4. `src/Pages/RestaurantManagement/service.js` - Restaurant Management Service
**Functions that update the server:**

- **`createNotification(userId, orderId, message)`** - Creates notifications for orders
- **`markNotificationAsRead(notificationId)`** - Marks notifications as read
- **`subscribeToNotifications(userId, callback)`** - Real-time subscription

## Context Providers (State Management)

### 5. `src/context/NotificationContext.jsx` - User Notifications Context
**Functions that update the server:**

- **`markAsRead(notificationId)`** - Calls `markNotificationAsRead()`
- **`markAllAsRead()`** - Calls `markAllNotificationsAsRead()`
- **`fetchNotifications()`** - Fetches user notifications
- **`showBrowserNotification(notification)`** - Shows browser notifications

### 6. `src/context/ManagerNotificationContext.jsx` - Manager Notifications Context
**Functions that update the server:**

- **`markAllAsRead()`** - Calls `markAllManagerNotificationsAsRead()`
- **`fetchManagerNotifications()`** - Fetches manager notifications

## Custom Hooks

### 7. `src/hooks/useNotification.js` - Custom Notification Hook
**Functions that update the server:**

- **`markAsRead(notificationId)`** - Marks individual notifications as read
- **`markAllAsRead()`** - Marks all notifications as read
- **`deleteNotification(notificationId)`** - Deletes notifications
- **`refresh()`** - Refreshes notifications
- **`requestNotificationPermission()`** - Requests browser notification permission

## Admin Dashboard Files

### 8. `src/Pages/RestaurantManagement/adminDashboard.jsx` - Admin Dashboard
**Functions that update the server:**

- **`updateOrderStatus(orderId, status)`** - Updates order status and creates customer notifications
- Direct Supabase calls to insert notifications with proper timestamps

## UI Components

### 9. `src/components/admin/AdminNotificationsToast.jsx` - Admin Notification Toast
### 10. `src/components/admin/ManagerNotificationsToast.jsx` - Manager Notification Toast
### 11. `src/components/admin/NotificationToast.jsx` - Generic Notification Toast
### 12. `src/components/admin/NotificationSound.jsx` - Notification Sound Component
### 13. `src/Pages/AdminPannel/components/AdminHeader.jsx` - Admin Header with Notifications
### 14. `src/Pages/AdminPannel/components/MobileAdminHeader.jsx` - Mobile Admin Header
### 15. `src/Pages/AdminPannel/components/ToastNotifications.jsx` - Toast Notifications Component

## Database Schema

The notifications table uses the following key columns:
- `id` - Primary key (UUID)
- `user_id` - User who receives the notification (UUID, foreign key to auth.users)
- `order_id` - Associated order (UUID, optional)
- `title` - Notification title (text, required)
- `message` - Notification message (text, required)
- `type` - Notification type (text, required, with specific allowed values)
- `is_admin_notification` - Boolean for admin notifications (default: false)
- `read` - Boolean indicating if notification is read (default: false)
- `metadata` - Additional JSON data (JSONB, optional)
- `created_at` - Timestamp with timezone (default: now())
- `updated_at` - Timestamp with timezone (default: now())

### Allowed Notification Types:
- `order_received` - New order received
- `order_accepted` - Order accepted by restaurant
- `order_preparing` - Order is being prepared
- `order_ready` - Order is ready for pickup/delivery
- `order_rejected` - Order was rejected
- `payment_success` - Payment successful
- `payment_failed` - Payment failed

## Real-time Features

The system uses Supabase real-time subscriptions for:
- Instant notification delivery
- Live unread count updates
- Real-time status changes
- Cross-device synchronization

## Browser Notifications

The system supports browser notifications for:
- New orders (managers)
- Order status updates (customers)
- System notifications
- Permission management

## Recent Fixes Applied

1. **Created missing `NotificationServiceuser.js`** - Fixed import error in `useNotification.js`
2. **Updated to match database schema** - Aligned all code with the actual database table structure
3. **Standardized column names** - Using `is_admin_notification` as per database schema
4. **Added type validation** - Enforced allowed notification types from database constraints
5. **Updated metadata handling** - Changed from `data` to `metadata` column
6. **Fixed notification types** - Using specific types like `order_received`, `order_accepted`, etc.
7. **Added proper timestamps** - Leveraging database defaults for `created_at` and `updated_at`

## Usage Examples

### Creating a notification:
```javascript
import { createNotification } from '../api/notificationService';

await createNotification({
  title: 'New Order',
  message: 'Order #123 has been placed',
  type: 'order_received', // Must be one of the allowed types
  user_id: 'user-uuid',
  order_id: 'order-uuid',
  metadata: { order_details: 'additional data' }
});
```

### Marking as read:
```javascript
import { markNotificationAsRead } from '../api/notificationService';

await markNotificationAsRead('notification-id');
```

### Real-time subscription:
```javascript
import { subscribeToUserNotifications } from '../api/notificationService';

const subscription = subscribeToUserNotifications(userId, (notification) => {
  console.log('New notification:', notification);
});
```

This notification system provides comprehensive functionality for both user and manager notifications with real-time updates, browser notifications, and proper state management. 