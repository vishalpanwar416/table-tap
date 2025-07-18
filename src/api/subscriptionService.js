import { supabase } from '../supabase';

// ========= SIMPLIFIED SUBSCRIPTION MANAGEMENT =========
// Using existing restaurants table with ai_enabled field

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
 * Get restaurant subscriptions (using restaurants table)
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
        is_active,
        ai_enabled,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform restaurants into subscription format
    const subscriptions = restaurants.map(restaurant => {
      const plan = restaurant.ai_enabled ? SUBSCRIPTION_PLANS[1] : SUBSCRIPTION_PLANS[0];
      return {
        id: restaurant.id,
        restaurant_id: restaurant.id,
        plan_id: plan.id,
        status: restaurant.is_active ? 'active' : 'inactive',
        payment_status: 'paid', // Assuming all restaurants are paid
        amount_paid: plan.price,
        start_date: restaurant.created_at,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        payment_method: 'manual',
        notes: '',
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          contact_email: restaurant.contact_email,
          contact_phone: restaurant.contact_phone
        },
        plan: plan
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
        is_active,
        ai_enabled,
        created_at,
        updated_at
      `)
      .eq('id', restaurantId)
      .single();

    if (error) throw error;

    const plan = restaurant.ai_enabled ? SUBSCRIPTION_PLANS[1] : SUBSCRIPTION_PLANS[0];
    
    const subscription = {
      id: restaurant.id,
      restaurant_id: restaurant.id,
      plan_id: plan.id,
      status: restaurant.is_active ? 'active' : 'inactive',
      payment_status: 'paid',
      amount_paid: plan.price,
      start_date: restaurant.created_at,
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: 'manual',
      notes: '',
      plan: plan
    };

    return { data: subscription, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Create a new subscription plan (not used in simplified version)
 */
export const createSubscriptionPlan = async (planData) => {
  return { data: null, error: 'Subscription plans are predefined and cannot be created' };
};

/**
 * Update subscription plan (not used in simplified version)
 */
export const updateSubscriptionPlan = async (planId, updates) => {
  return { data: null, error: 'Subscription plans are predefined and cannot be modified' };
};

/**
 * Delete subscription plan (not used in simplified version)
 */
export const deleteSubscriptionPlan = async (planId) => {
  return { error: 'Subscription plans are predefined and cannot be deleted' };
};

/**
 * Assign subscription to restaurant (update restaurant's ai_enabled status)
 */
export const assignSubscriptionToRestaurant = async (subscriptionData) => {
  try {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscriptionData.plan_id);
    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    const { data, error } = await supabase
      .from('restaurants')
      .update({
        ai_enabled: plan.ai_features_enabled,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionData.restaurant_id)
      .select(`
        id,
        name,
        contact_email,
        contact_phone,
        is_active,
        ai_enabled,
        created_at,
        updated_at
      `)
      .single();

    if (error) throw error;

    const subscription = {
      id: data.id,
      restaurant_id: data.id,
      plan_id: plan.id,
      status: 'active',
      payment_status: 'paid',
      amount_paid: plan.price,
      start_date: data.created_at,
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: subscriptionData.payment_method || 'manual',
      notes: subscriptionData.notes || '',
      restaurant: {
        id: data.id,
        name: data.name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone
      },
      plan: plan
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
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === updates.plan_id);
    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    const { data, error } = await supabase
      .from('restaurants')
      .update({
        ai_enabled: plan.ai_features_enabled,
        is_active: updates.status === 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select(`
        id,
        name,
        contact_email,
        contact_phone,
        is_active,
        ai_enabled,
        created_at,
        updated_at
      `)
      .single();

    if (error) throw error;

    const subscription = {
      id: data.id,
      restaurant_id: data.id,
      plan_id: plan.id,
      status: data.is_active ? 'active' : 'inactive',
      payment_status: 'paid',
      amount_paid: plan.price,
      start_date: data.created_at,
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: updates.payment_method || 'manual',
      notes: updates.notes || '',
      restaurant: {
        id: data.id,
        name: data.name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone
      },
      plan: plan
    };

    return { data: subscription, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Cancel restaurant subscription (deactivate restaurant)
 */
export const cancelRestaurantSubscription = async (subscriptionId) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select(`
        id,
        name,
        contact_email,
        contact_phone,
        is_active,
        ai_enabled,
        created_at,
        updated_at
      `)
      .single();

    if (error) throw error;

    const plan = data.ai_enabled ? SUBSCRIPTION_PLANS[1] : SUBSCRIPTION_PLANS[0];
    
    const subscription = {
      id: data.id,
      restaurant_id: data.id,
      plan_id: plan.id,
      status: 'cancelled',
      payment_status: 'paid',
      amount_paid: plan.price,
      start_date: data.created_at,
      end_date: new Date().toISOString(),
      payment_method: 'manual',
      notes: 'Subscription cancelled',
      restaurant: {
        id: data.id,
        name: data.name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone
      },
      plan: plan
    };

    return { data: subscription, error: null };
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
      .select('is_active, ai_enabled');

    if (error) throw error;

    const totalSubscriptions = restaurants.length;
    const activeSubscriptions = restaurants.filter(r => r.is_active).length;
    const basicSubscriptions = restaurants.filter(r => r.is_active && !r.ai_enabled).length;
    const premiumSubscriptions = restaurants.filter(r => r.is_active && r.ai_enabled).length;
    
    const totalRevenue = (basicSubscriptions * SUBSCRIPTION_PLANS[0].price) + 
                        (premiumSubscriptions * SUBSCRIPTION_PLANS[1].price);

    return {
      data: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions: totalSubscriptions - activeSubscriptions,
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
 * Get upcoming renewals (simplified - shows all active restaurants)
 */
export const getUpcomingRenewals = async (days = 30) => {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        contact_email,
        contact_phone,
        is_active,
        ai_enabled,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const renewals = restaurants.map(restaurant => {
      const plan = restaurant.ai_enabled ? SUBSCRIPTION_PLANS[1] : SUBSCRIPTION_PLANS[0];
      return {
        id: restaurant.id,
        restaurant_id: restaurant.id,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          contact_email: restaurant.contact_email
        },
        plan: plan
      };
    });

    return { data: renewals, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}; 