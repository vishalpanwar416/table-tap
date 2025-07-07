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
  IndianRupee,
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
  const [connectionStatus, setConnectionStatus] = useState({
    internet: true,
    lastChecked: new Date()
  });

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

  // Check internet connectivity
  const checkInternetConnection = () => {
    return navigator.onLine;
  };

  // Update connection status
  const updateConnectionStatus = () => {
    const internetStatus = checkInternetConnection();
    
    setConnectionStatus({
      internet: internetStatus,
      lastChecked: new Date()
    });
  };

  // Monitor connection status
  useEffect(() => {
    // Initial check
    updateConnectionStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      setConnectionStatus(prev => ({ ...prev, internet: true }));
    };

    const handleOffline = () => {
      setConnectionStatus(prev => ({ ...prev, internet: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get connection status text and color
  const getConnectionStatus = () => {
    if (!connectionStatus.internet) {
      return { text: 'Offline', color: 'red', dot: 'bg-red-500' };
    }
    return { text: 'Online', color: 'green', dot: 'bg-green-500' };
  };

  const connectionInfo = getConnectionStatus();

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
      
      // Create specific error messages based on error type
      let errorContent = "I apologize, but I'm having difficulty processing your request right now. Please try again later.";
      
      if (error.message.includes('quota exceeded')) {
        errorContent = "⚠️ OpenAI quota exceeded. Please check your billing and upgrade your plan at https://platform.openai.com/account/billing";
      } else if (error.message.includes('Rate limit exceeded')) {
        errorContent = "⏳ Rate limit exceeded. Please wait a moment and try again.";
      } else if (error.message.includes('Invalid API key')) {
        errorContent = "🔑 Invalid API key. Please check your OpenAI API key in the .env file.";
      } else if (error.message.includes('Access denied')) {
        errorContent = "🚫 Access denied. Please check your OpenAI account status and billing.";
      } else if (error.message.includes('API key not found')) {
        errorContent = "🔧 OpenAI API key not found. Please add REACT_APP_OPENAI_API_KEY to your .env file.";
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: errorContent,
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
    <div className={`bg-gradient-to-br from-${color}-50 to-white p-3 rounded-lg border border-${color}-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer`}>
      <div className="flex items-center justify-between mb-1">
        <div className={`p-1.5 rounded-md bg-${color}-100`}>
          {icon}
        </div>
        <ChevronRight className={`h-3 w-3 text-${color}-500`} />
      </div>
      <h3 className="text-xs font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-lg font-bold text-gray-900">{value}</p>
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
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white p-3 rounded-b-xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">AI Analytics</h1>
              <p className="text-orange-100 text-xs">Interactive insights with visualizations</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-md px-1.5 py-0.5 text-white placeholder-white/70 backdrop-blur-sm text-xs"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value} className="text-gray-800">
                  {option.label}
                </option>
              ))}
            </select>
            <button 
              onClick={loadAnalyticsData}
              className="p-1 bg-white/20 rounded-md hover:bg-white/30 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
            <button 
              onClick={exportChatHistory}
              className="p-1 bg-white/20 rounded-md hover:bg-white/30 transition-colors" 
              title="Export Chat"
            >
              <Download className="h-3 w-3" />
            </button>
            <button className="p-1 bg-white/20 rounded-md hover:bg-white/30 transition-colors" title="Share">
              <Share2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        {/* Stats Cards */}
        {analyticsData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {getInsightCard(
              "Total Revenue",
              `₹${analyticsData.summary.totalRevenue.toLocaleString()}`,
              <IndianRupee className="h-3 w-3 text-green-600" />,
              "green",
              analyticsData.summary.growthRate ? `+${analyticsData.summary.growthRate}% growth` : ''
            )}
            {getInsightCard(
              "Total Orders",
              analyticsData.summary.totalOrders.toLocaleString(),
              <ShoppingCart className="h-3 w-3 text-blue-600" />,
              "blue"
            )}
            {getInsightCard(
              "Avg Order Value",
              `₹${analyticsData.summary.avgOrderValue.toFixed(0)}`,
              <Target className="h-3 w-3 text-purple-600" />,
              "purple"
            )}
            {getInsightCard(
              "Customer Retention",
              analyticsData.summary.customerRetentionRate ? `${analyticsData.summary.customerRetentionRate}%` : 'N/A',
              <Users className="h-3 w-3 text-orange-600" />,
              "orange"
            )}
          </div>
        )}

        {/* Proactive Insights Carousel */}
        {proactiveInsights.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center space-x-1.5 mb-1.5">
              <Eye className="h-3 w-3 text-white" />
              <h3 className="text-xs font-semibold text-white">Proactive Insights</h3>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-2 pb-1">
                {proactiveInsights.map((insight, index) => (
                  <div key={index} className={`flex-shrink-0 bg-white/20 backdrop-blur-sm p-1.5 rounded-md border border-white/30 shadow-sm hover:shadow-md transition-all duration-300 min-w-[240px]`}>
                    <div className="flex items-start space-x-1.5">
                      <div className={`p-0.5 rounded bg-white/30 text-white`}>
                        {insight.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-xs">{insight.title}</h4>
                        <p className="text-white/90 text-xs mt-0.5 leading-tight">{insight.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-3">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Chat Area - Increased size */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 h-[580px] flex flex-col">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-orange-100 rounded-md">
                      <MessageSquare className="h-3 w-3 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-xs">AI Assistant</h3>
                      <p className="text-xs text-gray-600">Interactive visualizations</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <div className={`w-1.5 h-1.5 rounded-full ${connectionInfo.dot} ${connectionInfo.color === 'green' ? 'animate-pulse' : ''}`}></div>
                    <span>{connectionInfo.text}</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white ml-1.5' 
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 mr-1.5'
                      }`}>
                        {message.type === 'user' ? <User size={12} /> : <Bot size={12} />}
                      </div>
                      <div className={`rounded-lg px-2 py-1.5 shadow-sm ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                          : message.isError 
                            ? 'bg-red-50 border border-red-200 text-red-800'
                            : message.isWelcome
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-900'
                              : 'bg-gray-50 text-gray-800'
                      }`}>
                        <p className="text-xs whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        {message.visualization && renderVisualization(message.visualization)}
                        <p className={`text-xs mt-0.5 ${
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
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 mr-1.5 flex items-center justify-center">
                        <Bot size={12} />
                      </div>
                      <div className="bg-gray-50 rounded-lg px-2 py-1.5 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <p className="text-xs text-gray-600">Generating insights...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about trends, get visual charts, or request insights..."
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent resize-none bg-white shadow-sm text-xs"
                      rows="1"
                      disabled={isLoading}
                    />
                    <div className="absolute right-1.5 top-1.5 text-gray-400">
                      <Wand className="h-3 w-3" />
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-1.5 rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  💡 Ask about sales trends, popular items, peak hours
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar - Reduced size */}
          <div className="space-y-3">
            {/* Analytics Overview */}
            {analyticsData && (
              <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 text-white">
                  <div className="flex items-center space-x-1.5">
                    <Activity className="h-3 w-3" />
                    <h3 className="font-semibold text-xs">Analytics Overview</h3>
                  </div>
                </div>
                <div className="p-2 space-y-2">
                  {/* Peak Hours */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-1.5 rounded-md border border-green-200">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <Clock className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-800">Peak Hours</span>
                    </div>
                    <p className="text-xs font-bold text-green-900">{analyticsData.summary.peakHour}</p>
                    <p className="text-xs text-green-700">Busiest time</p>
                  </div>
                  {/* Popular Items */}
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-1.5 rounded-md border border-purple-200">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <PieChart className="h-3 w-3 text-purple-600" />
                      <span className="text-xs font-medium text-purple-800">Top Items</span>
                    </div>
                    <div className="space-y-0.5">
                      {analyticsData.popularItems.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-purple-700 truncate">{item.name}</span>
                          <span className="text-purple-900 font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Order Status */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-1.5 rounded-md border border-orange-200">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <BarChart3 className="h-3 w-3 text-orange-600" />
                      <span className="text-xs font-medium text-orange-800">Order Status</span>
                    </div>
                    <div className="space-y-0.5">
                      {Object.entries(analyticsData.ordersByStatus).slice(0, 3).map(([status, count]) => (
                        <div key={status} className="flex justify-between text-xs">
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
            <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-2 text-white">
                <div className="flex items-center space-x-1.5">
                  <Brain className="h-3 w-3" />
                  <h3 className="font-semibold text-xs">AI Capabilities</h3>
                </div>

              </div>
              <div className="p-2 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Performance Analysis</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Menu Optimization</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700">Customer Insights</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-700">Predictive Analytics</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Operational Recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Insights Footer */}
      {showQuickActions && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-purple-200 shadow-lg mt-4">
          <div className="max-w-7xl mx-auto px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <Zap className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-800">Quick Insights</h3>
                  <p className="text-xs text-gray-600">Tap any question to get instant insights</p>
                </div>
              </div>
              <button 
                onClick={() => setShowQuickActions(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Hide Quick Insights"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-3 pb-2">
                {Object.entries(insightCategories).map(([key, category]) => (
                  <div key={key} className="flex-shrink-0 min-w-0">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-purple-700 mb-2 px-2 py-1 bg-purple-100 rounded-full w-fit">
                      {category.icon}
                      <span>{category.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {category.questions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendMessage(question)}
                          className="flex-shrink-0 px-3 py-1.5 text-xs bg-white border border-purple-200 rounded-full hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                          disabled={isLoading}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalyticsChat;