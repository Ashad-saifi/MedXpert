import React, { useState } from 'react';

/**
 * ConfirmModal Component
 * Confirmation dialog for destructive actions (deactivate doctor, cancel appointment, delete user).
 */
export default function ConfirmModal({ isOpen, title, message, confirmText = "Confirm", isDestructive = true, onConfirm, onCancel, requiresReason = false }) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-scaleUp">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
            isDestructive ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
          }`}>
            {isDestructive ? '⚠️' : 'ℹ️'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">Please review before proceeding</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4">{message}</p>

        {requiresReason && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Notes</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter administrative justification..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all ${
              isDestructive ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
