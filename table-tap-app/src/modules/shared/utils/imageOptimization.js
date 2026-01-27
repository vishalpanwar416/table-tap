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

// Enhanced image optimization for uploads
export const optimizeImageForUpload = async (file, options = {}) => {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.8,
    format = 'webp',
    maxFileSize = 500 * 1024 // 500KB
  } = options;

  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    // Check if file is already small enough
    if (file.size <= maxFileSize && file.type === 'image/webp') {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to desired format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to process image'));
              return;
            }

            // Create new file with optimized data
            const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
              type: 'image/webp',
              lastModified: Date.now()
            });

            resolve(optimizedFile);
          },
          'image/webp',
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

// Create multiple image sizes for responsive design
export const createImageVariants = async (file) => {
  const sizes = [
    { width: 300, height: 200, suffix: 'thumb' },
    { width: 600, height: 400, suffix: 'medium' },
    { width: 800, height: 600, suffix: 'large' }
  ];

  const variants = {};

  for (const size of sizes) {
    try {
      const optimized = await optimizeImageForUpload(file, {
        maxWidth: size.width,
        maxHeight: size.height,
        quality: 0.8
      });
      
      variants[size.suffix] = optimized;
    } catch (error) {
    }
  }

  return variants;
};

// Validate image file
export const validateImageFile = (file) => {
  const errors = [];
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('Image file size must be less than 5MB');
  }

  // Check dimensions
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width < 100 || img.height < 100) {
        errors.push('Image must be at least 100x100 pixels');
      }
      if (img.width > 4000 || img.height > 4000) {
        errors.push('Image dimensions must be less than 4000x4000 pixels');
      }
      resolve({ isValid: errors.length === 0, errors });
    };
    img.onerror = () => {
      errors.push('Invalid image file');
      resolve({ isValid: false, errors });
    };
    img.src = URL.createObjectURL(file);
  });
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
  }, [src, category]);

  return (
    <div className={`${className} relative overflow-hidden`}>
      {/* Loading state */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center animate-pulse"
          style={{ backgroundColor: placeholderColor }}
        >
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
        </div>
      )}
      
      {/* Image */}
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
    </div>
  );
};

// Enhanced image upload hook
export const useImageUpload = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processAndUpload = async (file, uploadFunction, options = {}) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      // Validate file
      const validation = await validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      setProgress(20);

      // Optimize image
      const optimizedFile = await optimizeImageForUpload(file, options);
      setProgress(60);

      // Upload optimized file
      const result = await uploadFunction(optimizedFile);
      setProgress(100);

      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return {
    processAndUpload,
    isProcessing,
    progress
  };
}; 

// Optimize an image file for profile avatars (resize and compress)
// Usage: optimizeProfileImage(file, { maxSize: 256, quality: 0.7 })
export async function optimizeProfileImage(file, { maxSize = 256, quality = 0.7 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Calculate new size
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        // Draw to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG (or PNG if transparent)
        let dataUrl;
        if (file.type === 'image/png' && hasAlpha(img)) {
          dataUrl = canvas.toDataURL('image/png', quality);
        } else {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper: check if image has alpha channel (transparency)
function hasAlpha(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
} 