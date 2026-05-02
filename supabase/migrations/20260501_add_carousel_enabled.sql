-- Add carousel_enabled flag to restaurants table
-- When false, the offer carousel is hidden on the customer homepage for this restaurant.
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS carousel_enabled BOOLEAN NOT NULL DEFAULT true;
