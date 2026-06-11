-- Casa Azul (8ecc8e4d-f3bf-4116-9010-3436ec1a5baa) — realistic Mexican cafe menu
-- Run against dev project vogixryubhpqziivspks

UPDATE public.fooditems SET
  name = 'Al Pastor Tacos',
  description = 'Three soft corn tortillas with marinated pork, grilled pineapple, white onion, and fresh cilantro. Served with lime and our house salsa roja.',
  category = 'Tacos',
  price = 299,
  discounttype = NULL,
  discountvalue = NULL,
  discounted_price = NULL,
  image = 'https://images.unsplash.com/photo-1565299585323-38174c4a1b48?w=800&auto=format&fit=crop&q=80',
  tags = ARRAY['bestseller', 'recommended', 'non veg'],
  is_active = true,
  updated_at = NOW()
WHERE id = '12b6137a-8eee-437d-8ae7-924a8380a0e5';

UPDATE public.fooditems SET
  name = 'Agua Fresca de Jamaica',
  description = 'Chilled hibiscus flower agua fresca — tart, floral, and lightly sweetened. The perfect refresher with spice-forward dishes.',
  category = 'Bebidas',
  price = 120,
  discounttype = NULL,
  discountvalue = NULL,
  discounted_price = NULL,
  image = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80',
  tags = ARRAY['recommended', 'veg'],
  is_active = true,
  updated_at = NOW()
WHERE id = '64724c31-80eb-4493-9bd1-e3a93b4a7513';

UPDATE public.fooditems SET
  name = 'Carnitas Burrito',
  description = 'Slow-braised pulled pork wrapped in a warm flour tortilla with Mexican rice, black beans, pico de gallo, crema, and shredded cheese.',
  category = 'Burritos',
  price = 349,
  discounttype = NULL,
  discountvalue = NULL,
  discounted_price = NULL,
  image = 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=80',
  tags = ARRAY['non veg'],
  is_active = true,
  updated_at = NOW()
WHERE id = '7cba03e0-a669-458a-87e2-6dc126970030';

UPDATE public.fooditems SET
  name = 'Grilled Chicken Quesadilla',
  description = 'Flour tortilla grilled golden with melted Oaxaca cheese, spiced chicken, roasted peppers, and guacamole on the side.',
  category = 'Platos Fuertes',
  price = 329,
  discounttype = 'Percentage',
  discountvalue = 10,
  discounted_price = NULL,
  image = 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800&auto=format&fit=crop&q=80',
  tags = ARRAY['bestseller', 'non veg'],
  is_active = true,
  updated_at = NOW()
WHERE id = '09c59072-a528-4ee2-b880-7a096958cd69';

UPDATE public.fooditems SET
  name = 'Elote Mexicano',
  description = 'Charred sweet corn on the cob brushed with lime mayo, cotija cheese, chili powder, and coriander. A street-food classic.',
  category = 'Entradas',
  price = 199,
  discounttype = NULL,
  discountvalue = NULL,
  discounted_price = NULL,
  image = 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&auto=format&fit=crop&q=80',
  tags = ARRAY['veg', 'recommended'],
  is_active = true,
  updated_at = NOW()
WHERE id = '755b725b-276b-4fef-8e73-647d470d3f85';

UPDATE public.fooditems SET
  name = 'Enchiladas Verdes',
  description = 'Three corn tortillas rolled with shredded chicken, smothered in tangy tomatillo salsa verde, crema, and queso fresco.',
  category = 'Platos Fuertes',
  price = 379,
  discounttype = NULL,
  discountvalue = NULL,
  discounted_price = NULL,
  image = 'https://images.unsplash.com/photo-1599974579688-e3a83ce7dd87?w=800&auto=format&fit=crop&q=80',
  tags = ARRAY['recommended', 'non veg'],
  is_active = true,
  updated_at = NOW()
WHERE id = 'd1e45d6a-2a2b-4119-958d-bb47a2e61aca';

UPDATE public.fooditems SET
  name = 'Queso Fundido con Chorizo',
  description = 'Bubbling skillet of melted cheese with crumbled chorizo, served with warm flour tortillas for scooping.',
  category = 'Entradas',
  price = 319,
  discounttype = 'Percentage',
  discountvalue = 10,
  discounted_price = NULL,
  image = 'https://images.unsplash.com/photo-1513456852971-3b5d7ede51f8?w=800&auto=format&fit=crop&q=80',
  tags = ARRAY['bestseller', 'non veg'],
  is_active = true,
  updated_at = NOW()
WHERE id = 'b6b3d84a-6cb8-44d6-8922-d068ec8b6657';

UPDATE public.fooditems SET
  name = 'Chipotle Beef Tacos',
  description = 'Three tacos with smoky chipotle-marinated beef, pickled onions, avocado crema, and fresh coriander on corn tortillas.',
  category = 'Tacos',
  price = 329,
  discounttype = NULL,
  discountvalue = NULL,
  discounted_price = NULL,
  image = 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&auto=format&fit=crop&q=80',
  tags = ARRAY['bestseller', 'non veg'],
  is_active = true,
  updated_at = NOW()
WHERE id = '45a15c55-9e06-47e8-a5dc-87f9ee7e34aa';

-- Offers
UPDATE public.fooditems SET
  name = 'Fiesta para Dos',
  description = 'Date-night combo: Al Pastor Tacos, Enchiladas Verdes, and two Agua Frescas. Save ₹50 when ordered together.',
  category = 'Offers',
  price = 799,
  discounted_price = 749,
  image = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
  is_carousel = false,
  is_active = true,
  updated_at = NOW()
WHERE id = 'ee52720b-06b0-4423-a365-f57f9a421fb5';

UPDATE public.fooditems SET
  name = 'Taco Tuesday Special',
  description = 'Any taco platter at 10% off every Tuesday. Al Pastor Tacos included — limited to one per table.',
  category = 'Offers',
  price = 299,
  discounted_price = 269,
  image = 'https://images.unsplash.com/photo-1565299585323-38174c4a1b48?w=800&auto=format&fit=crop&q=80',
  is_carousel = true,
  is_active = true,
  updated_at = NOW()
WHERE id = '9cf61024-22e2-4d11-a242-6a987797cbad';

UPDATE public.fooditems SET
  name = 'Familia Feast',
  description = 'Feeds four: Chipotle Beef Tacos, Carnitas Burrito, Elote Mexicano, and Queso Fundido. Ideal for sharing.',
  category = 'Offers',
  price = 1099,
  discounted_price = 999,
  image = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
  is_carousel = true,
  tags = ARRAY['recommended'],
  is_active = true,
  updated_at = NOW()
WHERE id = '4164cfbb-94a6-402a-95f1-1c48293fd5d0';

UPDATE public.fooditems SET
  name = 'La Gran Fiesta',
  description = 'Party platter for groups: tacos, quesadilla, elote, and enchiladas. Best value for celebrations.',
  category = 'Offers',
  price = 1299,
  discounted_price = 1149,
  image = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
  is_carousel = false,
  is_active = true,
  updated_at = NOW()
WHERE id = 'afe3678e-4a8a-477f-8b62-b6bb62e00e1d';

UPDATE public.fooditems SET
  name = 'Nachos & Quesadilla Combo',
  description = 'Loaded nachos with jalapeños and sour cream plus a grilled chicken quesadilla. Great for two.',
  category = 'Offers',
  price = 549,
  discounted_price = 449,
  image = 'https://images.unsplash.com/photo-1513456852971-3b5d7ede51f8?w=800&auto=format&fit=crop&q=80',
  is_carousel = true,
  is_active = true,
  updated_at = NOW()
WHERE id = '6fe4357e-113c-4f36-aa28-12236cc88823';

UPDATE public.fooditems SET
  name = 'Estudiante Lunch Box',
  description = 'Weekday student special: taco platter, agua fresca, and churros. Valid 12–4 PM with student ID.',
  category = 'Offers',
  price = 449,
  discounted_price = 399,
  image = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop&q=80',
  is_carousel = false,
  is_active = true,
  updated_at = NOW()
WHERE id = 'c5e79fa1-d55b-4c60-a60f-bb4b202a4f68';

UPDATE public.fooditems SET
  name = 'Churros con Chocolate',
  description = 'Crispy cinnamon-sugar churros served with warm Mexican chocolate dipping sauce. A Casa Azul favourite.',
  category = 'Postres',
  price = 249,
  discounttype = 'Percentage',
  discountvalue = 10,
  discounted_price = 199,
  image = 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&auto=format&fit=crop&q=80',
  tags = ARRAY['sweet', 'bestseller', 'veg'],
  is_carousel = false,
  is_active = true,
  updated_at = NOW()
WHERE id = '794201cc-b3fe-4331-8bae-ff3616c473d4';
