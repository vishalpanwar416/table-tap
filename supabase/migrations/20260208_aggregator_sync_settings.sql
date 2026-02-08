-- Add aggregator setting columns to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS surge_prep_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS aggregator_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS swiggy_api_key TEXT,
ADD COLUMN IF NOT EXISTS zomato_api_key TEXT,
ADD COLUMN IF NOT EXISTS swiggy_status TEXT DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS zomato_status TEXT DEFAULT 'offline';


-- Add aggregator sync columns to food_items table
ALTER TABLE public.food_items 
ADD COLUMN IF NOT EXISTS swiggy_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS zomato_enabled BOOLEAN DEFAULT true;

-- Comment: These columns ensure aggregator settings are synced across all devices
-- rather than being stored in local browser storage.
