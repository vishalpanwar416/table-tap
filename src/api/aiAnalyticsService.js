// src/api/aiAnalyticsService.js
import { supabase } from '../supabase';

// Get restaurant analytics data
export const getRestaurantAnalytics = async () => {
  try {
    // Get orders data with aggregations
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Get food items data
    const { data: foodItemsData, error: foodItemsError } = await supabase
      .from('fooditems')
      .select('*');

    if (foodItemsError) throw foodItemsError;

    // Get user profiles for customer insights
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, created_at');

    if (profilesError) throw profilesError;

    // Calculate analytics
    const totalOrders = ordersData?.length || 0;
    const totalRevenue = ordersData?.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0) || 0;
    const totalMenuItems = foodItemsData?.length || 0;
    const totalCustomers = profilesData?.length || 0;

    // Orders by status
    const ordersByStatus = ordersData?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Revenue by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = ordersData?.filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    ) || [];

    const dailyRevenue = recentOrders.reduce((acc, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (parseFloat(order.total) || 0);
      return acc;
    }, {});

    // Popular items analysis
    const itemFrequency = {};
    ordersData?.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemName = item.name || item.title;
          if (itemName) {
            itemFrequency[itemName] = (itemFrequency[itemName] || 0) + (item.quantity || 1);
          }
        });
      }
    });

    const popularItems = Object.entries(itemFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Peak hours analysis
    const hourlyOrders = ordersData?.reduce((acc, order) => {
      const hour = new Date(order.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {}) || {};

    const peakHour = Object.entries(hourlyOrders)
      .sort(([,a], [,b]) => b - a)[0];

    // Categories performance
    const categoryRevenue = {};
    ordersData?.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const category = item.category || 'Unknown';
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          categoryRevenue[category] = (categoryRevenue[category] || 0) + itemTotal;
        });
      }
    });

    return {
      summary: {
        totalOrders,
        totalRevenue,
        totalMenuItems,
        totalCustomers,
        avgOrderValue,
        peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A'
      },
      ordersByStatus,
      dailyRevenue,
      popularItems,
      categoryRevenue,
      hourlyOrders,
      rawData: {
        orders: ordersData,
        foodItems: foodItemsData,
        profiles: profilesData
      }
    };
  } catch (error) {
    console.error('Error fetching restaurant analytics:', error);
    throw error;
  }
};

// Generate AI prompt with restaurant data
export const generateAIPrompt = (userQuestion, analyticsData) => {
  const { summary, ordersByStatus, popularItems, categoryRevenue } = analyticsData;

  const systemPrompt = `You are an AI business analyst for a restaurant. You have access to the following restaurant data:

RESTAURANT SUMMARY:
- Total Orders: ${summary.totalOrders}
- Total Revenue: $${summary.totalRevenue.toFixed(2)}
- Total Menu Items: ${summary.totalMenuItems}
- Total Customers: ${summary.totalCustomers}
- Average Order Value: $${summary.avgOrderValue.toFixed(2)}
- Peak Hour: ${summary.peakHour}

ORDERS BY STATUS:
${Object.entries(ordersByStatus).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

TOP 5 POPULAR ITEMS:
${popularItems.slice(0, 5).map((item, i) => `${i + 1}. ${item.name} (${item.count} orders)`).join('\n')}

CATEGORY REVENUE:
${Object.entries(categoryRevenue).map(([category, revenue]) => `- ${category}: $${revenue.toFixed(2)}`).join('\n')}

Please provide insights, recommendations, and answer questions about this restaurant's performance. Be specific and actionable in your responses. Use the data to support your recommendations.

User Question: ${userQuestion}`;

  return systemPrompt;
};

// Call AI service (you can replace this with your preferred AI service)
export const callAIService = async (prompt) => {
  try {
    // Example using OpenAI API - replace with your preferred AI service
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` // Add this to your .env file
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful restaurant business analyst AI assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling AI service:', error);
    
    // Fallback response if AI service is unavailable
    return `I'm currently unable to connect to the AI service. However, based on your restaurant data:

- You have ${await getBasicInsights()}

Please check your API configuration or try again later.`;
  }
};

// Fallback insights function
const getBasicInsights = async () => {
  try {
    const analytics = await getRestaurantAnalytics();
    const { summary, popularItems } = analytics;
    
    return `
• ${summary.totalOrders} total orders with $${summary.totalRevenue.toFixed(2)} in revenue
• Average order value of $${summary.avgOrderValue.toFixed(2)}
• Top selling item: ${popularItems[0]?.name || 'N/A'}
• Peak business hour: ${summary.peakHour}

Consider focusing on promoting your popular items and optimizing operations during peak hours.`;
  } catch (error) {
    return 'basic restaurant metrics available in your dashboard.';
  }
};