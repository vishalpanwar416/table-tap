import React, { useState } from 'react';
import { getFallbackImage } from '../../utils/imageOptimization';

const FoodImageWithFallback = ({ 
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
  React.useEffect(() => {
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

export default FoodImageWithFallback; 