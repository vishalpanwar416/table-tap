CREATE TABLE IF NOT EXISTS public.customer_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON public.customer_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow restaurant staff select" ON public.customer_messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.restaurant_staff 
    WHERE restaurant_staff.restaurant_id = customer_messages.restaurant_id 
    AND restaurant_staff.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = customer_messages.restaurant_id 
    AND restaurants.owner_id = auth.uid()
  )
);

