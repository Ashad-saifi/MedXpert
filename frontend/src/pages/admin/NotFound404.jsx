import React from 'react';

/**
 * NotFound404 Component
 */
export default function NotFound404({ onGoHome }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl mb-4 text-blue-600">
        🩺
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">404 – Page Not Found</h1>
      <p className="text-xs text-slate-500 max-w-sm mb-6">
        The administrative view or resource you are looking for does not exist or has been moved.
      </p>
      <button
        onClick={onGoHome}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
      >
        Back to Admin Dashboard
      </button>
    </div>
  );
}
