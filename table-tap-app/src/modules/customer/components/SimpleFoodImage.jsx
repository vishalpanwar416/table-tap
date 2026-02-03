import React, { useState } from 'react';
import { getFallbackImage } from '../../shared/utils/imageOptimization';

const SimpleFoodImage = ({ 
  src, 
  alt, 
  className, 
  category = null,
  itemName = '',
  placeholderColor = '#f3f4f6',
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setIsLoading(false);
      const fallback = getFallbackImage(category, itemName);
      setCurrentSrc(fallback);
    }
  };

  // Reset when src changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  return (
    <div className={`${className} relative overflow-hidden`}>
      {/* Loading state */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: placeholderColor }}
        >
          <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
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
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

export default SimpleFoodImage; 