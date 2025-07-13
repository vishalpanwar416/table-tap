// Utility to handle browser extension interference
export const handleExtensionError = (error) => {
  // Check if error is related to browser extension
  if (error.message && error.message.includes('Extension context invalidated')) {
    console.warn('Browser extension error detected - this is likely harmless');
    return true; // Error was handled
  }
  
  // Check if error is related to localStorage/sessionStorage access
  if (error.message && error.message.includes('QuotaExceededError')) {
    console.warn('Storage quota exceeded - clearing old data');
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (clearError) {
      console.error('Failed to clear storage:', clearError);
    }
    return true; // Error was handled
  }
  
  return false; // Error was not handled
};

// Wrapper for async operations that might be affected by extensions
export const safeAsyncOperation = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    if (handleExtensionError(error)) {
      // Retry the operation once if it was an extension error
      try {
        return await operation();
      } catch (retryError) {
        console.error('Operation failed on retry:', retryError);
        throw retryError;
      }
    }
    throw error;
  }
}; 