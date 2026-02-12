-- Create table for storing customer contact messages
CREATE TABLE IF NOT EXISTS public.customer_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread', -- 'unread', 'read', 'replied'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL -- Optional: Link to logged-in user
);

-- Add RLS policies
ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated users) to insert messages
CREATE POLICY "Anyone can insert customer messages" 
ON public.customer_messages 
FOR INSERT 
WITH CHECK (true);

-- Allow restaurant owners/staff to view messages for their restaurant
CREATE POLICY "Restaurant staff can view messages" 
ON public.customer_messages 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.restaurant_staff 
    WHERE restaurant_id = customer_messages.restaurant_id
  ) OR 
  auth.uid() IN (
    SELECT owner_id FROM public.restaurants 
    WHERE id = customer_messages.restaurant_id
  )
);

-- Allow restaurant staff to update status (e.g., mark as read)
CREATE POLICY "Restaurant staff can update messages" 
ON public.customer_messages 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.restaurant_staff 
    WHERE restaurant_id = customer_messages.restaurant_id
  ) OR 
  auth.uid() IN (
    SELECT owner_id FROM public.restaurants 
    WHERE id = customer_messages.restaurant_id
  )
);
