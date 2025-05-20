
/**
 * Calculates the discounted price based on the item's price and discount information
 * @param {number} price - Original price
 * @param {string} discountType - Type of discount ('Percentage' or 'Fixed')
 * @param {number} discountValue - Value of the discount
 * @returns {number} - Calculated price after discount
 */
export const calculateDiscountedPrice = (price, discountType, discountValue) => {
    if (!discountType || !discountValue) return price;
    
    if (discountType === 'Percentage') {
      return price - (price * (discountValue / 100));
    } else if (discountType === 'Fixed') {
      return Math.max(0, price - discountValue);
    }
    return price;
  };
  
  /**
   * Formats the price to include currency symbol and proper decimal places
   * @param {number} price - Price to format
   * @param {string} currencySymbol - Currency symbol to use (default: ₹)
   * @returns {string} - Formatted price string
   */
  export const formatPrice = (price, currencySymbol = '₹') => {
    return `${currencySymbol}${price.toFixed(2)}`;
  };
  
  /**
   * Gets discount display text based on discount type and value
   * @param {string} discountType - Type of discount ('Percentage' or 'Fixed')
   * @param {number} discountValue - Value of the discount
   * @param {string} currencySymbol - Currency symbol to use (default: ₹)
   * @returns {string} - Formatted discount text
   */
  export const getDiscountText = (discountType, discountValue, currencySymbol = '₹') => {
    if (!discountType || !discountValue) return '';
    
    return discountType === 'Percentage' 
      ? `${discountValue}% off` 
      : `${currencySymbol}${discountValue} off`;
  };