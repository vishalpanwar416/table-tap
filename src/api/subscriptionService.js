import { supabase } from '../supabase';

// ========= SUBSCRIPTION MANAGEMENT USING EXISTING TABLES =========

// Define the two subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic Plan',
    description: 'Standard restaurant management without AI features',
    price: 1999,
    duration_months: 1,
    features: ['Order Management', 'Staff Management', 'Menu Management', 'Basic Analytics'],
    max_orders_per_month: 1000,
    max_staff_members: 10,
    ai_features_enabled: false,
    is_active: true
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    description: 'Advanced restaurant management with AI analytics',
    price: 2599,
    duration_months: 1,
    features: ['Order Management', 'Staff Management', 'Menu Management', 'AI Analytics', 'Smart Recommendations', 'Predictive Insights'],
    max_orders_per_month: 5000,
    max_staff_members: 25,
    ai_features_enabled: true,
    is_active: true
  }
];

/**
 * Get all subscription plans (hardcoded)
 */
export const getSubscriptionPlans = async () => {
  try {
    return { data: SUBSCRIPTION_PLANS, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get restaurant subscriptions using existing tables
 */
export const getRestaurantSubscriptions = async () => {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        contact_email,
        contact_phone,
        ai_enabled,
        subscription_plan,
        subscription_start_date,
        subscription_end_date,
        subscription_status,
        subscription_amount_paid,
        subscription_payment_method,
        subscription_notes,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match subscription format
    const subscriptions = restaurants.map(restaurant => {
      const plan = restaurant.subscription_plan === 'premium' ? SUBSCRIPTION_PLANS[1] : SUBSCRIPTION_PLANS[0];
      
      return {
        id: restaurant.id,
        restaurant_id: restaurant.id,
        plan_id: restaurant.subscription_plan || 'basic',
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          contact_email: restaurant.contact_email,
          contact_phone: restaurant.contact_phone
        },
        plan: plan,
        start_date: restaurant.subscription_start_date,
        end_date: restaurant.subscription_end_date,
        status: restaurant.subscription_status || 'inactive',
        payment_status: restaurant.subscription_amount_paid ? 'paid' : 'pending',
        amount_paid: restaurant.subscription_amount_paid || 0,
        payment_method: restaurant.subscription_payment_method || 'online',
        notes: restaurant.subscription_notes,
        created_at: restaurant.created_at,
        updated_at: restaurant.updated_at
      };
    });

    return { data: subscriptions, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get subscription by restaurant ID
 */
export const getRestaurantSubscription = async (restaurantId) => {
  try {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        contact_email,
        contact_phone,
        ai_enabled,
        subscription_plan,
        subscription_start_date,
        subscription_end_date,
        subscription_status,
        subscription_amount_paid,
        subscription_payment_method,
        subscription_notes
      `)
      .eq('id', restaurantId)
      .single();

    if (error) throw error;

    const plan = restaurant.subscription_plan === 'premium' ? SUBSCRIPTION_PLANS[1] : SUBSCRIPTION_PLANS[0];
    
    const subscription = {
      id: restaurant.id,
      restaurant_id: restaurant.id,
      plan_id: restaurant.subscription_plan || 'basic',
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        contact_email: restaurant.contact_email,
        contact_phone: restaurant.contact_phone
      },
      plan: plan,
      start_date: restaurant.subscription_start_date,
      end_date: restaurant.subscription_end_date,
      status: restaurant.subscription_status || 'inactive',
      payment_status: restaurant.subscription_amount_paid ? 'paid' : 'pending',
      amount_paid: restaurant.subscription_amount_paid || 0,
      payment_method: restaurant.subscription_payment_method || 'online',
      notes: restaurant.subscription_notes
    };

    return { data: subscription, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Create a new subscription plan (not used with hardcoded plans)
 */
export const createSubscriptionPlan = async (planData) => {
  try {
    return { data: null, error: 'Subscription plans are predefined and cannot be created' };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Update subscription plan (not used with hardcoded plans)
 */
export const updateSubscriptionPlan = async (planId, updates) => {
  try {
    return { data: null, error: 'Subscription plans are predefined and cannot be modified' };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Delete subscription plan (not used with hardcoded plans)
 */
export const deleteSubscriptionPlan = async (planId) => {
  try {
    return { error: 'Subscription plans are predefined and cannot be deleted' };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Assign subscription to restaurant
 */
export const assignSubscriptionToRestaurant = async (subscriptionData) => {
  try {
    const plan = subscriptionData.plan_id === 'premium' ? SUBSCRIPTION_PLANS[1] : SUBSCRIPTION_PLANS[0];
    
    const { data, error } = await supabase
      .from('restaurants')
      .update({
        subscription_plan: subscriptionData.plan_id,
        subscription_start_date: subscriptionData.start_date,
        subscription_end_date: subscriptionData.end_date,
        subscription_status: subscriptionData.status || 'active',
        subscription_amount_paid: subscriptionData.amount_paid,
        subscription_payment_method: subscriptionData.payment_method,
        subscription_notes: subscriptionData.notes,
        ai_enabled: plan.ai_features_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionData.restaurant_id)
      .select()
      .single();

    if (error) throw error;

    const subscription = {
      id: data.id,
      restaurant_id: data.id,
      plan_id: data.subscription_plan,
      restaurant: {
        id: data.id,
        name: data.name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone
      },
      plan: plan,
      start_date: data.subscription_start_date,
      end_date: data.subscription_end_date,
      status: data.subscription_status,
      payment_status: data.subscription_amount_paid ? 'paid' : 'pending',
      amount_paid: data.subscription_amount_paid,
      payment_method: data.subscription_payment_method,
      notes: data.subscription_notes
    };

    return { data: subscription, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Update restaurant subscription
 */
export const updateRestaurantSubscription = async (subscriptionId, updates) => {
  try {
    const plan = updates.plan_id === 'premium' ? SUBSCRIPTION_PLANS[1] : SUBSCRIPTION_PLANS[0];
    
    const { data, error } = await supabase
      .from('restaurants')
      .update({
        subscription_plan: updates.plan_id,
        subscription_start_date: updates.start_date,
        subscription_end_date: updates.end_date,
        subscription_status: updates.status,
        subscription_amount_paid: updates.amount_paid,
        subscription_payment_method: updates.payment_method,
        subscription_notes: updates.notes,
        ai_enabled: plan.ai_features_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;

    const subscription = {
      id: data.id,
      restaurant_id: data.id,
      plan_id: data.subscription_plan,
      restaurant: {
        id: data.id,
        name: data.name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone
      },
      plan: plan,
      start_date: data.subscription_start_date,
      end_date: data.subscription_end_date,
      status: data.subscription_status,
      payment_status: data.subscription_amount_paid ? 'paid' : 'pending',
      amount_paid: data.subscription_amount_paid,
      payment_method: data.subscription_payment_method,
      notes: data.subscription_notes
    };

    return { data: subscription, error: null };
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
      .from('restaurants')
      .update({
        subscription_status: 'cancelled',
        ai_enabled: false,
        updated_at: new Date().toISOString()
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
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('subscription_plan, subscription_status, subscription_amount_paid, subscription_end_date');

    if (error) throw error;

    const totalSubscriptions = restaurants.filter(r => r.subscription_plan).length;
    const activeSubscriptions = restaurants.filter(r => r.subscription_status === 'active').length;
    const expiredSubscriptions = restaurants.filter(r => 
      r.subscription_end_date && new Date(r.subscription_end_date) < new Date() && r.subscription_status === 'active'
    ).length;

    const totalRevenue = restaurants
      .filter(r => r.subscription_amount_paid)
      .reduce((sum, r) => sum + (r.subscription_amount_paid || 0), 0);

    const basicSubscriptions = restaurants.filter(r => r.subscription_plan === 'basic').length;
    const premiumSubscriptions = restaurants.filter(r => r.subscription_plan === 'premium').length;

    return {
      data: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        totalRevenue,
        basicSubscriptions,
        premiumSubscriptions,
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

    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        contact_email,
        subscription_plan,
        subscription_end_date
      `)
      .eq('subscription_status', 'active')
      .lte('subscription_end_date', futureDate.toISOString())
      .gte('subscription_end_date', new Date().toISOString())
      .order('subscription_end_date', { ascending: true });

    if (error) throw error;

    const renewals = restaurants.map(restaurant => {
      const plan = restaurant.subscription_plan === 'premium' ? SUBSCRIPTION_PLANS[1] : SUBSCRIPTION_PLANS[0];
      
      return {
        id: restaurant.id,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          contact_email: restaurant.contact_email
        },
        plan: plan,
        end_date: restaurant.subscription_end_date
      };
    });

    return { data: renewals, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}; 