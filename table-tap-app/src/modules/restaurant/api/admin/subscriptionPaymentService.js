import { supabase } from '../../../shared/supabase';

// Invoke an edge function while explicitly forwarding the signed-in user's
// access token. Relying on the SDK to read the token from storage is unreliable
// on production (session is kept in a cookie), which can cause the function to
// receive only the anon key → getUser() returns null → 401 Unauthorized.
async function invokeFunction(name, body) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Your session has expired. Please sign in again and retry.');
  }

  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    // supabase-js wraps non-2xx responses; the real reason lives in the body.
    let message = error.message;
    try {
      const parsed = await error.context?.json?.();
      if (parsed?.error) message = parsed.error;
    } catch {
      /* response body wasn't JSON — keep the generic message */
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function createSubscriptionCheckout({
  restaurantId,
  planKey,
  billingCycle,
  paymentMethod,
  enableAutopay,
  subscriptionId,
}) {
  return invokeFunction('create-subscription-checkout', {
    restaurant_id: restaurantId,
    plan_key: planKey,
    billing_cycle: billingCycle,
    payment_method: paymentMethod,
    enable_autopay: enableAutopay,
    subscription_id: subscriptionId,
  });
}

export async function completeSubscriptionPayment({
  restaurantId,
  orderId,
  paymentId,
  signature,
  subscriptionId,
}) {
  return invokeFunction('complete-subscription-payment', {
    restaurant_id: restaurantId,
    order_id: orderId,
    payment_id: paymentId,
    signature,
    subscription_id: subscriptionId,
  });
}

export async function cancelSubscriptionAutopay({ restaurantId, subscriptionId }) {
  return invokeFunction('cancel-subscription-autopay', {
    restaurant_id: restaurantId,
    subscription_id: subscriptionId,
  });
}

export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Razorpay));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
