import { useCallback, useRef, useEffect } from 'react';

// Custom hook for debouncing
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// Custom hook for throttling
export const useThrottle = (callback, delay) => {
  const lastCall = useRef(0);
  const lastCallTimer = useRef(null);

  return useCallback((...args) => {
    const now = Date.now();
    
    if (now - lastCall.current >= delay) {
      callback(...args);
      lastCall.current = now;
    } else {
      if (lastCallTimer.current) {
        clearTimeout(lastCallTimer.current);
      }
      lastCallTimer.current = setTimeout(() => {
        callback(...args);
        lastCall.current = Date.now();
      }, delay - (now - lastCall.current));
    }
  }, [callback, delay]);
};

// Custom hook for intersection observer
export const useIntersectionObserver = (callback, options = {}) => {
  const observerRef = useRef(null);
  const elementRef = useRef(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    }, options);

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);

  return elementRef;
};

// Custom hook for performance monitoring
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      const endTime = performance.now();
      console.log(`${componentName} rendered ${renderCount.current} times in ${(endTime - startTime.current).toFixed(2)}ms`);
    }
  });

  return renderCount.current;
};

// Custom hook for memory management
export const useMemoryCleanup = () => {
  useEffect(() => {
    return () => {
      // Cleanup function for memory management
      if (typeof window !== 'undefined' && window.gc) {
        window.gc();
      }
    };
  }, []);
}; 