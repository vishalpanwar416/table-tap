import React, { useState, useEffect, useRef } from 'react';
import { Loader, TrendingUp, BarChart3, Star, User, Bot, Send, MessageSquare } from 'lucide-react';
import { getRestaurantAnalytics, generateAIPrompt, callAIService } from '../../api/aiAnalyticsService';

const AIAnalyticsChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const messagesEndRef = useRef(null);

  // Suggested questions for quick start
  const suggestedQuestions = [
    "What are my top-selling items and how can I promote them more?",
    "How is my restaurant performing compared to last month?",
    "What are the peak hours and how can I optimize staffing?",
    "Which menu categories generate the most revenue?",
    "How can I improve my average order value?",
    "What insights can you provide about my customer behavior?"
  ];

  useEffect(() => {
    loadAnalyticsData();
    // Add welcome message
    setMessages([{
      id: 'welcome',
      type: 'ai',
      content: "👋 Hi! I'm your restaurant analytics assistant. I can help you understand your business performance, identify trends, and provide actionable insights. What would you like to know about your restaurant?",
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadAnalyticsData = async () => {
    try {
      setLoadingAnalytics(true);
      const data = await getRestaurantAnalytics();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: "⚠️ I'm having trouble accessing your restaurant data. Please check your database connection and try again.",
        timestamp: new Date()
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

    try {
      if (!analyticsData) {
        throw new Error('Analytics data not available');
      }

      const prompt = generateAIPrompt(messageText, analyticsData);
      const aiResponse = await callAIService(prompt);

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I apologize, but I'm having difficulty processing your request right now. This could be due to API limitations or connectivity issues. Please try again later or contact support if the problem persists.",
        timestamp: new Date()
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

  if (loadingAnalytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your restaurant analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
        <Star className="h-6 w-6 mr-3" />
        <div>
          <h2 className="text-xl font-semibold">AI Restaurant Analytics</h2>
          <p className="text-orange-100 text-sm">Get insights about your restaurant performance</p>
        </div>
      </div>

      {/* Quick Stats */}
      {analyticsData && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-medium text-gray-700">Revenue</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                ₹{analyticsData.summary.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <BarChart3 className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm font-medium text-gray-700">Orders</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {analyticsData.summary.totalOrders}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MessageSquare className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-sm font-medium text-gray-700">Avg Order</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                ₹{analyticsData.summary.avgOrderValue.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <User className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-sm font-medium text-gray-700">Customers</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {analyticsData.summary.totalCustomers}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-orange-500 text-white ml-2' 
                  : 'bg-gray-200 text-gray-600 mr-2'
              }`}>
                {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-orange-100' : 'text-gray-500'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex-row">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 text-gray-600 mr-2 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Loader className="h-4 w-4 animate-spin text-orange-500" />
                  <p className="text-sm text-gray-600">Analyzing your data...</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 mb-3">💡 Try asking:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question)}
                className="text-left p-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-colors"
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your restaurant performance, trends, or get recommendations..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            rows="1"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Ask about sales trends, popular items, peak hours, or get business recommendations
        </p>
      </div>
    </div>
  );
};

export default AIAnalyticsChat;