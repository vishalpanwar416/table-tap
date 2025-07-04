// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
};

// Error messages
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Network connection failed. Please check your internet connection.',
  [ERROR_TYPES.AUTH]: 'Authentication failed. Please log in again.',
  [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
  [ERROR_TYPES.NOT_FOUND]: 'The requested item was not found.',
  [ERROR_TYPES.SERVER]: 'Server error occurred. Please try again later.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

// Error handler class
export class AppError extends Error {
  constructor(type, message, originalError = null) {
    super(message || ERROR_MESSAGES[type]);
    this.type = type;
    this.originalError = originalError;
    this.timestamp = new Date();
  }
}

// Error handler function
export const handleError = (error, context = '') => {
  let errorType = ERROR_TYPES.UNKNOWN;
  let userMessage = ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];

  // Determine error type
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    errorType = ERROR_TYPES.NETWORK;
    userMessage = ERROR_MESSAGES[ERROR_TYPES.NETWORK];
  } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
    errorType = ERROR_TYPES.AUTH;
    userMessage = ERROR_MESSAGES[ERROR_TYPES.AUTH];
  } else if (error.message.includes('validation') || error.message.includes('invalid')) {
    errorType = ERROR_TYPES.VALIDATION;
    userMessage = ERROR_MESSAGES[ERROR_TYPES.VALIDATION];
  } else if (error.message.includes('not found') || error.message.includes('404')) {
    errorType = ERROR_TYPES.NOT_FOUND;
    userMessage = ERROR_MESSAGES[ERROR_TYPES.NOT_FOUND];
  } else if (error.message.includes('server') || error.message.includes('500')) {
    errorType = ERROR_TYPES.SERVER;
    userMessage = ERROR_MESSAGES[ERROR_TYPES.SERVER];
  }

  // Log error for debugging
  console.error(`[${context}] Error:`, {
    type: errorType,
    message: userMessage,
    originalError: error,
    timestamp: new Date().toISOString()
  });

  return new AppError(errorType, userMessage, error);
};

// Async error wrapper
export const withErrorHandling = (asyncFunction, context = '') => {
  return async (...args) => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      throw handleError(error, context);
    }
  };
}; 