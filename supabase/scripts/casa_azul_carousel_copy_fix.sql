-- Shorter carousel copy for Casa Azul (fits mobile slider)

UPDATE public.fooditems SET
  description = 'Family platter for 4 — tacos, burrito & sides.',
  updated_at = NOW()
WHERE id = '4164cfbb-94a6-402a-95f1-1c48293fd5d0';

UPDATE public.fooditems SET
  description = '10% off any taco platter every Tuesday.',
  updated_at = NOW()
WHERE id = '9cf61024-22e2-4d11-a242-6a987797cbad';

UPDATE public.fooditems SET
  description = 'Loaded nachos + quesadilla — great for two.',
  updated_at = NOW()
WHERE id = '6fe4357e-113c-4f36-aa28-12236cc88823';
