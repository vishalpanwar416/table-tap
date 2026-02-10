// Example utility function tests
// This demonstrates how to write unit tests for utility functions

/**
 * Format currency to Indian Rupees
 */
export const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0.00';
    return `₹${amount.toFixed(2)}`;
};

/**
 * Calculate GST amount
 */
export const calculateGST = (amount, gstPercentage = 5) => {
    if (typeof amount !== 'number' || typeof gstPercentage !== 'number') return 0;
    return (amount * gstPercentage) / 100;
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhoneNumber = (phone) => {
    if (typeof phone !== 'string') return false;
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};
