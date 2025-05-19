import { supabase } from '../../supabase';

// Fetch carousel items from Supabase
export const fetchMaincaroselData = async () => {
  try {
    const { data, error } = await supabase
      .from('fooditems')
      .select('*')
      .eq('is_carousel', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching carousel data:', error);
      return [];
    }

    // Transform the data to match the expected format
    return data.map(item => ({
      id: item.id,
      imade: item.image, // Note: keeping 'imade' to match existing component
      discount: formatDiscount(item),
      message: item.description || item.name,
      name: item.name,
      price: item.price,
      discountedPrice: item.discounted_price,
      category: item.category,
      tags: item.tags || []
    }));
  } catch (error) {
    console.error('Unexpected error fetching carousel data:', error);
    return [];
  }
};

// Helper function to format discount display
  const formatDiscount = (item) => {
    if (!item.discounttype || !item.discountvalue) {
      return 'Limited Time';
    }

  switch (item.discounttype.toLowerCase()) {
    case 'percentage':
      return `${item.discountvalue}% OFF`;
    case 'fixed':
      return `$${item.discountvalue} OFF`;
    case 'buy_one_get_one':
    case 'bogo':
      return 'Buy 1 Get 1';
    case 'buy_x_get_y':
      return `Buy ${item.discountvalue} Get 1`;
    default:
      return `${item.discountvalue}% OFF`;
  }
};

// Fallback static data (in case of network issues or empty database)
export const fallbackMaincaroselData = [
  {
    id: 'fallback-1',
    imade: '/api/placeholder/300/200',
    discount: '30% OFF',
    message: 'Experience our delicious new dish',
  },
  {
    id: 'fallback-2',
    imade: '/api/placeholder/300/200',
    discount: '20% OFF',
    message: 'Try our spicy treat today',
  },
  {
    id: 'fallback-3',
    imade: '/api/placeholder/300/200',
    discount: 'Buy 1 Get 1',
    message: 'Tastier than ever before!',
  }
];

// Legacy export for backward compatibility
// This will be empty by default since we're moving to dynamic fetching
export const MaincaroselData = [];