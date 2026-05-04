import { useState } from 'react';

// Validation rules
export const VALIDATION_RULES = {
  required: (value) => value && value.toString().trim().length > 0,
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => /^[0-9]{10}$/.test(value.replace(/\D/g, '')),
  minLength: (min) => (value) => value && value.length >= min,
  maxLength: (max) => (value) => value && value.length <= max,
  price: (value) => !isNaN(value) && parseFloat(value) >= 0,
  imageFile: (file) => {
    if (!file) return false;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  },
};

// Validation messages
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid 10-digit phone number',
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must be no more than ${max} characters`,
  price: 'Please enter a valid price',
  imageFile: 'Please select a valid image file (JPEG, PNG, WebP) under 5MB',
};

// Validation function
export const validate = (value, rules) => {
  const errors = [];

  rules.forEach((rule) => {
    if (typeof rule === 'string') {
      if (!VALIDATION_RULES[rule](value)) {
        errors.push(VALIDATION_MESSAGES[rule]);
      }
    } else if (typeof rule === 'function') {
      if (!rule(value)) {
        errors.push('Invalid value');
      }
    } else if (rule.type && VALIDATION_RULES[rule.type]) {
      const validator = VALIDATION_RULES[rule.type];
      const validatorFn = typeof validator === 'function' ? validator : validator(rule.value);
      if (!validatorFn(value)) {
        errors.push(rule.message || VALIDATION_MESSAGES[rule.type]);
      }
    }
  });

  return errors;
};

// Form validation hook
export const useFormValidation = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    if (validationSchema[name]) {
      const fieldErrors = validate(value, validationSchema[name]);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors,
      }));
      return fieldErrors;
    }
    return [];
  };

  const handleChange = (name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, values[name]);
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(validationSchema).forEach((field) => {
      const fieldErrors = validateField(field, values[field]);
      if (fieldErrors.length > 0) {
        newErrors[field] = fieldErrors;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setValues,
  };
};
