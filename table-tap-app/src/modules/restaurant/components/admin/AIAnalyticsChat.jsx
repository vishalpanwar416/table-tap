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
import { getRestaurantAnalytics, callAIService, saveChatMessage, getChatHistory } from '../../api/aiAnalyticsService';
import { useAdminRestaurant } from '../../../shared/context/AdminRestaurantContext';
import { supabase } from '../../../shared/supabase';

const AIAnalyticsChat = ({ restaurantId: propRestaurantId }) => {
  const { userRestaurantId } = useAdminRestaurant();
  const activeRestaurantId = propRestaurantId || userRestaurantId;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [activeInsight, setActiveInsight] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [dateRange, setDateRange] = useState('last7days');
  const [proactiveInsights, setProactiveInsights] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState({
    internet: true,
    lastChecked: new Date()
  });
  const [userId, setUserId] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

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

    // Get current user ID
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();

    // Fetch chat history
    const fetchHistory = async () => {
      if (activeRestaurantId) {
        try {
          const history = await getChatHistory(activeRestaurantId);
          if (history && history.length > 0) {
            const formattedHistory = history.map(msg => ({
              id: msg.id,
              type: msg.role === 'ai' ? 'ai' : 'user',
              content: msg.content,
              visualization: msg.visualization,
              timestamp: new Date(msg.created_at)
            }));
            setMessages(formattedHistory);
            setShowQuickActions(false);
          } else {
            // Add enhanced welcome message only if no history
            setMessages([{
              id: 'welcome',
              type: 'ai',
              content: "👋 Welcome to your enhanced AI-powered restaurant analytics assistant! I can now show you visual charts, provide proactive insights, and help you make data-driven decisions with interactive visualizations. What would you like to explore today?",
              timestamp: new Date(),
              isWelcome: true
            }]);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      }
    };
    fetchHistory();
  }, [dateRange, userRestaurantId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadAnalyticsData = async () => {
    try {
      setLoadingAnalytics(true);
      // Pass dateRange and restaurantId if you have it
      const data = await getRestaurantAnalytics(dateRange, activeRestaurantId);
      setAnalyticsData(data);
      generateProactiveInsights(data);
    } catch (error) {
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

    // Save user message to database
    if (activeRestaurantId) {
      saveChatMessage({
        restaurantId: activeRestaurantId,
        userId: userId,
        role: 'user',
        content: messageText
      }).catch(err => console.error('Failed to save user message:', err));
    }

    try {
      // Call your real AI service - now passing the full messages history for context
      const aiResponse = await callAIService(messageText, analyticsData, messages);
      // aiResponse should be { textResponse, visualization }
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.textResponse,
        visualization: aiResponse.visualization,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to database
      if (activeRestaurantId) {
        saveChatMessage({
          restaurantId: activeRestaurantId,
          userId: userId,
          role: 'ai',
          content: aiResponse.textResponse,
          visualization: aiResponse.visualization
        }).catch(err => console.error('Failed to save AI message:', err));
      }
    } catch (error) {

      // Create specific error messages based on error type
      let errorContent = "I apologize, but I'm having difficulty processing your request right now. Please try again later.";
      const errorMsg = error.message || "";

      if (errorMsg.includes('quota exceeded')) {
        errorContent = "⚠️ OpenAI quota exceeded. Please check your billing and upgrade your plan at https://platform.openai.com/account/billing";
      } else if (errorMsg.includes('Rate limit exceeded')) {
        errorContent = "⏳ Rate limit exceeded. Please wait a moment and try again.";
      } else if (errorMsg.includes('Invalid API key')) {
        errorContent = "🔑 Invalid API key. Please check your OpenAI API key in the System Settings.";
      } else if (errorMsg.includes('Access denied')) {
        errorContent = "🚫 Access denied. Please check your OpenAI account status and billing.";
      } else if (errorMsg.includes('OpenAI API key missing') || errorMsg.includes('configuration error')) {
        errorContent = "🔧 OpenAI API key missing. Please go to Admin -> System Settings -> Diagnostics and use the 'Initialize AI Settings' fix, then add your key.";
      } else {
        // Show raw error if none of the above match, but keep it clean
        errorContent = `⚠️ AI Error: ${errorMsg.replace('Failed to get AI response: ', '')}`;
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
                  label={({ name, value }) => `${name}: ${value}`}
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
    <div className="flex flex-col h-full bg-transparent overflow-hidden gap-0">
      {/* Floating Top Utility Bar */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 px-2 py-2 md:px-6 md:py-3 flex flex-row items-center justify-between z-20 rounded-2xl mx-1 mt-1 gap-2 transition-all duration-300">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1 md:flex-none">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white border border-white/20 shadow-sm shrink-0">
            <Brain className="h-4 w-4 md:h-6 md:w-6" />
          </div>
          <div className="ml-1 md:ml-2 min-w-0 flex-1">
            <h2 className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-900 leading-tight truncate">Table-Tap Advisor</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${connectionInfo.dot} shrink-0`}></span>
              <span className="text-[8px] md:text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">{connectionInfo.text}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 md:gap-3 shrink-0">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 md:p-1 border border-slate-200">
            <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 ml-1 text-slate-500 shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none text-[10px] md:text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer py-0.5 pl-1 pr-5 md:pr-7 w-auto max-w-[90px] xs:max-w-none truncate"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-0.5 hidden md:block"></div>

          <div className="flex gap-1 shrink-0">
            {[
              { icon: <Download size={14} className="w-3 h-3 md:w-4 md:h-4" />, onClick: exportChatHistory, title: "Export" }
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.onClick}
                className="p-1 md:p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-slate-100 md:border-transparent bg-white md:bg-transparent"
                title={btn.title}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Professional Content Area */}
      <div className="flex-1 flex overflow-hidden gap-4">
        {/* Left: Chat Intelligence */}
        <div className="flex-1 flex flex-col bg-transparent relative">
          {/* Quick Stats Strip */}
          {analyticsData && (
            <div className="grid grid-cols-4 bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-2xl overflow-hidden mb-4 mx-1 shadow-sm">
              {[
                { label: 'Revenue', val: `₹${analyticsData.summary.totalRevenue.toLocaleString()}`, color: 'emerald' },
                { label: 'Orders', val: analyticsData.summary.totalOrders, color: 'blue' },
                { label: 'Avg Order', val: `₹${analyticsData.summary.avgOrderValue.toFixed(0)}`, color: 'amber' },
                { label: 'Peak Hour', val: analyticsData.summary.peakHour || 'N/A', color: 'orange' }
              ].map((s, i) => (
                <div
                  key={i}
                  className={`
                    px-1 py-2 md:px-6 md:py-3 
                    text-center md:text-left
                    border-slate-100 
                    border-r last:border-r-0
                  `}
                >
                  <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 md:mb-1.5 truncate">{s.label}</p>
                  <p className={`text-[10px] sm:text-xs md:text-base font-bold text-${s.color}-600 truncate px-0.5`}>{s.val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-2 md:px-4 py-2 space-y-4 md:space-y-6 scroll-smooth scrollbar-hide">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[85%] lg:max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                  <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center mt-1 ${message.type === 'user' ? 'bg-slate-900 text-white' : 'bg-amber-600 text-white'
                    }`}>
                    {message.type === 'user' ? <User size={18} /> : <Brain size={18} />}
                  </div>

                  <div className={`flex flex-col gap-2 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-3 py-2.5 md:px-5 md:py-3.5 border ${message.type === 'user'
                      ? 'bg-slate-900 border-slate-800 text-slate-50 rounded-tr-none'
                      : message.isError
                        ? 'bg-red-50 border-red-100 text-red-900'
                        : 'bg-white/90 backdrop-blur-md border-slate-200/50 text-slate-800 rounded-tl-none'
                      }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      {message.visualization && (
                        <div className="mt-4 p-4 bg-white/50 rounded-xl border border-slate-100/50 backdrop-blur-sm">
                          {renderVisualization(message.visualization)}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter px-1">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-xl bg-amber-100/50 backdrop-blur-sm flex items-center justify-center shadow-inner">
                    <Loader className="animate-spin text-amber-600" size={18} />
                  </div>
                  <div className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-2xl rounded-tl-none px-5 py-3.5">
                    <div className="flex gap-2 h-4 items-center">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Ultra-Modern Input Area Wrapper */}
          <div className="w-full mt-auto relative z-30 px-2 md:px-4 pb-4 md:pb-2">
            {/* Wider Container for Growth Tools */}
            <div className="max-w-6xl mx-auto relative">
              {/* Floating Dynamic Quick Queries */}
              <div className={`relative transition-all duration-300 transform ${(inputMessage.trim() || isInputFocused) ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
                <div className="absolute bottom-full left-0 right-0 mb-2 md:mb-6 flex overflow-x-auto pb-2 md:pb-4 scrollbar-hide px-2">
                  <div className="flex bg-slate-900/90 backdrop-blur-xl border border-white/10 p-1.5 md:p-2 rounded-[2rem] items-center gap-2 md:gap-3 w-max mx-auto min-w-min px-3 md:px-4">
                    <div className="flex items-center gap-2 px-3 border-r border-white/10 mr-2 flex-shrink-0">
                      <Brain size={14} className="text-amber-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-none">Growth Tools</span>
                    </div>
                    <div className="flex items-center gap-2 flex-nowrap">
                      {[
                        "Maximize my Revenue",
                        "Menu Growth Strategy",
                        "Promotion Timing",
                        "Retention Tactics",
                        "Customer Spending",
                        "Peak Staffing",
                        "Low Performers",
                        "Inventory Reorder"
                      ].map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(s)}
                          className="px-4 py-1.5 bg-white/10 text-white hover:bg-amber-600 rounded-full text-[11px] font-bold transition-all shadow-lg whitespace-nowrap active:scale-95 border border-white/5"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Standard Container for Input Bar */}
            <div className="max-w-4xl mx-auto">

              <div className={`flex items-center gap-1 md:gap-2 p-1 md:p-1.5 bg-white/80 backdrop-blur-2xl border border-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] rounded-[2.5rem] transition-all duration-300 ${isInputFocused ? 'shadow-[0_25px_60px_-15px_rgba(79,70,229,0.2)] ring-4 ring-amber-500/5 -translate-y-0.5' : ''}`}>
                <div className="flex-1 relative ml-2">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Table-Tap Advisor anything..."
                    className="w-full bg-transparent pl-3 md:pl-4 pr-10 md:pr-12 py-2 md:py-2.5 focus:outline-none transition-all text-sm placeholder:text-slate-400 resize-none min-h-[42px] leading-tight"
                    rows="1"
                    disabled={isLoading}
                  />

                  {/* Shortcut Hint */}
                  <div className={`absolute right-4 bottom-1.5 transition-opacity duration-300 ${isInputFocused && !inputMessage.trim() ? 'opacity-40' : 'opacity-0'}`}>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Enter</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleSendMessage();
                    if (textareaRef.current) textareaRef.current.style.height = 'auto';
                  }}
                  disabled={!inputMessage.trim() || isLoading}
                  className={`flex-shrink-0 p-2 md:p-2.5 rounded-full transition-all shadow-xl active:scale-90 disabled:opacity-0 disabled:scale-75 ${inputMessage.trim() ? 'bg-amber-600 hover:bg-slate-900 text-white scale-100' : 'bg-slate-100 text-slate-400'
                    }`}
                >
                  <Send size={16} className={inputMessage.trim() ? 'animate-in fade-in zoom-in duration-300' : ''} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsChat;