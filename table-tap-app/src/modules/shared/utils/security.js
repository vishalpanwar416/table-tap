import CryptoJS from 'crypto-js';

// Security configuration
const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SPECIAL: true,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  ENCRYPTION_KEY: process.env.REACT_APP_ENCRYPTION_KEY
};

// Input sanitization
export const sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') return input;

  const {
    allowHtml = false,
    maxLength = 1000,
    allowedTags = [],
    allowedAttributes = {}
  } = options;

  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Basic XSS prevention
  if (!allowHtml) {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  return sanitized;
};

// Email validation
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(email) &&
    email.length <= 254 &&
    email.length >= 5 &&
    !email.includes('..') &&
    !email.startsWith('.') &&
    !email.endsWith('.');
};

// Strong password validation
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;

  const errors = [];

  if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`);
  }

  if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (SECURITY_CONFIG.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

// Calculate password strength
export const calculatePasswordStrength = (password) => {
  if (!password) return 0;

  let score = 0;

  // Length contribution
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  // Bonus for mixed case and numbers
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[a-zA-Z]/.test(password)) score += 1;

  return Math.min(score, 5); // Max score of 5
};

// Phone number validation
export const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return false;

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');

  // Check for valid length (10-15 digits)
  if (cleanPhone.length < 10 || cleanPhone.length > 15) return false;

  // Check for valid country codes (basic check)
  const validCountryCodes = ['1', '44', '91', '61', '86', '81', '49', '33', '39', '34'];
  if (cleanPhone.length > 10) {
    const countryCode = cleanPhone.substring(0, cleanPhone.length - 10);
    if (!validCountryCodes.includes(countryCode)) return false;
  }

  return true;
};

// Secure storage utilities
export const secureStorage = {
  // Encrypt data before storing
  encrypt: (data) => {
    try {
      // TODO: Ensure 'data' is sanitized before storage to prevent XSS payloads if displayed later.
      const jsonString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonString, SECURITY_CONFIG.ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  },

  // Decrypt data after retrieving
  decrypt: (encryptedData) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECURITY_CONFIG.ENCRYPTION_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  },

  // Secure set item
  setItem: (key, value) => {
    try {
      const encrypted = secureStorage.encrypt(value);
      if (encrypted) {
        localStorage.setItem(key, encrypted);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Secure storage set failed:', error);
      return false;
    }
  },

  // Secure get item
  getItem: (key) => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = secureStorage.decrypt(encrypted);
      return decrypted;
    } catch (error) {
      console.error('Secure storage get failed:', error);
      return null;
    }
  },

  // Secure remove item
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Secure storage remove failed:', error);
      return false;
    }
  },

  // Clear all secure storage
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Secure storage clear failed:', error);
      return false;
    }
  }
};

// Rate limiting utilities
export const rateLimiter = {
  attempts: new Map(),

  // Check if action is allowed
  isAllowed: (key, maxAttempts = SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS, windowMs = SECURITY_CONFIG.LOCKOUT_DURATION) => {
    const now = Date.now();
    const attempts = rateLimiter.attempts.get(key) || [];

    // Remove expired attempts
    const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

    if (validAttempts.length >= maxAttempts) {
      return false;
    }

    return true;
  },

  // Record an attempt
  recordAttempt: (key) => {
    const now = Date.now();
    const attempts = rateLimiter.attempts.get(key) || [];
    attempts.push(now);
    rateLimiter.attempts.set(key, attempts);
  },

  // Get remaining attempts
  getRemainingAttempts: (key, maxAttempts = SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS, windowMs = SECURITY_CONFIG.LOCKOUT_DURATION) => {
    const now = Date.now();
    const attempts = rateLimiter.attempts.get(key) || [];
    const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    return Math.max(0, maxAttempts - validAttempts.length);
  },

  // Clear attempts for a key
  clearAttempts: (key) => {
    rateLimiter.attempts.delete(key);
  }
};

// Session management
export const sessionManager = {
  // Check if session is valid
  isSessionValid: () => {
    const lastActivity = secureStorage.getItem('lastActivity');
    if (!lastActivity) return false;

    const now = Date.now();
    return (now - lastActivity) < SECURITY_CONFIG.SESSION_TIMEOUT;
  },

  // Update session activity
  updateActivity: () => {
    secureStorage.setItem('lastActivity', Date.now());
  },

  // Clear session
  clearSession: () => {
    secureStorage.removeItem('lastActivity');
    secureStorage.removeItem('userSession');
  },

  // Get session timeout
  getSessionTimeout: () => {
    return SECURITY_CONFIG.SESSION_TIMEOUT;
  }
};

// File upload validation
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  } = options;

  const errors = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
  }

  // Check for malicious file names
  const maliciousPatterns = /[<>:"/\\|?*\x00-\x1f]/;
  if (maliciousPatterns.test(file.name)) {
    errors.push('File name contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// CSRF token generation and validation
export const csrfProtection = {
  generateToken: () => {
    const token = CryptoJS.lib.WordArray.random(32).toString();
    secureStorage.setItem('csrfToken', token);
    return token;
  },

  getToken: () => {
    return secureStorage.getItem('csrfToken');
  },

  validateToken: (token) => {
    const storedToken = secureStorage.getItem('csrfToken');
    return token === storedToken;
  },

  refreshToken: () => {
    return csrfProtection.generateToken();
  }
};

// Export security configuration
export { SECURITY_CONFIG }; 