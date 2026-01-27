import { useEffect } from 'react';

export const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (isLocked) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Cleanup function
      return () => {
        // Re-enable scrolling and restore position
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
};

// Hook for multiple overlays - prevents conflicts
export const useMultiScrollLock = (overlays) => {
  useEffect(() => {
    const hasAnyOverlayOpen = Object.values(overlays).some(isOpen => isOpen);
    
    if (hasAnyOverlayOpen) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Cleanup function
      return () => {
        // Re-enable scrolling and restore position
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [overlays]);
}; 