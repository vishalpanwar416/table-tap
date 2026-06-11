import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';
import { razorpayFrequency } from './razorpay.ts';

export type PlanPricing = {
  planKey: string;
  planName: string;
  billingCycle: string;
  months: number;
  amountPaise: number;
  gstPaise: number;
  totalPaise: number;
  amount: number;
  gst: number;
  total: number;
};

export async function loadPlanPricing(
  adminClient: SupabaseClient,
  planKey: string,
  billingCycleKey: string,
): Promise<PlanPricing> {
  const [{ data: plan, error: planError }, { data: cycle, error: cycleError }] = await Promise.all([
    adminClient.from('subscription_plans').select('*').eq('key', planKey).eq('is_active', true).single(),
    adminClient.from('billing_cycles').select('*').eq('key', billingCycleKey).eq('is_active', true).single(),
  ]);

  if (planError || !plan) throw new Error(`Plan not found: ${planKey}`);
  if (cycleError || !cycle) throw new Error(`Billing cycle not found: ${billingCycleKey}`);

  const basePrice = Number(plan.base_price ?? 0);
  const months = Number(cycle.duration_months ?? 1);
  const discount = Number(cycle.discount_percentage ?? 0);
  const totalBase = basePrice * months;
  const discountAmount = Math.round(totalBase * (discount / 100));
  const amount = totalBase - discountAmount;
  const gst = Math.round(amount * 0.18);
  const total = amount + gst;

  return {
    planKey,
    planName: plan.name ?? planKey,
    billingCycle: billingCycleKey,
    months,
    amount,
    gst,
    total,
    amountPaise: amount * 100,
    gstPaise: gst * 100,
    totalPaise: total * 100,
  };
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export type ApplyPaymentInput = {
  restaurantId: string;
  subscriptionId?: string | null;
  planKey: string;
  billingCycle: string;
  pricing: PlanPricing;
  paymentMethod: string;
  paymentId: string;
  enableAutopay: boolean;
  customerId?: string | null;
  tokenId?: string | null;
  isRenewal: boolean;
  checkoutType: 'initial' | 'renewal' | 'recurring_charge';
  orderId: string;
};

export async function applySuccessfulSubscriptionPayment(
  adminClient: SupabaseClient,
  input: ApplyPaymentInput,
) {
  const now = new Date();
  const endDate = addMonths(now, input.pricing.months);

  const autopayStatus = input.enableAutopay
    ? input.tokenId
      ? 'active'
      : 'pending'
    : 'none';

  const subPayload: Record<string, unknown> = {
    restaurant_id: input.restaurantId,
    plan_name: input.planKey,
    billing_cycle: input.billingCycle,
    status: 'active',
    plan_price: input.pricing.amount,
    gst_amount: input.pricing.gst,
    total_amount: input.pricing.total,
    start_date: now.toISOString(),
    end_date: endDate.toISOString(),
    next_payment_date: endDate.toISOString(),
    last_payment_date: now.toISOString(),
    payment_method: input.paymentMethod,
    auto_renew: input.enableAutopay,
    autopay_method: input.enableAutopay ? input.paymentMethod.replace('razorpay_', '') : null,
    razorpay_customer_id: input.customerId ?? null,
    razorpay_token_id: input.tokenId ?? null,
    autopay_status: autopayStatus,
    mandate_max_amount_paise: input.enableAutopay ? input.pricing.totalPaise * 2 : null,
    last_charge_error: null,
    pending_renewal_order_id: null,
    grace_period_days: 7,
    updated_at: now.toISOString(),
  };

  let subscriptionId = input.subscriptionId ?? null;

  if (subscriptionId) {
    const { data, error } = await adminClient
      .from('subscriptions')
      .update(subPayload)
      .eq('id', subscriptionId)
      .select('id')
      .single();
    if (error) throw error;
    subscriptionId = data.id;
  } else {
    const { data, error } = await adminClient
      .from('subscriptions')
      .insert([subPayload])
      .select('id')
      .single();
    if (error) throw error;
    subscriptionId = data.id;
  }

  await adminClient
    .from('subscription_payment_orders')
    .update({
      status: 'completed',
      razorpay_payment_id: input.paymentId,
      subscription_id: subscriptionId,
      completed_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', input.orderId);

  const historyAction = input.isRenewal ? 'renewed' : 'created';
  await adminClient.from('subscription_history').insert([
    {
      subscription_id: subscriptionId,
      restaurant_id: input.restaurantId,
      action: historyAction,
      old_plan: input.isRenewal ? input.planKey : null,
      new_plan: input.planKey,
      old_status: input.isRenewal ? 'active' : null,
      new_status: 'active',
      amount_paid: input.pricing.total,
      gst_amount: input.pricing.gst,
      payment_reference: input.paymentId,
      notes: `${input.isRenewal ? 'Renewed' : 'Activated'} ${input.planKey} (${input.billingCycle})${
        input.enableAutopay ? ' with autopay mandate' : ''
      } [${input.checkoutType}]`,
    },
  ]);

  return { subscriptionId };
}

export async function requireRestaurantManager(
  req: Request,
  restaurantId: string,
): Promise<{ userId: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Unauthorized');

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: allowed, error } = await userClient.rpc('can_manage_restaurant', {
    rid: restaurantId,
  });
  if (error || !allowed) throw new Error('NOT_AUTHORIZED');

  return { userId: user.id };
}

export function buildMandateTokenConfig(
  billingCycle: string,
  totalPaise: number,
): Record<string, unknown> {
  const expireAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10;
  return {
    max_amount: Math.max(totalPaise * 2, 10000),
    expire_at: expireAt,
    frequency: razorpayFrequency(billingCycle),
  };
}
