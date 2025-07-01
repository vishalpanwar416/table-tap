import { useState, useCallback } from "react";

/**
 * Virtual scrolling hook for large lists.
 * @param {Array} items - The full list of items.
 * @param {number} containerHeight - The height of the scroll container in px.
 * @param {number} itemHeight - The height of each item in px.
 */
export function useVirtualScrolling(items, containerHeight = 400, itemHeight = 280) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    containerRef,
    setContainerRef,
  };
}