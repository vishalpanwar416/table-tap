import { supabase } from '../../shared/supabase';
import { logAdminActivity, ACTIVITY_TYPES } from './adminActivityLogService';

// ========= SUBSCRIPTION MANAGEMENT WITH DATABASE TABLE =========
// Uses subscriptions table with automatic restaurant status updates

// Master data is now fetched from database tables: subscription_plans and billing_cycles

// Best-effort actor resolution for the admin activity log (never throws / blocks).
const getActor = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { user_id: null, user_name: 'System' };
    return { user_id: user.id, user_name: user.email || 'Admin' };
  } catch {
    return { user_id: null, user_name: 'System' };
  }
};

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
    if (!data) throw new Error('Creation failed - no data returned. Check admin permissions.');

    return { data, error: null };
  } catch (error) {
    console.error('Create Plan Error:', error);
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
    if (!data)
      throw new Error(
        'Update failed - no data returned. Check admin permissions or if plan exists.',
      );

    return { data, error: null };
  } catch (error) {
    console.error('Update Plan Error:', error);
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
 * Get restaurant subscriptions with pagination
 */
export const getPaginatedSubscriptions = async (page = 1, pageSize = 20, status = 'all') => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('subscriptions').select(
      `
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          logo_url,
          is_active
        )
      `,
      { count: 'exact' },
    );

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data || [], totalCount: count || 0, error: null };
  } catch (error) {
    console.error('Error fetching paginated subscriptions:', error);
    return { data: [], totalCount: 0, error: error.message };
  }
};

/**
 * Get the restaurant IDs that currently hold an active or grace-period
 * subscription. Used to compute which restaurants are still assignable.
 * Returns a full (non-paginated) list of ids only, so availability is correct
 * even when there are more subscriptions than fit on one paginated page.
 */
export const getActiveSubscriptionRestaurantIds = async () => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('restaurant_id')
      .in('status', ['active', 'grace_period']);

    if (error) throw error;
    return { data: (data || []).map((s) => s.restaurant_id), error: null };
  } catch (error) {
    console.error('Error fetching active subscription restaurant ids:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Get all restaurant subscriptions from the subscriptions table.
 * @deprecated Use getPaginatedSubscriptions instead.
 */
export const getRestaurantSubscriptions = async () => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          logo_url,
          is_active
        )
      `,
      )
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
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          logo_url,
          is_active
        )
      `,
      )
      .eq('restaurant_id', restaurantId)
      .in('status', ['active', 'grace_period'])
      .maybeSingle();

    if (error) throw error;

    if (subscription) {
      return {
        data: subscription,
        error: null,
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
    const plan = dbPlans?.find((p) => p.key === subscriptionData.plan_id);

    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    // Calculate end date based on billing cycle
    const { data: cycles } = await getBillingCycles();
    const cycle = cycles?.find((c) => c.key === subscriptionData.billing_cycle);
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
      throw new Error(
        'Restaurant already has an active subscription. Please cancel or expire it first.',
      );
    }

    // Create subscription - the database trigger will activate the restaurant
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([
        {
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
          grace_period_days: 7,
        },
      ])
      .select(
        `
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          is_active
        )
      `,
      )
      .maybeSingle();

    if (error) throw error;

    // Also update AI status based on plan
    if (plan.ai_features_enabled) {
      await supabase
        .from('restaurants')
        .update({ ai_enabled: true })
        .eq('id', subscriptionData.restaurant_id);
    }

    // Log to subscription history (non-fatal: subscription is already created)
    const { error: historyError } = await supabase.from('subscription_history').insert([
      {
        subscription_id: data.id,
        restaurant_id: subscriptionData.restaurant_id,
        action: 'created',
        new_plan: plan.key,
        new_status: 'active',
        amount_paid: totalAmount,
        gst_amount: gstAmount,
        notes: subscriptionData.notes || 'Subscription created',
      },
    ]);
    if (historyError) {
      console.error('subscription_history insert failed (audit trail missing):', historyError);
    }

    // Surface in the admin Activity Logs (non-fatal).
    const actor = await getActor();
    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.SUBSCRIPTION_CREATED,
      activity_name: 'Subscription assigned',
      restaurant_id: data.restaurant_id,
      user_id: actor.user_id,
      user_name: actor.user_name,
      target_type: 'subscription',
      target_id: data.id,
      target_name: data.restaurant?.name || null,
      status: 'success',
      details: {
        plan: plan.key,
        billing_cycle: subscriptionData.billing_cycle || 'monthly',
        total_amount: totalAmount,
      },
      description: `Assigned ${plan.name || plan.key} plan to ${data.restaurant?.name || 'restaurant'}`,
    });

    return {
      data: {
        ...data,
        plan: plan,
      },
      error: null,
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
    const plan = dbPlans?.find((p) => p.key === updates.plan_id);

    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    // Calculate price based on billing cycle and database configuration
    const { data: cycles } = await getBillingCycles();
    const cycle = cycles?.find((c) => c.key === updates.billing_cycle);
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select(
        `
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          is_active
        )
      `,
      )
      .maybeSingle();

    if (error) throw error;

    // Update AI status based on new plan
    await supabase
      .from('restaurants')
      .update({ ai_enabled: plan.ai_features_enabled })
      .eq('id', data.restaurant_id);

    // Log to history
    await supabase.from('subscription_history').insert([
      {
        subscription_id: subscriptionId,
        restaurant_id: data.restaurant_id,
        action: currentSub?.plan_name !== plan.key ? 'upgraded' : 'renewed',
        old_plan: currentSub?.plan_name,
        new_plan: plan.key,
        old_status: currentSub?.status,
        new_status: updates.status || 'active',
        amount_paid: totalAmount,
        gst_amount: gstAmount,
        notes: updates.notes || 'Subscription updated',
      },
    ]);

    const actor = await getActor();
    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.SUBSCRIPTION_RENEWED,
      activity_name: 'Subscription updated',
      restaurant_id: data.restaurant_id,
      user_id: actor.user_id,
      user_name: actor.user_name,
      target_type: 'subscription',
      target_id: subscriptionId,
      target_name: data.restaurant?.name || null,
      status: 'success',
      details: {
        old_plan: currentSub?.plan_name || null,
        new_plan: plan.key,
        billing_cycle: updates.billing_cycle || 'monthly',
        total_amount: totalAmount,
      },
      description: `Updated subscription for ${data.restaurant?.name || 'restaurant'} to ${plan.name || plan.key} plan`,
    });

    return {
      data: {
        ...data,
        plan: plan,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Cancel restaurant subscription
 * NOTE: This only updates subscription status - restaurant stays active but hidden from customers
 * When user re-subscribes, the restaurant automatically becomes visible again
 */
export const cancelRestaurantSubscription = async (subscriptionId, reason = '') => {
  try {
    // Get current subscription
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .maybeSingle();

    // Update subscription status only - DO NOT deactivate restaurant
    // Restaurant visibility in customer app is controlled by subscription status
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select(
        `
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          is_active
        )
      `,
      )
      .maybeSingle();

    if (error) throw error;

    // Log to history
    await supabase.from('subscription_history').insert([
      {
        subscription_id: subscriptionId,
        restaurant_id: data.restaurant_id,
        action: 'cancelled',
        old_status: currentSub?.status,
        new_status: 'cancelled',
        notes: reason || 'Subscription cancelled by admin',
      },
    ]);

    const actor = await getActor();
    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.SUBSCRIPTION_CANCELLED,
      activity_name: 'Subscription cancelled',
      restaurant_id: data.restaurant_id,
      user_id: actor.user_id,
      user_name: actor.user_name,
      target_type: 'subscription',
      target_id: subscriptionId,
      target_name: data.restaurant?.name || null,
      status: 'success',
      details: { reason: reason || null, old_status: currentSub?.status || null },
      description: `Cancelled subscription for ${data.restaurant?.name || 'restaurant'}${reason ? ` (${reason})` : ''}`,
    });

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
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select(
        `
        *,
        restaurant:restaurants (
          id,
          name,
          contact_email,
          contact_phone,
          is_active
        )
      `,
      )
      .maybeSingle();

    if (error) throw error;

    // Log to history
    await supabase.from('subscription_history').insert([
      {
        subscription_id: subscriptionId,
        restaurant_id: data.restaurant_id,
        action: 'reactivated',
        old_status: currentSub?.status,
        new_status: 'active',
        notes: 'Subscription reactivated',
      },
    ]);

    const actor = await getActor();
    await logAdminActivity({
      activity_type: ACTIVITY_TYPES.SUBSCRIPTION_RENEWED,
      activity_name: 'Subscription reactivated',
      restaurant_id: data.restaurant_id,
      user_id: actor.user_id,
      user_name: actor.user_name,
      target_type: 'subscription',
      target_id: subscriptionId,
      target_name: data.restaurant?.name || null,
      status: 'success',
      details: { old_status: currentSub?.status || null, duration_months: durationMonths },
      description: `Reactivated subscription for ${data.restaurant?.name || 'restaurant'}`,
    });

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Get subscription statistics (Optimized with DB counts)
 */
export const getSubscriptionStats = async () => {
  try {
    // 1. Get counts for each status using head queries (very fast)
    const [
      { count: totalSubscriptions },
      { count: activeSubscriptions },
      { count: gracePeriodSubscriptions },
      { count: expiredSubscriptions },
      { count: cancelledSubscriptions },
    ] = await Promise.all([
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'grace_period'),
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'expired'),
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled'),
    ]);

    // 2. Get counts for each plan (only for active subscriptions)
    const { data: plansData } = await supabase
      .from('subscriptions')
      .select('plan_name')
      .eq('status', 'active');

    const planCounts = {};
    (plansData || []).forEach((s) => {
      planCounts[s.plan_name] = (planCounts[s.plan_name] || 0) + 1;
    });

    // 3. Get revenue (only for active subscriptions)
    // Note: In a real large scale app, you'd use a RPC or specialized view for this.
    // For now, we'll fetch the sum of active subscriptions.
    const { data: revenueData } = await supabase
      .from('subscriptions')
      .select('total_amount, billing_cycle')
      .eq('status', 'active');

    const totalRevenue = (revenueData || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);

    // MRR Calculation
    const mrr = (revenueData || []).reduce((sum, s) => {
      if (s.billing_cycle === 'monthly') return sum + (s.total_amount || 0);
      if (s.billing_cycle === 'yearly') return sum + (s.total_amount || 0) / 12;
      return sum;
    }, 0);

    return {
      data: {
        totalSubscriptions,
        activeSubscriptions,
        gracePeriodSubscriptions,
        expiredSubscriptions,
        cancelledSubscriptions,
        planCounts,
        starterPlans: planCounts['starter'] || 0,
        professionalPlans: planCounts['professional'] || 0,
        enterprisePlans: planCounts['enterprise'] || 0,
        premiumSubscriptions: (planCounts['professional'] || 0) + (planCounts['enterprise'] || 0),
        totalRevenue,
        monthlyRecurringRevenue: mrr,
        cancellationRate:
          totalSubscriptions > 0
            ? ((cancelledSubscriptions / totalSubscriptions) * 100).toFixed(2)
            : 0,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Get subscriptions expiring soon (within X days)
 */
export const getUpcomingRenewals = async (days = 30) => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .in('status', ['active', 'grace_period'])
      .lte('end_date', futureDate.toISOString())
      .order('end_date', { ascending: true });

    if (error) throw error;

    // Fetch restaurant details separately to avoid join RLS issues
    const restaurantIds = [...new Set(subscriptions.map((s) => s.restaurant_id).filter(Boolean))];
    let restaurantMap = {};
    if (restaurantIds.length > 0) {
      const { data: restaurantRows } = await supabase
        .from('restaurants')
        .select('id, name, contact_email, contact_phone, logo_url')
        .in('id', restaurantIds);
      (restaurantRows || []).forEach((r) => {
        restaurantMap[r.id] = r;
      });
    }

    const enriched = subscriptions.map((sub) => ({
      ...sub,
      restaurant: restaurantMap[sub.restaurant_id] || null,
      daysUntilExpiry: Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24)),
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
 * NOTE: This only updates subscription status to 'expired' - does NOT deactivate restaurants
 * Restaurants stay active but are hidden from customer app based on subscription status
 * When user re-subscribes, the restaurant automatically becomes visible again
 */
export const processExpiredSubscriptions = async () => {
  try {
    const now = new Date().toISOString();

    // Find all active/grace_period subscriptions that have passed their end date
    const { data: expiredSubs, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, restaurant_id, status, end_date')
      .in('status', ['active', 'grace_period'])
      .lt('end_date', now);

    if (fetchError) throw fetchError;

    if (!expiredSubs || expiredSubs.length === 0) {
      return { data: { processedCount: 0 }, error: null };
    }

    // Update each expired subscription - only change subscription status, NOT restaurant
    let processedCount = 0;
    const actor = await getActor();
    for (const sub of expiredSubs) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: now,
        })
        .eq('id', sub.id);

      if (!updateError) {
        // Log to history
        await supabase.from('subscription_history').insert([
          {
            subscription_id: sub.id,
            restaurant_id: sub.restaurant_id,
            action: 'expired',
            old_status: sub.status,
            new_status: 'expired',
            notes: 'Subscription expired - restaurant hidden from customers until renewed',
          },
        ]);
        await logAdminActivity({
          activity_type: ACTIVITY_TYPES.SUBSCRIPTION_EXPIRED,
          activity_name: 'Subscription expired',
          restaurant_id: sub.restaurant_id,
          user_id: actor.user_id,
          user_name: actor.user_name,
          target_type: 'subscription',
          target_id: sub.id,
          status: 'success',
          details: { old_status: sub.status, end_date: sub.end_date },
          description: 'Subscription expired — restaurant hidden from customers until renewed',
        });
        processedCount++;
      }
    }

    return { data: { processedCount }, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};
