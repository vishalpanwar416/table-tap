import React, { useState, useEffect } from 'react';

// Image optimization utilities
export const optimizeImageUrl = (url, width = 300, quality = 80) => {
  if (!url) return '';
  
  // If it's already an optimized URL, return as is
  if (url.includes('w=') || url.includes('width=')) {
    return url;
  }
  
  // For external image services, add optimization parameters
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_${quality}/`);
  }
  
  if (url.includes('imgix.net')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&q=${quality}`;
  }
  
  // For local images, return as is (consider using a CDN)
  return url;
};

// Get fallback image based on food category - USING BASE64 ENCODED PLACEHOLDERS
export const getFallbackImage = (category, itemName = '') => {
  // Simple colored rectangles as fallback images (base64 encoded)
  const fallbackImages = {
    'Snacks': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRkY2QjM1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TbmFja3M8L3RleHQ+PC9zdmc+',
    'Main Course': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRkY2QjM1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYWluIENvdXJzZTwvdGV4dD48L3N2Zz4=',
    'Beverages': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRkY2QjM1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CZXZlcmFnZXM8L3RleHQ+PC9zdmc+',
    'Dessert': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRkY2QjM1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5EZXNzZXJ0PC90ZXh0Pjwvc3ZnPg==',
    'Offers': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRkY2QjM1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5PZmZlcnM8L3RleHQ+PC9zdmc+',
    'default': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRkY2QjM1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Gb29kIEl0ZW08L3RleHQ+PC9zdmc+'
  };
  
  return fallbackImages[category] || fallbackImages.default;
};

// Simple image component with fallback - NO RETRY BUTTON
export const FoodImageWithFallback = ({ 
  src, 
  alt, 
  className, 
  category = null,
  itemName = '',
  onError = null,
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      const fallback = getFallbackImage(category, itemName);
      setCurrentSrc(fallback);
      if (onError) onError(fallback);
    }
  };

  // Reset when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleError}
      {...props}
    />
  );
};

// Enhanced LazyImage component with fallback handling - NO RETRY BUTTON
export const LazyImage = ({ 
  src, 
  alt, 
  className, 
  placeholder = null,
  fallbackImage = null,
  category = null,
  onError = null,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder || getFallbackImage(category));
  const [imageRef, setImageRef] = useState();
  const [hasError, setHasError] = useState(false);

  // Determine fallback image
  const getFallback = () => {
    if (fallbackImage) return fallbackImage;
    if (category) return getFallbackImage(category);
    return getFallbackImage('default');
  };

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      const fallback = getFallback();
      setImageSrc(fallback);
      if (onError) onError(fallback);
    }
  };

  useEffect(() => {
    let observer;
    let didCancel = false;

    if (imageRef && imageSrc === (placeholder || getFallbackImage(category)) && src) {
      if (IntersectionObserver) {
        observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (
                !didCancel &&
                (entry.intersectionRatio > 0 || entry.isIntersecting)
              ) {
                setImageSrc(src);
                observer.unobserve(imageRef);
              }
            });
          },
          {
            threshold: 0.01,
            rootMargin: '75%',
          }
        );
        observer.observe(imageRef);
      } else {
        // Fallback for older browsers
        setImageSrc(src);
      }
    }
    return () => {
      didCancel = true;
      if (observer && observer.unobserve) {
        observer.unobserve(imageRef);
      }
    };
  }, [src, imageSrc, imageRef, category, placeholder]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleImageError}
      {...props}
    />
  );
};

// Process food items to ensure they have valid images
export const processFoodItems = (items) => {
  return items.map(item => ({
    ...item,
    image: item.image || getFallbackImage(item.category, item.name),
    hasValidImage: !!item.image
  }));
};

// Preload critical images
export const preloadImages = (imageUrls) => {
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

// Add this new component for progressive loading
export const ProgressiveImage = ({ 
  src, 
  alt, 
  className, 
  category = null,
  placeholderColor = '#f3f4f6',
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      const fallback = getFallbackImage(category);
      setCurrentSrc(fallback);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
    };
    img.onerror = () => {
      setHasError(true);
      const fallback = getFallbackImage(category);
      setCurrentSrc(fallback);
      setIsLoading(false);
    };
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, category]);

  return (
    <div className={`${className} relative overflow-hidden`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center animate-pulse"
          style={{ backgroundColor: placeholderColor }}
        >
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
        </div>
      )}
      
      {/* Image */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={`${className} transition-opacity duration-300`}
          style={{ 
            opacity: isLoading ? 0 : 1,
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
}; 