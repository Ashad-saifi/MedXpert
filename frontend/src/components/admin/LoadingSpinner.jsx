import React from 'react';

/**
 * LoadingSpinner Component
 */
export default function LoadingSpinner({ message = "Loading administrative data..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 animate-fadeIn">
      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}
