import { supabase } from '../../shared/supabase';
import { formatCurrency } from '../../shared/utils/formatters';

// Save a chat message to the database
export const saveChatMessage = async ({ restaurantId, userId, role, content, visualization = null, metadata = null }) => {
  try {
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .insert([
        {
          restaurant_id: restaurantId,
          user_id: userId,
          role: role,
          content: content,
          visualization: visualization,
          metadata: metadata
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error saving chat message:', error);
    throw error;
  }
};

// Get chat history for a restaurant
export const getChatHistory = async (restaurantId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

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
          const itemTotal = (parseFloat(item.price) || 0) * (item.quantity || 1);
          categoryRevenue[category] = (categoryRevenue[category] || 0) + itemTotal;
        });
      }
    });

    // Growth Velocity Analysis (Current vs Previous Week)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const currentWeekOrders = ordersData?.filter(o => new Date(o.created_at) >= sevenDaysAgo) || [];
    const prevWeekOrders = ordersData?.filter(o => {
      const date = new Date(o.created_at);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    }) || [];

    const currentWeekRev = currentWeekOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const prevWeekRev = prevWeekOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);

    const revenueGrowth = prevWeekRev > 0 ? ((currentWeekRev - prevWeekRev) / prevWeekRev) * 100 : 0;
    const orderGrowth = prevWeekOrders.length > 0 ? ((currentWeekOrders.length - prevWeekOrders.length) / prevWeekOrders.length) * 100 : 0;

    // Customer Retention Analysis
    const customerOrders = {};
    ordersData?.forEach(order => {
      if (order.user_id) {
        customerOrders[order.user_id] = (customerOrders[order.user_id] || 0) + 1;
      }
    });

    const totalRepeatCustomers = Object.values(customerOrders).filter(count => count > 1).length;
    const totalUniqueCustomers = Object.keys(customerOrders).length;

    return {
      summary: {
        totalOrders,
        totalRevenue,
        totalMenuItems,
        totalCustomers,
        avgOrderValue,
        peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
        retentionRate: totalUniqueCustomers > 0 ? (totalRepeatCustomers / totalUniqueCustomers) * 100 : 0,
        growthMetrics: {
          revenueGrowth: revenueGrowth.toFixed(1),
          orderGrowth: orderGrowth.toFixed(1),
          currentWeekRev,
          prevWeekRev
        }
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

// Generate AI System Context with restaurant data
export const generateAISystemContext = (analyticsData) => {
  if (!analyticsData) return 'You are the Table-Tap Advisor, a friendly and empathetic human-like business companion for restaurant owners.';

  const { summary, ordersByStatus, popularItems, categoryRevenue } = analyticsData;

  return `You are the "Table-Tap Advisor," a high-intelligence strategic business partner for restaurant owners. Your tone is warm, empathetic, and professional, like a trusted mentor.

CORE MISSION:
Analyze the restaurant's data to uncover "hidden growth levers" and provide actionable, empathetic advice that helps the owner increase revenue, improve efficiency, and build a loyal customer base.

CURRENT PERFORMANCE DATA (CRITICAL):
- Sales Velocity: ${summary.totalOrders} orders current period
- Financial Health: ${formatCurrency(summary.totalRevenue)} total revenue
- Ticket size: ${formatCurrency(summary.avgOrderValue)} average order value
- Growth Velocity: ${summary.growthMetrics.revenueGrowth}% revenue change vs previous week
- Sales momentum: ${summary.growthMetrics.orderGrowth}% order volume change
- Peak Traffic: ${summary.peakHour} (Critical for staffing/prep)
- Loyalty Metric: ${summary.retentionRate.toFixed(1)}% customer retention
- Star Performers (Top Items): ${popularItems.slice(0, 5).map(item => `${item.name}`).join(', ')}
- High-Value Category: ${Object.entries(categoryRevenue).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}

ADVISORY PATTERNS TO FOLLOW:
1. REVENUE GROWTH: If Growth Velocity is negative, focus on "Rescue Strategies" (new combos, happy hours). If Growth is positive (>10%), suggest "Scaling Tactics" (hiring, loyalty apps).
2. TICKET BOOSTR: If 'Ticket size' is low, suggest specific upselling combos for ${popularItems[0]?.name || 'top items'}.
2. STAFFING OPTIMIZATION: Use 'Peak Traffic' data to recommend better shift scheduling or 'Pre-order' promotions to spread the load.
3. MENU STRATEGY: Analyze the 'Top Category' vs others. If one category dominates, suggest seasonal specials to test new areas.
4. CUSTOMER RETENTION: If 'Loyalty Metric' is below 30%, suggest personalized "Come back" vouchers or a point-based loyalty program.
5. LOSS PREVENTION: Identify patterns of low sales or high cancellations (if visible in context) and suggest quality checks.

RESPONSE STYLE:
- Be personal: Use "We" and "Your restaurant."
- Be actionable: Instead of "Improve menu," say "Consider adding a combo deal featuring your best-selling ${popularItems[0]?.name || 'items'}."
- Use data: Refer specifically to the numbers provided above.
- Tone: Encouraging, data-driven, and supportive.
- Currency: Always use Indian Rupee (₹).
- Visuals: You are paired with a visualization engine. If the user asks for charts, mention you are preparing them.`;
};

// Call AI service with conversation context
export const callAIService = async (userQuestion, analyticsData, chatHistory = []) => {
  const systemContext = generateAISystemContext(analyticsData);
  // Format chat history for OpenAI (last 10 messages for context)
  const historyMessages = chatHistory.slice(-10).map(msg => ({
    role: msg.type === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  try {
    const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-advisor', {
      body: {
        messages: historyMessages,
        systemContext: systemContext,
        userQuestion: userQuestion
      }
    });

    if (aiError) throw aiError;

    // Generate visualization based on the question and data (Client side logic remains)
    const visualization = generateVisualization(userQuestion, analyticsData);

    return {
      textResponse: aiData.textResponse,
      visualization: visualization
    };

  } catch (error) {
    console.error('AI Service Error:', error);
    throw new Error('Failed to get AI response: ' + error.message);
  }
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