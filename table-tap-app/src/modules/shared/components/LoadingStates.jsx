import React from 'react';
import { motion } from 'framer-motion';

// Skeleton loader for food items
export const FoodItemSkeleton = () => (
  <div className="bg-white rounded-xl p-4 animate-pulse">
    <div className="w-full aspect-square bg-gray-200 rounded-lg mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
);

// Skeleton loader for food grid
export const FoodGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <FoodItemSkeleton key={index} />
    ))}
  </div>
);

// Loading spinner
export const LoadingSpinner = ({ size = 'md', color = 'orange' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    orange: 'text-orange-500',
    white: 'text-white',
    gray: 'text-gray-500'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-${colorClasses[color]} ${sizeClasses[size]}`}></div>
  );
};

// Page loading state
export const PageLoading = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
    <LoadingSpinner size="lg" />
    <p className="mt-4 text-gray-600">{message}</p>
  </div>
);

// Error state with retry
export const ErrorState = ({ message, onRetry, showRetry = true }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
    <div className="text-red-500 text-6xl mb-4">⚠️</div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h3>
    <p className="text-gray-600 text-center mb-4">{message}</p>
    {showRetry && onRetry && (
      <button
        onClick={onRetry}
        className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

// Empty state
export const EmptyState = ({ message, icon = '🍽️' }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">No items found</h3>
    <p className="text-gray-600 text-center">{message}</p>
  </div>
); 