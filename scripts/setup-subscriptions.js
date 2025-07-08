// Setup script for subscription management
// Run this after setting up the database schema

import { supabase } from '../src/supabase.js';

const setupSubscriptions = async () => {
  try {
    console.log('Setting up subscription management...');

    // Check if default plans already exist
    const { data: existingPlans } = await supabase
      .from('subscription_plans')
      .select('id')
      .limit(1);

    if (existingPlans && existingPlans.length > 0) {
      console.log('Default plans already exist. Skipping setup.');
      return;
    }

    // Insert default subscription plans
    const defaultPlans = [
      {
        name: 'Basic Plan',
        description: 'Perfect for small restaurants just getting started',
        price: 999.00,
        duration_months: 1,
        features: ['QR Code Menu', 'Basic Analytics', 'Order Management'],
        max_orders_per_month: 500,
        max_staff_members: 3,
        ai_features_enabled: false,
        is_active: true
      },
      {
        name: 'Professional Plan',
        description: 'Ideal for growing restaurants with moderate traffic',
        price: 1999.00,
        duration_months: 1,
        features: ['QR Code Menu', 'Advanced Analytics', 'Order Management', 'Staff Management', 'Inventory Tracking'],
        max_orders_per_month: 2000,
        max_staff_members: 8,
        ai_features_enabled: false,
        is_active: true
      },
      {
        name: 'Premium Plan',
        description: 'Complete solution for established restaurants',
        price: 3999.00,
        duration_months: 1,
        features: ['QR Code Menu', 'Advanced Analytics', 'Order Management', 'Staff Management', 'Inventory Tracking', 'AI Recommendations', 'Customer Insights'],
        max_orders_per_month: 5000,
        max_staff_members: 15,
        ai_features_enabled: true,
        is_active: true
      },
      {
        name: 'Enterprise Plan',
        description: 'For large restaurant chains and franchises',
        price: 7999.00,
        duration_months: 1,
        features: ['QR Code Menu', 'Advanced Analytics', 'Order Management', 'Staff Management', 'Inventory Tracking', 'AI Recommendations', 'Customer Insights', 'Multi-location Support', 'Custom Branding'],
        max_orders_per_month: 10000,
        max_staff_members: 50,
        ai_features_enabled: true,
        is_active: true
      }
    ];

    const { data, error } = await supabase
      .from('subscription_plans')
      .insert(defaultPlans);

    if (error) {
      throw error;
    }

    console.log('✅ Default subscription plans created successfully!');
    console.log('📋 Created plans:', data.map(plan => plan.name).join(', '));
    console.log('🚀 Subscription management is ready to use!');

  } catch (error) {
    console.error('❌ Error setting up subscriptions:', error);
  }
};

// Run setup if this file is executed directly
if (typeof window === 'undefined') {
  setupSubscriptions();
}

export default setupSubscriptions; 