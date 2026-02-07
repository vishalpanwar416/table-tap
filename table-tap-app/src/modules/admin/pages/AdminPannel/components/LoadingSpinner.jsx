import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-4 text-center font-spartan">
      <div className="relative mb-4">
        <div className="w-12 h-12 border-4 border-blue-100 rounded-full animate-pulse"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-900 font-bold text-lg leading-tight">Updating Dashboard</p>
      <p className="text-sm text-gray-500 mt-1">Fetching latest data for you...</p>
    </div>
  );
};

export default LoadingSpinner; 