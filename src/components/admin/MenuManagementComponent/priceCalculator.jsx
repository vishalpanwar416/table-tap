/**
 * Price Calculator Utility Functions
 * 
 * This module provides utility functions for calculating prices,
 * discounts, and formatting price displays.
 */

/**
 * Calculates the final price after applying discount
 * @param {number} originalPrice - Original price
 * @param {string} discountType - Type of discount ('percentage' or 'fixed')
 * @param {number} discountValue - Value of the discount
 * @returns {number} Final price after discount
 */
export const calculateDiscountedPrice = (originalPrice, discountType, discountValue) => {
  if (!discountType || !discountValue) return originalPrice;
  
  if (discountType === 'percentage') {
    return originalPrice - (originalPrice * discountValue / 100);
  } else if (discountType === 'fixed') {
    return Math.max(0, originalPrice - discountValue);
  }
  
  return originalPrice;
};

/**
 * Formats the price to include currency symbol and proper decimal places
 * @param {number} price - Price to format
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  return `₹${price.toFixed(2)}`;
};

/**
 * Gets the discount text for display
 * @param {string} discountType - Type of discount ('percentage' or 'fixed')
 * @param {number} discountValue - Value of the discount
 * @returns {string} Formatted discount text
 */
export const getDiscountText = (discountType, discountValue) => {
  if (!discountType || !discountValue) return '';
  
  return discountType === 'percentage' 
    ? `${discountValue}% off`
    : `₹${discountValue} off`;
};

/**
 * Calculates the discount amount
 * @param {number} originalPrice - Original price
 * @param {string} discountType - Type of discount ('percentage' or 'fixed')
 * @param {number} discountValue - Value of the discount
 * @returns {number} Discount amount
 */
export const calculateDiscountAmount = (originalPrice, discountType, discountValue) => {
  if (!discountType || !discountValue) return 0;
  
  if (discountType === 'percentage') {
    return originalPrice * discountValue / 100;
  } else if (discountType === 'fixed') {
    return Math.min(originalPrice, discountValue);
  }
  
  return 0;
};

/**
 * Validates if a discount is valid
 * @param {string} discountType - Type of discount ('percentage' or 'fixed')
 * @param {number} discountValue - Value of the discount
 * @param {number} originalPrice - Original price
 * @returns {boolean} Whether the discount is valid
 */
export const isValidDiscount = (discountType, discountValue, originalPrice) => {
  if (!discountType || !discountValue) return false;
  
  if (discountType === 'percentage') {
    return discountValue >= 0 && discountValue <= 100;
  } else if (discountType === 'fixed') {
    return discountValue >= 0 && discountValue <= originalPrice;
  }
  
  return false;
};