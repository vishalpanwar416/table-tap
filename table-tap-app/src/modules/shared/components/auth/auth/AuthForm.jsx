import React from 'react';

const AuthForm = ({ children, onSubmit }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
    </form>
  );
};

AuthForm.Input = ({ type = 'text', value, onChange, placeholder, required = false }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    required={required}
    className="w-full p-3 bg-white-700 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
  />
);

AuthForm.Button = ({ children, type = 'submit', disabled = false }) => (
  <button
    type={type}
    disabled={disabled}
    className="w-full bg-gray-500 text-white py-3 rounded-3xl font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
  >
    {children}
  </button>
);

export default AuthForm;