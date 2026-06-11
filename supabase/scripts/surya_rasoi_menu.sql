-- Rename Restaurant-3 → Deccan Spice House and seed a full Indian menu
-- Restaurant: d206b51e-a82d-4a21-8199-d3a2cabd102b (dev: vogixryubhpqziivspks)

UPDATE public.restaurants SET
  name = 'Deccan Spice House',
  cuisine_type = 'indian',
  description = 'Hyderabadi flavours from the Deccan — fragrant biryanis, tandoor grills, and homestyle curries at Surya Royal Homes.',
  address = 'Surya Royal Homes, Madhapur, Hyderabad',
  opening_hours = '11:00 AM - 11:00 PM',
  is_active = true,
  updated_at = NOW()
WHERE id = 'd206b51e-a82d-4a21-8199-d3a2cabd102b';

-- Replace any existing placeholder items
DELETE FROM public.fooditems
WHERE restaurant_id = 'd206b51e-a82d-4a21-8199-d3a2cabd102b';

-- Snacks
INSERT INTO public.fooditems (id, name, description, price, category, image, tags, is_active, restaurant_id, user_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  v.name,
  v.description,
  v.price,
  v.category,
  v.image,
  v.tags,
  true,
  'd206b51e-a82d-4a21-8199-d3a2cabd102b',
  COALESCE(
    (SELECT rs.user_id FROM public.restaurant_staff rs
     WHERE rs.restaurant_id = 'd206b51e-a82d-4a21-8199-d3a2cabd102b' AND rs.staff_role = 'owner' LIMIT 1),
    (SELECT rs.user_id FROM public.restaurant_staff rs
     WHERE rs.restaurant_id = 'd206b51e-a82d-4a21-8199-d3a2cabd102b' LIMIT 1)
  ),
  NOW(),
  NOW()
FROM (VALUES
  ('Paneer Tikka', 'Char-grilled cottage cheese cubes marinated in hung curd, kasuri methi, and spices. Served with mint chutney.', 249, 'Snacks', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80', ARRAY['veg', 'bestseller', 'recommended']),
  ('Chicken 65', 'Crispy Andhra-style fried chicken tossed with curry leaves, green chilli, and yogurt masala.', 279, 'Snacks', 'https://images.unsplash.com/photo-1604908176997-4314e64cb0a8?w=800&auto=format&fit=crop&q=80', ARRAY['non veg', 'bestseller']),
  ('Samosa Chaat', 'Crushed samosa topped with chana, yogurt, tamarind chutney, and sev.', 149, 'Snacks', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80', ARRAY['veg', 'recommended']),
  ('Tomato Shorba', 'Smoky tomato soup tempered with cumin and fresh coriander.', 129, 'Snacks', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80', ARRAY['veg']),
  ('Veg Spring Rolls', 'Crispy rolls stuffed with cabbage, carrot, and glass noodles. Served with sweet chilli dip.', 199, 'Snacks', 'https://images.unsplash.com/photo-1529006557810-274dbfca8a7d?w=800&auto=format&fit=crop&q=80', ARRAY['veg'])
) AS v(name, description, price, category, image, tags);

-- Main Course
INSERT INTO public.fooditems (id, name, description, price, category, image, tags, is_active, restaurant_id, user_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  v.name,
  v.description,
  v.price,
  v.category,
  v.image,
  v.tags,
  true,
  'd206b51e-a82d-4a21-8199-d3a2cabd102b',
  COALESCE(
    (SELECT rs.user_id FROM public.restaurant_staff rs
     WHERE rs.restaurant_id = 'd206b51e-a82d-4a21-8199-d3a2cabd102b' AND rs.staff_role = 'owner' LIMIT 1),
    (SELECT rs.user_id FROM public.restaurant_staff rs
     WHERE rs.restaurant_id = 'd206b51e-a82d-4a21-8199-d3a2cabd102b' LIMIT 1)
  ),
  NOW(),
  NOW()
FROM (VALUES
  ('Hyderabadi Chicken Biryani', 'Long-grain basmati rice layered with saffron, fried onions, and spiced chicken. Served with raita.', 349, 'Main Course', 'https://images.unsplash.com/photo-1563379091339-03246963d96a?w=800&auto=format&fit=crop&q=80', ARRAY['non veg', 'bestseller', 'recommended']),
  ('Veg Dum Biryani', 'Fragrant basmati cooked dum-style with seasonal vegetables, mint, and fried onions.', 299, 'Main Course', 'https://images.unsplash.com/photo-1589302167524-97c30a0a0c0e?w=800&auto=format&fit=crop&q=80', ARRAY['veg', 'recommended']),
  ('Butter Chicken', 'Tandoor-roasted chicken simmered in a rich tomato-butter gravy with kasuri methi.', 329, 'Main Course', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80', ARRAY['non veg', 'bestseller']),
  ('Paneer Butter Masala', 'Soft paneer cubes in a creamy tomato-onion gravy. Best with naan or jeera rice.', 289, 'Main Course', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80', ARRAY['veg', 'bestseller']),
  ('Dal Makhani', 'Slow-cooked black lentils finished with cream and butter — a classic Punjabi staple.', 229, 'Main Course', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80', ARRAY['veg']),
  ('Tandoori Roti (2 pcs)', 'Whole-wheat flatbread baked in the clay tandoor, served hot.', 49, 'Main Course', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80', ARRAY['veg']),
  ('Garlic Naan', 'Leavened bread topped with fresh garlic and coriander, brushed with butter.', 69, 'Main Course', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80', ARRAY['veg', 'recommended']),
  ('Jeera Rice', 'Basmati rice tempered with cumin seeds and ghee.', 149, 'Main Course', 'https://images.unsplash.com/photo-1516684669134-de6f7d473a0c?w=800&auto=format&fit=crop&q=80', ARRAY['veg'])
) AS v(name, description, price, category, image, tags);

-- Beverages
INSERT INTO public.fooditems (id, name, description, price, category, image, tags, is_active, restaurant_id, user_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  v.name,
  v.description,
  v.price,
  v.category,
  v.image,
  v.tags,
  true,
  'd206b51e-a82d-4a21-8199-d3a2cabd102b',
  COALESCE(
    (SELECT rs.user_id FROM public.restaurant_staff rs
     WHERE rs.restaurant_id = 'd206b51e-a82d-4a21-8199-d3a2cabd102b' AND rs.staff_role = 'owner' LIMIT 1),
    (SELECT rs.user_id FROM public.restaurant_staff rs
     WHERE rs.restaurant_id = 'd206b51e-a82d-4a21-8199-d3a2cabd102b' LIMIT 1)
  ),
  NOW(),
  NOW()
FROM (VALUES
  ('Masala Chai', 'Strong Assam tea brewed with ginger, cardamom, and milk.', 49, 'Beverages', 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&auto=format&fit=crop&q=80', ARRAY['veg', 'bestseller']),
  ('Mango Lassi', 'Thick yogurt blended with Alphonso mango pulp and a touch of cardamom.', 99, 'Beverages', 'https://images.unsplash.com/photo-1626201800055-68ec56d5aeb8?w=800&auto=format&fit=crop&q=80', ARRAY['veg', 'recommended']),
  ('Sweet Lassi', 'Chilled yogurt drink lightly sweetened with sugar and rose water.', 79, 'Beverages', 'https://images.unsplash.com/photo-1626201800055-68ec56d5aeb8?w=800&auto=format&fit=crop&q=80', ARRAY['veg']),
  ('Fresh Lime Soda', 'Freshly squeezed lime with soda — sweet or salted.', 69, 'Beverages', 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&auto=format&fit=crop&q=80', ARRAY['veg'])
) AS v(name, description, price, category, image, tags);

-- Dessert
INSERT INTO public.fooditems (id, name, description, price, category, image, tags, is_active, restaurant_id, user_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  v.name,
  v.description,
  v.price,
  v.category,
  v.image,
  v.tags,
  true,
  'd206b51e-a82d-4a21-8199-d3a2cabd102b',
  COALESCE(
    (SELECT rs.user_id FROM public.restaurant_staff rs
     WHERE rs.restaurant_id = 'd206b51e-a82d-4a21-8199-d3a2cabd102b' AND rs.staff_role = 'owner' LIMIT 1),
    (SELECT rs.user_id FROM public.restaurant_staff rs
     WHERE rs.restaurant_id = 'd206b51e-a82d-4a21-8199-d3a2cabd102b' LIMIT 1)
  ),
  NOW(),
  NOW()
FROM (VALUES
  ('Gulab Jamun (2 pcs)', 'Warm milk-solid dumplings soaked in cardamom-scented sugar syrup.', 99, 'Dessert', 'https://images.unsplash.com/photo-1586985289902-1cba4c8b3f0b?w=800&auto=format&fit=crop&q=80', ARRAY['veg', 'sweet', 'bestseller']),
  ('Rasmalai', 'Soft cottage cheese discs in chilled saffron milk.', 129, 'Dessert', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=80', ARRAY['veg', 'sweet', 'recommended']),
  ('Kulfi Falooda', 'Traditional malai kulfi with vermicelli, rose syrup, and basil seeds.', 149, 'Dessert', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop&q=80', ARRAY['veg', 'sweet'])
) AS v(name, description, price, category, image, tags);

-- Offers
INSERT INTO public.fooditems (id, name, description, price, category, image, tags, is_active, restaurant_id, user_id, created_at, updated_at, discounttype, discountvalue, discounted_price)
SELECT
  gen_random_uuid(),
  v.name,
  v.description,
  v.price,
  v.category,
  v.image,
  v.tags,
  true,
  'd206b51e-a82d-4a21-8199-d3a2cabd102b',
  COALESCE(
    (SELECT rs.user_id FROM public.restaurant_staff rs
     WHERE rs.restaurant_id = 'd206b51e-a82d-4a21-8199-d3a2cabd102b' AND rs.staff_role = 'owner' LIMIT 1),
    (SELECT rs.user_id FROM public.restaurant_staff rs
     WHERE rs.restaurant_id = 'd206b51e-a82d-4a21-8199-d3a2cabd102b' LIMIT 1)
  ),
  NOW(),
  NOW(),
  v.discounttype,
  v.discountvalue,
  v.discounted_price
FROM (VALUES
  ('Lunch Thali Combo', 'Dal, seasonal sabzi, rice, roti (2), papad, pickle, and dessert — weekday lunch special.', 249::numeric, 'Offers', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80', ARRAY['veg', 'bestseller'], 'percentage', 15::numeric, 212::numeric),
  ('Family Biryani Feast', 'Full Hyderabadi chicken biryani (serves 2) with raita and mirchi ka salan.', 599::numeric, 'Offers', 'https://images.unsplash.com/photo-1563379091339-03246963d96a?w=800&auto=format&fit=crop&q=80', ARRAY['non veg', 'recommended'], 'flat', 50::numeric, 549::numeric)
) AS v(name, description, price, category, image, tags, discounttype, discountvalue, discounted_price);
