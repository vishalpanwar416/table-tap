import React, { useEffect, useState, useMemo } from 'react';
import { Activity, Clock, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const PerformanceMonitor = ({ componentName, startTime }) => {
  const [metrics, setMetrics] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Show monitor after 2 seconds
    const timer = setTimeout(() => setIsVisible(true), 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const measurePerformance = () => {
      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      // Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            setMetrics(prev => ({
              ...prev,
              LCP: entry.startTime
            }));
          }
          if (entry.entryType === 'first-input') {
            setMetrics(prev => ({
              ...prev,
              FID: entry.processingStart - entry.startTime
            }));
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });

      // Memory usage
      if ('memory' in performance) {
        setMetrics(prev => ({
          ...prev,
          memory: {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          }
        }));
      }

      // Network information
      if ('connection' in navigator) {
        setMetrics(prev => ({
          ...prev,
          connection: {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt
          }
        }));
      }

      // Component load time
      if (startTime) {
        const loadTime = performance.now() - startTime;
        setMetrics(prev => ({
          ...prev,
          componentLoadTime: loadTime
        }));
      }

      return () => observer.disconnect();
    };

    measurePerformance();
  }, [startTime]);

  if (process.env.NODE_ENV !== 'development' || !isVisible) return null;

  return (
    <motion.div 
      className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs z-50 max-w-xs backdrop-blur-sm"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Performance Metrics</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        {metrics.LCP && (
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-green-400" />
            <span>LCP: {metrics.LCP.toFixed(0)}ms</span>
          </div>
        )}
        
        {metrics.FID && (
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-blue-400" />
            <span>FID: {metrics.FID.toFixed(0)}ms</span>
          </div>
        )}
        
        {metrics.componentLoadTime && (
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-yellow-400" />
            <span>Load: {metrics.componentLoadTime.toFixed(0)}ms</span>
          </div>
        )}
        
        {metrics.memory && (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-purple-400" />
            <span>Memory: {(metrics.memory.used / 1024 / 1024).toFixed(1)}MB</span>
          </div>
        )}
        
        {metrics.connection && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-400 rounded-full"></span>
            <span>Network: {metrics.connection.effectiveType}</span>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-700 text-xs text-gray-400">
        {componentName}
      </div>
    </motion.div>
  );
};

export default PerformanceMonitor; 