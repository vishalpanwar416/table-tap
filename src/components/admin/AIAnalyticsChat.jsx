import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader, 
  TrendingUp, 
  BarChart3, 
  Star, 
  User, 
  Bot, 
  Send, 
  MessageSquare, 
  Brain,
  Wand,
  Lightbulb,
  Target,
  Clock,
  DollarSign,
  ShoppingCart,
  ChevronRight,
  RefreshCw,
  Download,
  Share2,
  BookOpen,
  Zap,
  PieChart,
  Activity,
  Calendar,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Users,
  Eye,
  Award
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { getRestaurantAnalytics, callAIService } from '../../api/aiAnalyticsService';

const AIAnalyticsChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [activeInsight, setActiveInsight] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef(null);
  const [dateRange, setDateRange] = useState('last7days');
  const [proactiveInsights, setProactiveInsights] = useState([]);

  // Enhanced suggested questions with categories
  const insightCategories = {
    performance: {
      title: "Performance Insights",
      icon: <TrendingUp className="h-4 w-4" />,
      questions: [
        "Show me the revenue trend for this week",
        "What are my growth patterns compared to last period?",
        "Which days perform best and why?"
      ]
    },
    menu: {
      title: "Menu Optimization",
      icon: <BookOpen className="h-4 w-4" />,
      questions: [
        "Show me my top-selling items with trends",
        "Which menu categories generate the most revenue?",
        "What items should I promote more?"
      ]
    },
    customers: {
      title: "Customer Behavior",
      icon: <User className="h-4 w-4" />,
      questions: [
        "Show me customer segmentation analysis",
        "What are the peak ordering patterns?",
        "How can I improve customer retention?"
      ]
    },
    operations: {
      title: "Operations & Efficiency",
      icon: <Zap className="h-4 w-4" />,
      questions: [
        "Show me hourly order distribution",
        "What are the optimal staffing recommendations?",
        "How can I reduce order cancellations?"
      ]
    }
  };

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'thismonth', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Proactive insights generator (placeholder, update to use real analyticsData if possible)
  const generateProactiveInsights = (data) => {
    if (!data) return setProactiveInsights([]);
    // Example: Use real data to generate insights
    const insights = [];
    if (data.summary?.growthRate > 0) {
      insights.push({
        type: 'positive',
        icon: <TrendingUp className="h-4 w-4" />,
        title: 'Revenue Growth',
        message: `Your revenue is up ${data.summary.growthRate}% compared to last period!`,
        color: 'green'
      });
    }
    if (data.popularItems?.length) {
      const downItem = data.popularItems.find(item => item.trend === 'down');
      if (downItem) {
        insights.push({
          type: 'alert',
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'Menu Alert',
          message: `${downItem.name} sales are trending down. Consider promotional offers or recipe improvements.`,
          color: 'orange'
        });
      }
    }
    if (data.summary?.peakHour) {
      insights.push({
        type: 'opportunity',
        icon: <Award className="h-4 w-4" />,
        title: 'Peak Hour Opportunity',
        message: `${data.summary.peakHour} is your busiest hour. Consider expanding delivery capacity during this time.`,
        color: 'blue'
      });
    }
    setProactiveInsights(insights);
  };

  useEffect(() => {
    loadAnalyticsData();
    // Add enhanced welcome message
    setMessages([{
      id: 'welcome',
      type: 'ai',
      content: "👋 Welcome to your enhanced AI-powered restaurant analytics assistant! I can now show you visual charts, provide proactive insights, and help you make data-driven decisions with interactive visualizations. What would you like to explore today?",
      timestamp: new Date(),
      isWelcome: true
    }]);
  }, [dateRange]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadAnalyticsData = async () => {
    try {
      setLoadingAnalytics(true);
      // Pass dateRange and restaurantId if you have it
      const data = await getRestaurantAnalytics(dateRange /*, restaurantId */);
      setAnalyticsData(data);
      generateProactiveInsights(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: "⚠️ I'm having trouble accessing your restaurant data. Please check your connection and try again.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      // Call your real AI service
      const aiResponse = await callAIService(messageText, analyticsData);
      // aiResponse should be { textResponse, visualization }
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.textResponse,
        visualization: aiResponse.visualization,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I apologize, but I'm having difficulty processing your request right now. Please try again later.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInsightCard = (title, value, icon, color, subtitle = '') => (
    <div className={`bg-gradient-to-br from-${color}-50 to-white p-4 rounded-xl border border-${color}-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          {icon}
        </div>
        <ChevronRight className={`h-4 w-4 text-${color}-500`} />
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  const renderVisualization = (viz) => {
    if (!viz) return null;
    const colors = ['#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    switch (viz.type) {
      case 'line':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">{viz.title}</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={viz.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={viz.xKey} />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                <Line type="monotone" dataKey={viz.yKey} stroke="#FF6B35" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      case 'bar':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">{viz.title}</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={viz.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={viz.xKey} />
                <YAxis />
                <Tooltip />
                <Bar dataKey={viz.yKey} fill="#4ECDC4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case 'pie':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">{viz.title}</h4>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPieChart>
                <Pie
                  data={viz.data}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}`}
                >
                  {viz.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        );
      default:
        return null;
    }
  };

  const exportChatHistory = () => {
    const chatContent = messages.map(msg => 
      `[${formatTimestamp(msg.timestamp)}] ${msg.type.toUpperCase()}: ${msg.content}`
    ).join('\n\n');
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restaurant-analytics-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loadingAnalytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative">
            <Brain className="animate-pulse h-12 w-12 text-orange-500 mx-auto mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader className="animate-spin h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Analyzing your restaurant data...</p>
          <p className="text-sm text-gray-500 mt-2">Loading enhanced visualizations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header with Date Range */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Enhanced AI Analytics</h1>
              <p className="text-orange-100">Interactive insights with visualizations</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/70 backdrop-blur-sm"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value} className="text-gray-800">
                  {option.label}
                </option>
              ))}
            </select>
            <button 
              onClick={loadAnalyticsData}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button 
              onClick={exportChatHistory}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors" 
              title="Export Chat"
            >
              <Download className="h-5 w-5" />
            </button>
            <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors" title="Share">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* Stats Cards */}
        {analyticsData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getInsightCard(
              "Total Revenue",
              `₹${analyticsData.summary.totalRevenue.toLocaleString()}`,
              <DollarSign className="h-5 w-5 text-green-600" />,
              "green",
              `+${analyticsData.summary.growthRate}% growth`
            )}
            {getInsightCard(
              "Total Orders",
              analyticsData.summary.totalOrders.toLocaleString(),
              <ShoppingCart className="h-5 w-5 text-blue-600" />,
              "blue"
            )}
            {getInsightCard(
              "Avg Order Value",
              `₹${analyticsData.summary.avgOrderValue.toFixed(0)}`,
              <Target className="h-5 w-5 text-purple-600" />,
              "purple"
            )}
            {getInsightCard(
              "Customer Retention",
              `${analyticsData.summary.customerRetentionRate}%`,
              <Users className="h-5 w-5 text-orange-600" />,
              "orange"
            )}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Proactive Insights */}
        {proactiveInsights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Proactive Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {proactiveInsights.map((insight, index) => (
                <div key={index} className={`bg-gradient-to-r from-${insight.color}-50 to-white p-4 rounded-xl border border-${insight.color}-200 shadow-sm`}>
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-${insight.color}-100 text-${insight.color}-600`}>
                      {insight.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{insight.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Enhanced AI Assistant</h3>
                      <p className="text-sm text-gray-600">Now with interactive visualizations</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>AI Online</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white ml-3' 
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 mr-3'
                      }`}>
                        {message.type === 'user' ? <User size={20} /> : <Bot size={20} />}
                      </div>
                      <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                          : message.isError 
                            ? 'bg-red-50 border border-red-200 text-red-800'
                            : message.isWelcome
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-900'
                              : 'bg-gray-50 text-gray-800'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        {message.visualization && renderVisualization(message.visualization)}
                        <p className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-orange-100' : 'text-gray-500'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex-row">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 mr-3 flex items-center justify-center">
                        <Bot size={20} />
                      </div>
                      <div className="bg-gray-50 rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <p className="text-sm text-gray-600">Generating insights & charts...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about trends, get visual charts, or request insights..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-white shadow-sm"
                      rows="1"
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-3 text-gray-400">
                      <Wand className="h-4 w-4" />
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded-xl hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Send size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  💡 Ask about sales trends, popular items, peak hours, or get business recommendations
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar with Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {showQuickActions && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <h3 className="font-semibold">Quick Insights</h3>
                  </div>
                  <p className="text-purple-100 text-sm mt-1">Get instant answers to common questions</p>
                </div>
                <div className="p-4 space-y-3">
                  {Object.entries(insightCategories).map(([key, category]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        {category.icon}
                        <span>{category.title}</span>
                      </div>
                      <div className="space-y-2">
                        {category.questions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleSendMessage(question)}
                            className="w-full text-left p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all duration-200 group"
                            disabled={isLoading}
                          >
                            <div className="flex items-start justify-between">
                              <span className="text-gray-700 group-hover:text-orange-700">{question}</span>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Overview */}
            {analyticsData && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <h3 className="font-semibold">Analytics Overview</h3>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {/* Peak Hours */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Peak Hours</span>
                    </div>
                    <p className="text-lg font-bold text-green-900">{analyticsData.summary.peakHour}</p>
                    <p className="text-xs text-green-700">Busiest time of day</p>
                  </div>
                  {/* Popular Items */}
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <PieChart className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Top Items</span>
                    </div>
                    <div className="space-y-1">
                      {analyticsData.popularItems.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-purple-700 truncate">{item.name}</span>
                          <span className="text-purple-900 font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Order Status */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Order Status</span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(analyticsData.ordersByStatus).slice(0, 3).map(([status, count]) => (
                        <div key={status} className="flex justify-between text-sm">
                          <span className="text-orange-700 capitalize">{status}</span>
                          <span className="text-orange-900 font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Capabilities */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4 text-white">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <h3 className="font-semibold">AI Capabilities</h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Performance Analysis</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Menu Optimization</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700">Customer Insights</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-700">Predictive Analytics</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Operational Recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsChat;