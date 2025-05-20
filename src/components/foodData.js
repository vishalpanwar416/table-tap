import {
  sushiImg,
  curryImg,
  lasagnaImg,
  cupcakeImg,
  burgerImg,
  pancakeImg,
} from '../assets/images/Food/Index';
import { supabase } from '../supabase';

export const categories = [
  { name: 'Snacks', icon: 'Sandwich' },
  { name: 'Main Course', icon: 'UtensilsCrossed' },
  { name: 'Beverages', icon: 'CupSoda' },
  { name: 'Dessert', icon: 'IceCream' },
  { name: 'Offers', icon: 'Tag' },
];

// Local food items as fallback data
export const localFoodItems = [
  { 
    id: 1,
    image: sushiImg,
    name: "Sushi Platter",
    price: 499.00,
    discountType: 'Percentage',
    discountValue: 20,
    description: "Fresh sushi selection",
    category: 'Snacks',
    tags: ['bestseller']
  },
  {
    id: 2,
    image: curryImg,
    name: "Chicken Curry",
    price: 389,
    discountType: 'Percentage',
    discountValue: 20,
    description: "Spicy chicken curry",
    category: 'Main Course',
    tags: ['bestseller']
  },
  {
    id: 3,
    image: lasagnaImg,
    name: "Lasagna",
    price: 199,
    discountType: 'Percentage',
    discountValue: 20,
    description: "Classic Italian lasagna",
    category: 'Main Course',
    tags: ['bestseller']
  },
  {
    id: 4,
    image: cupcakeImg,
    name: "Cupcake",
    price: 170,
    discountType: 'Percentage',
    discountValue: 20,
    description: "Sweet vanilla cupcake",
    category: 'Dessert',
    tags: ['bestseller']
  },
  {
    id: 5,
    image: burgerImg,
    name: "Burger",
    price: 499,
    discountType: 'Percentage',
    discountValue: 20,
    description: "Classic beef burger",
    category: 'Snacks',
    tags: ['recommended']
  },
  {
    id: 6,
    image: pancakeImg,
    name: "Pancake",
    price: 169,
    discountType: 'Percentage',
    discountValue: 20,
    description: "Fluffy breakfast pancakes",
    category: 'Snacks',
    tags: ['recommended']
  },
  {
    id: 7,
    image: burgerImg,
    name: "Cheese Burger",
    price: 399,
    discountType: 'Percentage',
    discountValue: 20,
    description: "Juicy cheeseburger",
    category: 'Snacks',
    tags: ['recommended']
  },
  {
    id: 8,
    image: curryImg,
    name: "Paneer Curry",
    price: 349,
    discountType: 'Percentage',
    discountValue: 20,
    description: "Vegetarian curry dish",
    category: 'Main Course',
    tags: ['recommended']
  },
  {
    id: 9,
    name: "Mexican Appetizer",
    price: 499,
    image: sushiImg,
    discountType: 'Percentage',
    discountValue: 20,
    description: "Spicy mexican starter",
    category: 'Snacks',
    tags: ['bestseller']
  },
  {
    id: 10,
    name: "Pork Skewer",
    price: 399,
    image: burgerImg,
    discountType: 'Percentage',
    discountValue: 20,
    description: "Grilled meat skewers",
    category: 'Snacks',
    tags: ['bestseller']
  }
  // Add more items as needed
];

// Function to fetch food items from Supabase with fallback to local data
export const fetchFoodItems = async () => {
  try {
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching food items from Supabase:', error);
      return localFoodItems; // Use local data as fallback
    }
    
    // If no data returned or empty array, use local data
    if (!data || data.length === 0) {
      console.warn('No data returned from Supabase. Using local data instead.');
      return localFoodItems;
    }
    
    return data;
  } catch (error) {
    console.error('Exception while fetching food items:', error);
    return localFoodItems; // Use local data as fallback on error
  }
};

// Export all local food items for reference
export const allFoodItems = localFoodItems;

// CRUD operations for local data
export const addFoodItem = (newItem) => {
  allFoodItems.push(newItem);
};

export const updateFoodItem = (updatedItem) => {
  const index = allFoodItems.findIndex(item => item.id === updatedItem.id);
  if(index >= 0) {
    allFoodItems[index] = updatedItem;
  }
};

export const deleteFoodItem = (id) => {
  const index = allFoodItems.findIndex(item => item.id === id);
  if(index >= 0) {
    allFoodItems.splice(index, 1);
  }
};