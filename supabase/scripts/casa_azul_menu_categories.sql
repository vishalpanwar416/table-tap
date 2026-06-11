-- Casa Azul: align categories with app tabs + add Snacks, Main Course, Beverages, Dessert items
-- Restaurant: 8ecc8e4d-f3bf-4116-9010-3436ec1a5baa

-- Recategorize existing dishes (Offers unchanged)
UPDATE public.fooditems SET category = 'Snacks', updated_at = NOW()
WHERE id IN ('755b725b-276b-4fef-8e73-647d470d3f85', 'b6b3d84a-6cb8-44d6-8922-d068ec8b6657');

UPDATE public.fooditems SET category = 'Main Course', updated_at = NOW()
WHERE id IN (
  '12b6137a-8eee-437d-8ae7-924a8380a0e5',
  '7cba03e0-a669-458a-87e2-6dc126970030',
  '09c59072-a528-4ee2-b880-7a096958cd69',
  'd1e45d6a-2a2b-4119-958d-bb47a2e61aca',
  '45a15c55-9e06-47e8-a5dc-87f9ee7e34aa'
);

UPDATE public.fooditems SET category = 'Beverages', updated_at = NOW()
WHERE id = '64724c31-80eb-4493-9bd1-e3a93b4a7513';

UPDATE public.fooditems SET category = 'Dessert', updated_at = NOW()
WHERE id = '794201cc-b3fe-4331-8bae-ff3616c473d4';

-- Snacks
INSERT INTO public.fooditems (id, name, description, price, category, image, tags, is_active, restaurant_id, user_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Guacamole & Chips', 'Fresh smashed avocado with lime, coriander, and tomato. Served with warm tortilla chips.', 199, 'Snacks', 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['veg', 'recommended'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW()),
  (gen_random_uuid(), 'Loaded Nachos Supreme', 'Corn chips topped with cheese, jalapeños, beans, salsa, sour cream, and guacamole.', 279, 'Snacks', 'https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['veg', 'bestseller'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW()),
  (gen_random_uuid(), 'Chicken Flautas', 'Three crispy rolled tortillas stuffed with spiced chicken, served with crema and salsa.', 249, 'Snacks', 'https://images.pexels.com/photos/2092500/pexels-photo-2092500.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['non veg'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW()),
  (gen_random_uuid(), 'Baja Fish Tacos (2 pcs)', 'Beer-battered fish, cabbage slaw, and chipotle mayo on soft tortillas.', 269, 'Snacks', 'https://images.pexels.com/photos/2089712/pexels-photo-2089712.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['non veg', 'recommended'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW());

-- Main Course
INSERT INTO public.fooditems (id, name, description, price, category, image, tags, is_active, restaurant_id, user_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Birria Tacos (3 pcs)', 'Slow-braised beef tacos with consommé for dipping, onion, and coriander.', 399, 'Main Course', 'https://images.pexels.com/photos/1556688/pexels-photo-1556688.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['bestseller', 'non veg'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW()),
  (gen_random_uuid(), 'Pollo Asado Plate', 'Grilled marinated chicken with Mexican rice, black beans, and pico de gallo.', 429, 'Main Course', 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['non veg'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW()),
  (gen_random_uuid(), 'Veggie Fajita Bowl', 'Sautéed peppers, corn, beans, rice, and guacamole — a hearty vegetarian bowl.', 349, 'Main Course', 'https://images.pexels.com/photos/674574/pexels-photo-674574.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['veg', 'recommended'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW()),
  (gen_random_uuid(), 'Steak Burrito Bowl', 'Grilled steak, cilantro-lime rice, beans, fajita peppers, and salsa roja.', 459, 'Main Course', 'https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['non veg', 'bestseller'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW());

-- Beverages
INSERT INTO public.fooditems (id, name, description, price, category, image, tags, is_active, restaurant_id, user_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Horchata', 'Creamy cinnamon-vanilla rice milk — lightly sweet and ice-cold.', 149, 'Beverages', 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['veg', 'recommended'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW()),
  (gen_random_uuid(), 'Mango Agua Fresca', 'Fresh mango blended with water and lime — tropical and refreshing.', 159, 'Beverages', 'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['veg'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW()),
  (gen_random_uuid(), 'Virgin Mojito Mexicano', 'Fresh lime, mint, and soda with a hint of jalapeño — zesty and cooling.', 189, 'Beverages', 'https://images.pexels.com/photos/7661032/pexels-photo-7661032.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['veg', 'bestseller'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW()),
  (gen_random_uuid(), 'Jarritos Mandarin', 'Classic Mexican mandarin soda — crisp, bubbly, and ice-cold.', 99, 'Beverages', 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['veg'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW());

-- Dessert
INSERT INTO public.fooditems (id, name, description, price, category, image, tags, is_active, restaurant_id, user_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Tres Leches Cake', 'Light sponge soaked in three milks, topped with whipped cream and cinnamon.', 229, 'Dessert', 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['sweet', 'bestseller', 'veg'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW()),
  (gen_random_uuid(), 'Mexican Flan', 'Silky caramel custard with a rich, buttery caramel sauce.', 199, 'Dessert', 'https://images.pexels.com/photos/2456435/pexels-photo-2456435.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['sweet', 'veg'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW()),
  (gen_random_uuid(), 'Cinnamon Sopapillas', 'Puffy fried pastries dusted with cinnamon sugar, served with honey.', 179, 'Dessert', 'https://images.pexels.com/photos/2087740/pexels-photo-2087740.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['sweet', 'veg'], true, '8ecc8e4d-f3bf-4116-9010-3436ec1a5baa', '254e442f-005d-420b-80e4-1e590c7e1466', NOW(), NOW());
