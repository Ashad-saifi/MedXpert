import React from 'react';

/**
 * EmptyState Component
 */
export default function EmptyState({ title = "No records found", message = "There are no entries matching your current filters or query.", actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/80 my-4 animate-fadeIn">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl text-slate-400 mb-3">
        📋
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
