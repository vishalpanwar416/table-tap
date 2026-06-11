-- Platform admin can enable/disable Razorpay subscription autopay per restaurant.

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS enable_subscription_autopay BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.restaurants.enable_subscription_autopay IS
  'When false, restaurant cannot enable autopay mandates or receive automatic renewal charges.';
