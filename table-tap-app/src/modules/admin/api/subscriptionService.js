import { supabase } from '../../shared/supabase';

// ========= SUBSCRIPTION MANAGEMENT WITH DATABASE TABLE =========
// Uses subscriptions table with automatic restaurant status updates

// Master data is now fetched from database tables: subscription_plans and billing_cycles


/**
 * Get all subscription plans from database
 */
export const getSubscriptionPlans = async () => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('base_price', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get all billing cycles from database
 */
export const getBillingCycles = async () => {
  try {
    const { data, error } = await supabase
      .from('billing_cycles')
      .select('*')
      .order('duration_months', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Create a new subscription plan
 */
export const createSubscriptionPlan = async (planData) => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert([planData])
      .select()
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Update an existing subscription plan
 */
export const updateSubscriptionPlan = async (id, planData) => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update(planData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Delete a subscription plan (soft delete by setting is_active=false)
 */
export const deleteSubscriptionPlan = async (id) => {
  try {
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get all restaurant subscriptions from the subscriptions table
 */
export const getRestaurantSubscriptions = async () => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          is_active
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Plan detail mapping will happen on consumer side or via extra fetch if needed
    // For now returning subscriptions- the consumer can look up plans from the plans state
    return { data: subscriptions, error: null };

    return { data: enrichedSubscriptions, error: null };
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Get subscription by restaurant ID
 */
export const getRestaurantSubscription = async (restaurantId) => {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          is_active
        )
      `)
      .eq('restaurant_id', restaurantId)
      .in('status', ['active', 'grace_period'])
      .maybeSingle();

    if (error) throw error;

    if (subscription) {
      return {
        data: subscription,
        error: null
      };
    }

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Assign/Create subscription for a restaurant
 * This will automatically activate the restaurant via database trigger
 */
export const assignSubscriptionToRestaurant = async (subscriptionData) => {
  try {
    // Fetch plan from DB instead of constant
    const { data: dbPlans } = await getSubscriptionPlans();
    const plan = dbPlans?.find(p => p.key === subscriptionData.plan_id);

    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    // Calculate end date based on billing cycle
    const { data: cycles } = await getBillingCycles();
    const cycle = cycles?.find(c => c.key === subscriptionData.billing_cycle);
    if (!cycle) throw new Error('Invalid billing cycle');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + cycle.duration_months);

    const totalBase = plan.base_price * cycle.duration_months;
    const discountAmount = Math.round(totalBase * (cycle.discount_percentage / 100));
    const price = totalBase - discountAmount;
    const gstAmount = Math.round(price * 0.18);
    const totalAmount = price + gstAmount;

    // Check if restaurant already has an active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('restaurant_id', subscriptionData.restaurant_id)
      .in('status', ['active', 'grace_period'])
      .maybeSingle();

    if (existingSub) {
      throw new Error('Restaurant already has an active subscription. Please cancel or expire it first.');
    }

    // Create subscription - the database trigger will activate the restaurant
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        restaurant_id: subscriptionData.restaurant_id,
        plan_name: plan.key,
        billing_cycle: subscriptionData.billing_cycle || 'monthly',
        plan_price: price,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        next_payment_date: endDate.toISOString(),
        last_payment_date: startDate.toISOString(),
        payment_method: subscriptionData.payment_method || 'manual',
        status: 'active',
        auto_renew: true,
        grace_period_days: 7
      }])
      .select(`
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          is_active
        )
      `)
      .maybeSingle();

    if (error) throw error;

    // Also update AI status based on plan
    if (plan.ai_features_enabled) {
      await supabase
        .from('restaurants')
        .update({ ai_enabled: true })
        .eq('id', subscriptionData.restaurant_id);
    }

    // Log to subscription history
    await supabase
      .from('subscription_history')
      .insert([{
        subscription_id: data.id,
        restaurant_id: subscriptionData.restaurant_id,
        action: 'created',
        new_plan: plan.key,
        new_status: 'active',
        amount_paid: totalAmount,
        notes: subscriptionData.notes || 'Subscription created'
      }]);

    return {
      data: {
        ...data,
        plan: plan
      },
      error: null
    };
  } catch (error) {
    console.error('Error assigning subscription:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Update restaurant subscription (change plan, renew, etc.)
 */
export const updateRestaurantSubscription = async (subscriptionId, updates) => {
  try {
    // Fetch plan from DB instead of constant
    const { data: dbPlans } = await getSubscriptionPlans();
    const plan = dbPlans?.find(p => p.key === updates.plan_id);

    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    // Calculate price based on billing cycle and database configuration
    const { data: cycles } = await getBillingCycles();
    const cycle = cycles?.find(c => c.key === updates.billing_cycle);
    if (!cycle) throw new Error('Invalid billing cycle');

    const totalBase = plan.base_price * cycle.duration_months;
    const discountAmount = Math.round(totalBase * (cycle.discount_percentage / 100));
    const price = totalBase - discountAmount;

    const gstAmount = Math.round(price * 0.18);
    const totalAmount = price + gstAmount;

    // Get current subscription for history
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .maybeSingle();

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        plan_name: plan.key,
        billing_cycle: updates.billing_cycle || 'monthly',
        plan_price: price,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        payment_method: updates.payment_method || 'manual',
        status: updates.status || 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select(`
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          is_active
        )
      `)
      .maybeSingle();

    if (error) throw error;

    // Update AI status based on new plan
    await supabase
      .from('restaurants')
      .update({ ai_enabled: plan.ai_features_enabled })
      .eq('id', data.restaurant_id);

    // Log to history
    await supabase
      .from('subscription_history')
      .insert([{
        subscription_id: subscriptionId,
        restaurant_id: data.restaurant_id,
        action: currentSub?.plan_name !== plan.key ? 'upgraded' : 'renewed',
        old_plan: currentSub?.plan_name,
        new_plan: plan.key,
        old_status: currentSub?.status,
        new_status: updates.status || 'active',
        amount_paid: totalAmount,
        notes: updates.notes || 'Subscription updated'
      }]);

    return {
      data: {
        ...data,
        plan: plan
      },
      error: null
    };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Cancel restaurant subscription
 * This will automatically deactivate the restaurant via database trigger
 */
export const cancelRestaurantSubscription = async (subscriptionId, reason = '') => {
  try {
    // Get current subscription
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .maybeSingle();

    // Update subscription status - trigger will deactivate restaurant
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        auto_renew: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select(`
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          is_active
        )
      `)
      .maybeSingle();

    if (error) throw error;

    // Log to history
    await supabase
      .from('subscription_history')
      .insert([{
        subscription_id: subscriptionId,
        restaurant_id: data.restaurant_id,
        action: 'cancelled',
        old_status: currentSub?.status,
        new_status: 'cancelled',
        notes: reason || 'Subscription cancelled by admin'
      }]);

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Reactivate an expired/cancelled subscription
 */
export const reactivateSubscription = async (subscriptionId, durationMonths = 1) => {
  try {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .maybeSingle();

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        end_date: endDate.toISOString(),
        next_payment_date: endDate.toISOString(),
        last_payment_date: new Date().toISOString(),
        cancelled_at: null,
        cancellation_reason: null,
        auto_renew: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select(`
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          is_active
        )
      `)
      .maybeSingle();

    if (error) throw error;

    // Log to history
    await supabase
      .from('subscription_history')
      .insert([{
        subscription_id: subscriptionId,
        restaurant_id: data.restaurant_id,
        action: 'reactivated',
        old_status: currentSub?.status,
        new_status: 'active',
        notes: 'Subscription reactivated'
      }]);

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get subscription statistics
 */
export const getSubscriptionStats = async () => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('status, plan_name, total_amount, billing_cycle');

    if (error) throw error;

    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const gracePeriodSubscriptions = subscriptions.filter(s => s.status === 'grace_period').length;
    const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired').length;
    const cancelledSubscriptions = subscriptions.filter(s => s.status === 'cancelled').length;

    const planCounts = {};
    subscriptions.forEach(s => {
      if (s.status === 'active') {
        planCounts[s.plan_name] = (planCounts[s.plan_name] || 0) + 1;
      }
    });

    const totalRevenue = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.total_amount || 0), 0);

    // Get monthly recurring revenue
    const monthlyRevenue = subscriptions
      .filter(s => s.status === 'active' && s.billing_cycle === 'monthly')
      .reduce((sum, s) => sum + (s.total_amount || 0), 0);

    const yearlyRevenue = subscriptions
      .filter(s => s.status === 'active' && s.billing_cycle === 'yearly')
      .reduce((sum, s) => sum + ((s.total_amount || 0) / 12), 0);

    return {
      data: {
        totalSubscriptions,
        activeSubscriptions,
        gracePeriodSubscriptions,
        expiredSubscriptions,
        cancelledSubscriptions,
        planCounts, // Return full map for flexibility
        starterPlans: planCounts['starter'] || 0,
        professionalPlans: planCounts['professional'] || 0,
        enterprisePlans: planCounts['enterprise'] || 0,
        premiumSubscriptions: (planCounts['professional'] || 0) + (planCounts['enterprise'] || 0),
        totalRevenue,
        monthlyRecurringRevenue: monthlyRevenue + yearlyRevenue,
        cancellationRate: totalSubscriptions > 0 ?
          ((cancelledSubscriptions / totalSubscriptions) * 100).toFixed(2) : 0
      },
      error: null
    };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get subscriptions expiring soon (within X days)
 */
export const getUpcomingRenewals = async (days = 7) => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone
        )
      `)
      .in('status', ['active', 'grace_period'])
      .lte('end_date', futureDate.toISOString())
      .order('end_date', { ascending: true });

    if (error) throw error;

    const enriched = subscriptions.map(sub => ({
      ...sub,
      daysUntilExpiry: Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    return { data: enriched, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get subscription history for a restaurant
 */
export const getSubscriptionHistory = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Process expired subscriptions (call this periodically)
 */
export const processExpiredSubscriptions = async () => {
  try {
    const { data, error } = await supabase.rpc('process_expired_subscriptions');

    if (error) throw error;

    return { data: { processedCount: data }, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};