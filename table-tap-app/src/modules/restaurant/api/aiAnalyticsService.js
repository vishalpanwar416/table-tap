// src/api/aiAnalyticsService.js
import { supabase } from '../../shared/supabase';
import { formatCurrency } from '../../shared/utils/formatters';

// Get restaurant analytics data
export const getRestaurantAnalytics = async (dateRange = 'last7days', restaurantId = null) => {
  try {
    // Calculate date range
    let fromDate, toDate = new Date();
    toDate.setHours(23, 59, 59, 999);
    switch (dateRange) {
      case 'today':
        fromDate = new Date();
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'last7days':
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 6);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'last30days':
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 29);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'thismonth':
        fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        break;
      default:
        fromDate = null; // fetch all
    }

    let ordersQuery = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (fromDate) {
      ordersQuery = ordersQuery.gte('created_at', fromDate.toISOString());
    }
    if (toDate) {
      ordersQuery = ordersQuery.lte('created_at', toDate.toISOString());
    }
    if (restaurantId) {
      ordersQuery = ordersQuery.eq('restaurant_id', restaurantId);
    }

    const { data: ordersData, error: ordersError } = await ordersQuery;
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
      .sort(([, a], [, b]) => b - a)
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
      .sort(([, a], [, b]) => b - a)[0];

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
    throw error;
  }
};

// Generate AI prompt with restaurant data
export const generateAIPrompt = (userQuestion, analyticsData) => {
  const { summary, ordersByStatus, popularItems, categoryRevenue } = analyticsData;

  const systemPrompt = `You are an AI business analyst for a restaurant. You have access to the following restaurant data:

RESTAURANT SUMMARY:
- Total Orders: ${summary.totalOrders}
- Total Revenue: ${formatCurrency(summary.totalRevenue)}
- Total Menu Items: ${summary.totalMenuItems}
- Total Customers: ${summary.totalCustomers}
- Average Order Value: ${formatCurrency(summary.avgOrderValue)}
- Peak Hour: ${summary.peakHour}

ORDERS BY STATUS:
${Object.entries(ordersByStatus).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

TOP 5 POPULAR ITEMS:
${popularItems.slice(0, 5).map((item, i) => `${i + 1}. ${item.name} (${item.count} orders)`).join('\n')}

CATEGORY REVENUE:
${Object.entries(categoryRevenue).map(([category, revenue]) => `- ${category}: ${formatCurrency(revenue)}`).join('\n')}

Please provide insights, recommendations, and answer questions about this restaurant's performance. Be specific and actionable in your responses. Use the data to support your recommendations.

User Question: ${userQuestion}`;

  return systemPrompt;
};

// Call AI service (you can replace this with your preferred AI service)
export const callAIService = async (userQuestion, analyticsData) => {
  // Generate the AI prompt with restaurant data
  const prompt = generateAIPrompt(userQuestion, analyticsData);

  // Check if API key is available
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  // Debug logging (remove in production)
  console.log({
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 7) + '...' : 'none',
    nodeEnv: process.env.NODE_ENV
  });

  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please check your .env file and ensure REACT_APP_OPENAI_API_KEY is set.');
  }

  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful restaurant business analyst AI assistant. Provide specific, actionable insights based on the restaurant data provided. Use the Indian Rupee symbol (₹) for currency values.'
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
    const errorData = await response.json().catch(() => ({}));
    console.log({
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });

    // Handle specific error cases
    if (response.status === 429) {
      if (errorData.error?.message?.includes('quota')) {
        throw new Error('OpenAI quota exceeded. Please check your billing and upgrade your plan at https://platform.openai.com/account/billing');
      } else {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
    } else if (response.status === 401) {
      throw new Error('Invalid API key. Please check your OpenAI API key in the .env file.');
    } else if (response.status === 403) {
      throw new Error('Access denied. Please check your OpenAI account status and billing.');
    } else {
      throw new Error(`AI service error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;

  // Generate visualization based on the question and data
  const visualization = generateVisualization(userQuestion, analyticsData);

  return {
    textResponse: aiResponse,
    visualization: visualization
  };
};

// Generate visualizations based on user questions
const generateVisualization = (question, analyticsData) => {
  if (!analyticsData) return null;

  const questionLower = question.toLowerCase();
  const { dailyRevenue, popularItems, categoryRevenue, hourlyOrders } = analyticsData;

  // Revenue trend visualization
  if (questionLower.includes('revenue') && questionLower.includes('trend')) {
    const revenueData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      revenue: revenue
    })).slice(-7); // Last 7 days

    return {
      type: 'line',
      title: 'Revenue Trend (Last 7 Days)',
      data: revenueData,
      xKey: 'date',
      yKey: 'revenue'
    };
  }

  // Popular items visualization
  if (questionLower.includes('popular') || questionLower.includes('top') || questionLower.includes('selling')) {
    const topItems = popularItems.slice(0, 5).map(item => ({
      name: item.name,
      orders: item.count
    }));

    return {
      type: 'bar',
      title: 'Top Selling Items',
      data: topItems,
      xKey: 'name',
      yKey: 'orders'
    };
  }

  // Category performance visualization
  if (questionLower.includes('category') || questionLower.includes('menu')) {
    const categoryData = Object.entries(categoryRevenue).map(([category, revenue]) => ({
      name: category,
      value: revenue
    }));

    return {
      type: 'pie',
      title: 'Revenue by Category',
      data: categoryData
    };
  }

  // Peak hours visualization
  if (questionLower.includes('peak') || questionLower.includes('hour') || questionLower.includes('busy')) {
    const hourlyData = Object.entries(hourlyOrders).map(([hour, orders]) => ({
      hour: `${hour}:00`,
      orders: orders
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    return {
      type: 'bar',
      title: 'Orders by Hour',
      data: hourlyData,
      xKey: 'hour',
      yKey: 'orders'
    };
  }

  return null;
};