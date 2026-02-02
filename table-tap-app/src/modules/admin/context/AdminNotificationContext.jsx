import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../shared/supabase';

const AdminNotificationContext = createContext();

// Notification types for admin
export const NOTIFICATION_TYPES = {
  // Inquiry notifications
  NEW_INQUIRY: 'new_inquiry',
  INQUIRY_CONVERTED: 'inquiry_converted',
  
  // Registration notifications
  NEW_REGISTRATION: 'new_registration',
  REGISTRATION_APPROVED: 'registration_approved',
  REGISTRATION_REJECTED: 'registration_rejected',
  
  // Subscription notifications
  NEW_SUBSCRIPTION: 'new_subscription',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  
  // Restaurant notifications
  NEW_RESTAURANT: 'new_restaurant',
  RESTAURANT_ACTIVATED: 'restaurant_activated',
  RESTAURANT_DEACTIVATED: 'restaurant_deactivated',
  
  // Staff notifications
  NEW_STAFF: 'new_staff',
  STAFF_CONNECTED: 'staff_connected',
  
  // Feature notifications
  AI_ENABLED: 'ai_enabled',
  AI_DISABLED: 'ai_disabled',
  AGGREGATORS_ENABLED: 'aggregators_enabled',
  AGGREGATORS_DISABLED: 'aggregators_disabled',
  
  // Payment notifications
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  
  // Email notifications
  EMAIL_SENT: 'email_sent',
  EMAIL_FAILED: 'email_failed'
};

export const AdminNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch all admin notifications
  const fetchNotifications = useCallback(async () => {
    try {
      // Fetch from admin_notifications table
      const { data: adminNotifications, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        // Table might not exist, create initial notifications from recent activity
        console.log('Admin notifications table may not exist, fetching from activity...');
        await fetchFromActivity();
        return;
      }

      setNotifications(adminNotifications || []);
      setUnreadCount((adminNotifications || []).filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      await fetchFromActivity();
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications from recent activity (fallback)
  const fetchFromActivity = async () => {
    try {
      const notifications = [];

      // Get recent inquiries (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: inquiries } = await supabase
        .from('landing_inquiries')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (inquiries) {
        inquiries.forEach(inquiry => {
          notifications.push({
            id: `inquiry-${inquiry.id}`,
            type: NOTIFICATION_TYPES.NEW_INQUIRY,
            title: 'New Lead Inquiry',
            message: `${inquiry.restaurant_name || inquiry.name} submitted an inquiry`,
            metadata: { inquiry_id: inquiry.id, email: inquiry.email },
            read: inquiry.status !== 'pending' && inquiry.status !== 'new',
            created_at: inquiry.created_at
          });
        });
      }

      // Get recent registrations
      const { data: registrations } = await supabase
        .from('restaurant_registrations')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (registrations) {
        registrations.forEach(reg => {
          notifications.push({
            id: `registration-${reg.id}`,
            type: NOTIFICATION_TYPES.NEW_REGISTRATION,
            title: 'New Restaurant Registration',
            message: `${reg.restaurant_name} registered for approval`,
            metadata: { registration_id: reg.id },
            read: reg.status !== 'pending',
            created_at: reg.created_at
          });
        });
      }

      // Get recent subscription events
      const { data: subHistory } = await supabase
        .from('subscription_history')
        .select(`
          *,
          restaurant:restaurants (name)
        `)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(30);

      if (subHistory) {
        subHistory.forEach(event => {
          let type, title;
          switch (event.action) {
            case 'created':
              type = NOTIFICATION_TYPES.NEW_SUBSCRIPTION;
              title = 'New Subscription';
              break;
            case 'renewed':
              type = NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED;
              title = 'Subscription Renewed';
              break;
            case 'cancelled':
              type = NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED;
              title = 'Subscription Cancelled';
              break;
            case 'expired':
              type = NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED;
              title = 'Subscription Expired';
              break;
            default:
              type = 'subscription_update';
              title = 'Subscription Update';
          }

          notifications.push({
            id: `sub-${event.id}`,
            type,
            title,
            message: `${event.restaurant?.name || 'Restaurant'} - ${event.new_plan || event.action}`,
            metadata: { 
              subscription_id: event.subscription_id, 
              restaurant_id: event.restaurant_id,
              amount: event.amount_paid
            },
            read: true, // Historical events marked as read
            created_at: event.created_at
          });
        });
      }

      // Sort all by date
      notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching activity notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Try to update in database
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', notificationId);
    } catch (error) {
      // Ignore if table doesn't exist
    }

    // Update local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('read', false);
    } catch (error) {
      // Ignore if table doesn't exist
    }

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Add a new notification
  const addNotification = async (notification) => {
    const newNotification = {
      id: `${notification.type}-${Date.now()}`,
      ...notification,
      read: false,
      created_at: new Date().toISOString()
    };

    try {
      // Try to insert into database
      await supabase
        .from('admin_notifications')
        .insert([newNotification]);
    } catch (error) {
      // Ignore if table doesn't exist
    }

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  // Clear old notifications (keep last 100)
  const clearOldNotifications = async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      await supabase
        .from('admin_notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('read', true);
    } catch (error) {
      // Ignore
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    fetchNotifications();

    // Subscribe to new inquiries
    const inquirySubscription = supabase
      .channel('admin-inquiries')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'landing_inquiries'
      }, (payload) => {
        const inquiry = payload.new;
        addNotification({
          type: NOTIFICATION_TYPES.NEW_INQUIRY,
          title: 'New Lead Inquiry',
          message: `${inquiry.restaurant_name || inquiry.name} submitted an inquiry`,
          metadata: { inquiry_id: inquiry.id, email: inquiry.email }
        });
      })
      .subscribe();

    // Subscribe to new registrations
    const registrationSubscription = supabase
      .channel('admin-registrations')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'restaurant_registrations'
      }, (payload) => {
        const reg = payload.new;
        addNotification({
          type: NOTIFICATION_TYPES.NEW_REGISTRATION,
          title: 'New Restaurant Registration',
          message: `${reg.restaurant_name} registered for approval`,
          metadata: { registration_id: reg.id }
        });
      })
      .subscribe();

    // Subscribe to subscription history (new subscriptions, renewals, etc.)
    const subHistorySubscription = supabase
      .channel('admin-subscriptions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'subscription_history'
      }, async (payload) => {
        const event = payload.new;
        
        // Get restaurant name
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('name')
          .eq('id', event.restaurant_id)
          .single();

        let type, title, message;
        switch (event.action) {
          case 'created':
            type = NOTIFICATION_TYPES.NEW_SUBSCRIPTION;
            title = 'New Subscription';
            message = `${restaurant?.name || 'Restaurant'} - ${event.new_plan || 'Plan'}${event.amount_paid ? ` (₹${event.amount_paid.toLocaleString()})` : ''}`;
            break;
          case 'renewed':
            type = NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED;
            title = 'Subscription Renewed';
            message = `${restaurant?.name || 'Restaurant'} - ${event.new_plan || 'Plan'}${event.amount_paid ? ` (₹${event.amount_paid.toLocaleString()})` : ''}`;
            break;
          case 'cancelled':
            type = NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED;
            title = 'Subscription Cancelled';
            message = `${restaurant?.name || 'Restaurant'} subscription cancelled`;
            break;
          case 'expired':
            type = NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED;
            title = 'Subscription Expired';
            message = `${restaurant?.name || 'Restaurant'} subscription has expired`;
            break;
          case 'upgraded':
            type = NOTIFICATION_TYPES.SUBSCRIPTION_UPGRADED;
            title = 'Subscription Upgraded';
            message = `${restaurant?.name || 'Restaurant'} upgraded to ${event.new_plan || 'new plan'}${event.amount_paid ? ` (₹${event.amount_paid.toLocaleString()})` : ''}`;
            break;
          case 'downgraded':
            type = NOTIFICATION_TYPES.SUBSCRIPTION_DOWNGRADED;
            title = 'Subscription Downgraded';
            message = `${restaurant?.name || 'Restaurant'} downgraded to ${event.new_plan || 'plan'}`;
            break;
          case 'payment_received':
            type = NOTIFICATION_TYPES.PAYMENT_RECEIVED;
            title = 'Payment Received';
            message = `₹${(event.amount_paid || 0).toLocaleString()} received from ${restaurant?.name || 'Restaurant'}`;
            break;
          case 'payment_failed':
            type = NOTIFICATION_TYPES.PAYMENT_FAILED;
            title = 'Payment Failed';
            message = `₹${(event.amount_paid || 0).toLocaleString()} payment failed for ${restaurant?.name || 'Restaurant'}`;
            break;
          default:
            type = 'subscription_update';
            title = 'Subscription Update';
            message = `${restaurant?.name || 'Restaurant'} - ${event.action}${event.amount_paid ? ` (₹${event.amount_paid.toLocaleString()})` : ''}`;
        }

        addNotification({
          type,
          title,
          message,
          metadata: { 
            subscription_id: event.subscription_id, 
            restaurant_id: event.restaurant_id,
            amount: event.amount_paid
          }
        });
      })
      .subscribe();

    // Subscribe to registration status changes (approved/rejected)
    const registrationStatusSubscription = supabase
      .channel('admin-registration-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'restaurant_registrations'
      }, (payload) => {
        const reg = payload.new;
        const oldReg = payload.old;
        
        // Only notify on status changes
        if (reg.status !== oldReg.status) {
          if (reg.status === 'approved') {
            addNotification({
              type: NOTIFICATION_TYPES.REGISTRATION_APPROVED,
              title: 'Registration Approved',
              message: `${reg.restaurant_name} has been approved`,
              metadata: { registration_id: reg.id }
            });
          } else if (reg.status === 'rejected') {
            addNotification({
              type: NOTIFICATION_TYPES.REGISTRATION_REJECTED,
              title: 'Registration Rejected',
              message: `${reg.restaurant_name} has been rejected`,
              metadata: { registration_id: reg.id }
            });
          }
        }
      })
      .subscribe();

    // Subscribe to inquiry status changes (converted)
    const inquiryStatusSubscription = supabase
      .channel('admin-inquiry-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'landing_inquiries'
      }, (payload) => {
        const inquiry = payload.new;
        const oldInquiry = payload.old;
        
        // Notify when inquiry is converted
        if (inquiry.status === 'converted' && oldInquiry.status !== 'converted') {
          addNotification({
            type: NOTIFICATION_TYPES.INQUIRY_CONVERTED,
            title: 'Lead Converted',
            message: `${inquiry.restaurant_name || inquiry.name} converted to customer`,
            metadata: { inquiry_id: inquiry.id }
          });
        }
      })
      .subscribe();

    // Subscribe to new restaurants
    const restaurantSubscription = supabase
      .channel('admin-restaurants')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'restaurants'
      }, (payload) => {
        const restaurant = payload.new;
        addNotification({
          type: NOTIFICATION_TYPES.NEW_RESTAURANT,
          title: 'New Restaurant Added',
          message: `${restaurant.name} has been created`,
          metadata: { restaurant_id: restaurant.id }
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'restaurants'
      }, (payload) => {
        const restaurant = payload.new;
        const oldRestaurant = payload.old;
        
        // Restaurant activation/deactivation
        if (restaurant.is_active !== oldRestaurant.is_active) {
          addNotification({
            type: restaurant.is_active ? NOTIFICATION_TYPES.RESTAURANT_ACTIVATED : NOTIFICATION_TYPES.RESTAURANT_DEACTIVATED,
            title: restaurant.is_active ? 'Restaurant Activated' : 'Restaurant Deactivated',
            message: `${restaurant.name} is now ${restaurant.is_active ? 'active' : 'inactive'}`,
            metadata: { restaurant_id: restaurant.id }
          });
        }
        
        // AI feature toggle
        if (restaurant.ai_enabled !== oldRestaurant.ai_enabled) {
          addNotification({
            type: restaurant.ai_enabled ? NOTIFICATION_TYPES.AI_ENABLED : NOTIFICATION_TYPES.AI_DISABLED,
            title: restaurant.ai_enabled ? 'AI Features Enabled' : 'AI Features Disabled',
            message: `AI features ${restaurant.ai_enabled ? 'enabled' : 'disabled'} for ${restaurant.name}`,
            metadata: { restaurant_id: restaurant.id }
          });
        }
        
        // Aggregators toggle
        if (restaurant.aggregators_enabled !== oldRestaurant.aggregators_enabled) {
          addNotification({
            type: restaurant.aggregators_enabled ? NOTIFICATION_TYPES.AGGREGATORS_ENABLED : NOTIFICATION_TYPES.AGGREGATORS_DISABLED,
            title: restaurant.aggregators_enabled ? 'Aggregators Enabled' : 'Aggregators Disabled',
            message: `Aggregators ${restaurant.aggregators_enabled ? 'enabled' : 'disabled'} for ${restaurant.name}`,
            metadata: { restaurant_id: restaurant.id }
          });
        }
      })
      .subscribe();

    // Subscribe to new staff members
    const staffSubscription = supabase
      .channel('admin-staff')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'restaurant_staff'
      }, async (payload) => {
        const staff = payload.new;
        
        // Get restaurant name
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('name')
          .eq('id', staff.restaurant_id)
          .single();

        addNotification({
          type: NOTIFICATION_TYPES.NEW_STAFF,
          title: 'New Staff Added',
          message: `${staff.staff_name} (${staff.staff_role}) added to ${restaurant?.name || 'restaurant'}`,
          metadata: { staff_id: staff.id, restaurant_id: staff.restaurant_id }
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'restaurant_staff'
      }, async (payload) => {
        const staff = payload.new;
        const oldStaff = payload.old;
        
        // Staff connected their account
        if (staff.connected && !oldStaff.connected) {
          const { data: restaurant } = await supabase
            .from('restaurants')
            .select('name')
            .eq('id', staff.restaurant_id)
            .single();

          addNotification({
            type: NOTIFICATION_TYPES.STAFF_CONNECTED,
            title: 'Staff Connected',
            message: `${staff.staff_name} linked their account at ${restaurant?.name || 'restaurant'}`,
            metadata: { staff_id: staff.id, restaurant_id: staff.restaurant_id }
          });
        }
      })
      .subscribe();

    // Subscribe to email activity logs
    const emailActivitySubscription = supabase
      .channel('admin-email-activity')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_activity_logs'
      }, async (payload) => {
        const activity = payload.new;
        
        // Only notify for email activities
        if (activity.target_type === 'email') {
          const emailType = activity.details?.email_type;
          const emailTypeLabel = emailType ? 
            emailType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 
            'Email';

          if (activity.status === 'failed') {
            addNotification({
              type: NOTIFICATION_TYPES.EMAIL_FAILED,
              title: 'Email Failed',
              message: `${emailTypeLabel} failed to send to ${activity.target_name}`,
              metadata: { 
                activity_id: activity.id,
                email_type: emailType,
                recipient: activity.target_name,
                error: activity.details?.error_message
              }
            });
          } else if (activity.status === 'success') {
            addNotification({
              type: NOTIFICATION_TYPES.EMAIL_SENT,
              title: 'Email Sent',
              message: `${emailTypeLabel} sent to ${activity.target_name}${activity.details?.amount ? ` (₹${activity.details.amount.toLocaleString()})` : ''}`,
              metadata: { 
                activity_id: activity.id,
                email_type: emailType,
                recipient: activity.target_name,
                amount: activity.details?.amount
              }
            });
          }
        }
      })
      .subscribe();

    // Cleanup
    return () => {
      inquirySubscription.unsubscribe();
      registrationSubscription.unsubscribe();
      subHistorySubscription.unsubscribe();
      registrationStatusSubscription.unsubscribe();
      inquiryStatusSubscription.unsubscribe();
      restaurantSubscription.unsubscribe();
      staffSubscription.unsubscribe();
      emailActivitySubscription.unsubscribe();
    };
  }, []);

  // Clear old notifications periodically
  useEffect(() => {
    clearOldNotifications();
    const interval = setInterval(clearOldNotifications, 24 * 60 * 60 * 1000); // Daily
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminNotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      addNotification,
      refreshNotifications: fetchNotifications,
      NOTIFICATION_TYPES
    }}>
      {children}
    </AdminNotificationContext.Provider>
  );
};

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
  }
  return context;
};
