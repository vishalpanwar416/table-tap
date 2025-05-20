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
      message: formatMessage(item),
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

// Helper function to format message display
const formatMessage = (item) => {
  // Use description if available, otherwise use name
  if (item.description && item.description.trim().length > 0) {
    return item.description;
  }
  
  // If no description, create an enticing message based on the item
  if (item.category) {
    return `Delicious ${item.category} Special!`;
  }
  
  return item.name || "Special Offer!";
};

// Helper function to format discount display
const formatDiscount = (item) => {
  // Check if item has discount information
  if (!item.discounttype || !item.discountvalue) {
    // No discount information available, create a dynamic message

    // If there's discounted_price but no explicit discount type
    if (item.price && item.discounted_price && item.price > item.discounted_price) {
      const savings = item.price - item.discounted_price;
      const savingsPercent = Math.round((savings / item.price) * 100);
      
      // If savings percentage is significant, show it
      if (savingsPercent >= 10) {
        return `${savingsPercent}% OFF`;
      }
      
      // Otherwise show the absolute savings
      return `SAVE ₹${savings.toFixed(0)}`;
    }
    
    // Check for tags to create a personalized message
    if (item.tags && item.tags.length > 0) {
      // Look for specific tags that might indicate a special offer
      if (item.tags.some(tag => 
        ['new', 'featured', 'bestseller', 'popular', 'trending', 'hot'].includes(tag.toLowerCase()))) {
        const specialTag = item.tags.find(tag => 
          ['new', 'featured', 'bestseller', 'popular', 'trending', 'hot'].includes(tag.toLowerCase()));
        
        return specialTag.toUpperCase();
      }
    }
    
    // Create enticing offers based on category or random selection
    const specialOffers = [
      'HOT DEAL!', 
      'TODAY\'S SPECIAL', 
      'MUST TRY!', 
      'TOP PICK', 
      'CHEF\'S CHOICE'
    ];
    
    // Use category if available to personalize the offer
    if (item.category) {
      if (item.category.toLowerCase().includes('dessert')) {
        return 'SWEET TREAT';
      } else if (item.category.toLowerCase().includes('breakfast')) {
        return 'MORNING SPECIAL';
      } else if (item.category.toLowerCase().includes('dinner')) {
        return 'DINNER DELIGHT';
      } else if (item.category.toLowerCase().includes('lunch')) {
        return 'LUNCH SPECIAL';
      }
    }
    
    // If no specific information available, use a random special offer
    const randomIndex = Math.floor(Math.random() * specialOffers.length);
    return specialOffers[randomIndex];
  }

  // Use the provided discount information if available
  switch (item.discounttype.toLowerCase()) {
    case 'percentage':
      return `${item.discountvalue}% OFF`;
    case 'fixed':
      return `₹${item.discountvalue} OFF`;
    case 'buy_one_get_one':
    case 'bogo':
      return 'BUY 1 GET 1';
    case 'buy_x_get_y':
      return `BUY ${item.discountvalue} GET 1`;
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
    discount: 'BUY 1 GET 1',
    message: 'Try our spicy treat today',
  },
  {
    id: 'fallback-3',
    imade: '/api/placeholder/300/200',
    discount: 'CHEF\'S CHOICE',
    message: 'Tastier than ever before!',
  }
];

// Legacy export for backward compatibility
// This will be empty by default since we're moving to dynamic fetching
export const MaincaroselData = [];