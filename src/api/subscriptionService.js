import { supabase } from '../supabase';

// ========= SUBSCRIPTION MANAGEMENT =========

/**
 * Get all subscription plans
 */
export const getSubscriptionPlans = async () => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get restaurant subscriptions
 */
export const getRestaurantSubscriptions = async () => {
  try {
    const { data, error } = await supabase
      .from('restaurant_subscriptions')
      .select(`
        *,
        restaurant:restaurants(
          id,
          name,
          contact_email,
          contact_phone
        ),
        plan:subscription_plans(
          id,
          name,
          price,
          duration_months,
          features
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get subscription by restaurant ID
 */
export const getRestaurantSubscription = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_subscriptions')
      .select(`
        *,
        plan:subscription_plans(
          id,
          name,
          price,
          duration_months,
          features,
          max_orders_per_month,
          max_staff_members,
          ai_features_enabled
        )
      `)
      .eq('restaurant_id', restaurantId)
      .single();

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
      .insert({
        name: planData.name,
        description: planData.description,
        price: planData.price,
        duration_months: planData.duration_months,
        features: planData.features,
        max_orders_per_month: planData.max_orders_per_month,
        max_staff_members: planData.max_staff_members,
        ai_features_enabled: planData.ai_features_enabled,
        is_active: planData.is_active ?? true
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Update subscription plan
 */
export const updateSubscriptionPlan = async (planId, updates) => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Delete subscription plan
 */
export const deleteSubscriptionPlan = async (planId) => {
  try {
    // Check if plan is being used by any restaurant
    const { data: activeSubscriptions, error: checkError } = await supabase
      .from('restaurant_subscriptions')
      .select('id')
      .eq('plan_id', planId)
      .eq('status', 'active');

    if (checkError) throw checkError;

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      throw new Error('Cannot delete plan: It is currently active for some restaurants');
    }

    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Assign subscription to restaurant
 */
export const assignSubscriptionToRestaurant = async (subscriptionData) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_subscriptions')
      .insert({
        restaurant_id: subscriptionData.restaurant_id,
        plan_id: subscriptionData.plan_id,
        start_date: subscriptionData.start_date,
        end_date: subscriptionData.end_date,
        status: subscriptionData.status || 'active',
        payment_status: subscriptionData.payment_status || 'pending',
        amount_paid: subscriptionData.amount_paid,
        payment_method: subscriptionData.payment_method,
        notes: subscriptionData.notes
      })
      .select(`
        *,
        restaurant:restaurants(name),
        plan:subscription_plans(name, price)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Update restaurant subscription
 */
export const updateRestaurantSubscription = async (subscriptionId, updates) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select(`
        *,
        restaurant:restaurants(name),
        plan:subscription_plans(name, price)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Cancel restaurant subscription
 */
export const cancelRestaurantSubscription = async (subscriptionId) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;
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
    // Get total subscriptions
    const { count: totalSubscriptions, error: totalError } = await supabase
      .from('restaurant_subscriptions')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get active subscriptions
    const { count: activeSubscriptions, error: activeError } = await supabase
      .from('restaurant_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) throw activeError;

    // Get expired subscriptions
    const { count: expiredSubscriptions, error: expiredError } = await supabase
      .from('restaurant_subscriptions')
      .select('*', { count: 'exact', head: true })
      .lt('end_date', new Date().toISOString())
      .eq('status', 'active');

    if (expiredError) throw expiredError;

    // Get total revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from('restaurant_subscriptions')
      .select('amount_paid')
      .eq('payment_status', 'paid');

    if (revenueError) throw revenueError;

    const totalRevenue = revenueData.reduce((sum, sub) => sum + (sub.amount_paid || 0), 0);

    return {
      data: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        totalRevenue,
        cancellationRate: totalSubscriptions > 0 ? 
          ((totalSubscriptions - activeSubscriptions) / totalSubscriptions * 100).toFixed(2) : 0
      },
      error: null
    };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get upcoming renewals
 */
export const getUpcomingRenewals = async (days = 30) => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('restaurant_subscriptions')
      .select(`
        *,
        restaurant:restaurants(name, contact_email),
        plan:subscription_plans(name, price)
      `)
      .eq('status', 'active')
      .lte('end_date', futureDate.toISOString())
      .gte('end_date', new Date().toISOString())
      .order('end_date', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}; 