import React, { useState, useEffect } from 'react';
import { sanitizeInput } from '../utils/security';

const SecureInput = ({
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  className = '',
  maxLength = 1000,
  allowHtml = false,
  validation = null,
  error,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const [validationError, setValidationError] = useState('');
  const [isValid, setIsValid] = useState(true);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  // Handle input change with sanitization
  const handleChange = (e) => {
    const rawValue = e.target.value;
    
    // Sanitize input
    const sanitizedValue = sanitizeInput(rawValue, {
      allowHtml,
      maxLength
    });
    
    setInternalValue(sanitizedValue);
    
    // Call parent onChange with sanitized value
    if (onChange) {
      e.target.value = sanitizedValue;
      onChange(e);
    }
    
    // Clear validation error on change
    if (validationError) {
      setValidationError('');
      setIsValid(true);
    }
  };

  // Handle blur with validation
  const handleBlur = (e) => {
    if (validation) {
      const validationResult = validation(internalValue);
      if (validationResult && !validationResult.isValid) {
        setValidationError(validationResult.error || 'Invalid input');
        setIsValid(false);
      } else {
        setValidationError('');
        setIsValid(true);
      }
    }
    
    if (onBlur) {
      onBlur(e);
    }
  };

  // Determine if we should show an error
  const showError = error || validationError;
  const inputClassName = `
    w-full p-3 bg-white-700 rounded-xl text-black placeholder-gray-400 
    focus:outline-none focus:ring-2 transition-all duration-200
    ${showError 
      ? 'focus:ring-red-500 border-red-300' 
      : 'focus:ring-orange-500 border-gray-300'
    }
    ${className}
  `.trim();

  return (
    <div className="relative">
      <input
        type={type}
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        className={inputClassName}
        maxLength={maxLength}
        {...props}
      />
      
      {/* Error message */}
      {showError && (
        <div className="mt-1 text-red-500 text-sm flex items-center">
          <span className="mr-1">⚠</span>
          {showError}
        </div>
      )}
      
      {/* Character count */}
      {maxLength && (
        <div className="mt-1 text-xs text-gray-500 text-right">
          {internalValue.length}/{maxLength}
        </div>
      )}
    </div>
  );
};

export default SecureInput; 