/**
 * Utility functions for restaurant selection checks
 */

// Check if user needs to select a restaurant
export const needsRestaurantSelection = () => {
  // Check URL parameters first
  const urlParams = new URLSearchParams(window.location.search);
  const urlRestaurantId = urlParams.get('restaurant');
  const urlTableNumber = urlParams.get('table');
  
  if (urlRestaurantId && urlTableNumber) {
    return false; // Has restaurant from URL
  }
  
  // Check localStorage first (for persistence)
  const localRestaurantId = localStorage.getItem('restaurantId');
  const localTableNumber = localStorage.getItem('tableNumber');
  
  if (localRestaurantId && localTableNumber) {
    return false; // Has restaurant from localStorage
  }
  
  // Check sessionStorage as fallback
  const sessionRestaurantId = sessionStorage.getItem('restaurantId');
  const sessionTableNumber = sessionStorage.getItem('tableNumber');
  
  if (sessionRestaurantId && sessionTableNumber) {
    return false; // Has restaurant from sessionStorage
  }
  
  return true; // Needs restaurant selection
};

// Check if user has a valid restaurant selection (for direct homepage access)
export const hasValidRestaurantSelection = () => {
  const storedSelection = getStoredRestaurantSelection();
  return storedSelection && storedSelection.restaurantId && storedSelection.tableNumber;
};

// Store restaurant selection
export const storeRestaurantSelection = (restaurantId, tableNumber) => {
  // Store in localStorage for persistence across sessions
  localStorage.setItem('restaurantId', restaurantId);
  localStorage.setItem('tableNumber', tableNumber);
  
  // Also store in sessionStorage for current session
  sessionStorage.setItem('restaurantId', restaurantId);
  sessionStorage.setItem('tableNumber', tableNumber);
};

// Clear restaurant selection
export const clearRestaurantSelection = () => {
  localStorage.removeItem('restaurantId');
  localStorage.removeItem('tableNumber');
  sessionStorage.removeItem('restaurantId');
  sessionStorage.removeItem('tableNumber');
};

// Get stored restaurant selection
export const getStoredRestaurantSelection = () => {
  // Check URL parameters first
  const urlParams = new URLSearchParams(window.location.search);
  const urlRestaurantId = urlParams.get('restaurant');
  const urlTableNumber = urlParams.get('table');
  
  if (urlRestaurantId && urlTableNumber) {
    return { restaurantId: urlRestaurantId, tableNumber: urlTableNumber };
  }
  
  // Check localStorage first (for persistence)
  const localRestaurantId = localStorage.getItem('restaurantId');
  const localTableNumber = localStorage.getItem('tableNumber');
  
  if (localRestaurantId && localTableNumber) {
    return { restaurantId: localRestaurantId, tableNumber: localTableNumber };
  }
  
  // Check sessionStorage as fallback
  const sessionRestaurantId = sessionStorage.getItem('restaurantId');
  const sessionTableNumber = sessionStorage.getItem('tableNumber');
  
  if (sessionRestaurantId && sessionTableNumber) {
    return { restaurantId: sessionRestaurantId, tableNumber: sessionTableNumber };
  }
  
  return null;
}; 