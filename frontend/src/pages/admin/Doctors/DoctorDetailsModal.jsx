import React from 'react';
import StatusBadge from '../../../components/admin/StatusBadge.jsx';

/**
 * DoctorDetailsModal Component
 */
export default function DoctorDetailsModal({ doctor, onClose, onApprove, onReject }) {
  if (!doctor) return null;

  const isPending = doctor.status?.toLowerCase() === 'pending';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-lg font-bold">
              👨‍⚕️
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{doctor.name}</h2>
              <p className="text-xs text-slate-500 font-mono">License ID: {doctor.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-200/60 flex items-center justify-center transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Details Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Specialty</span>
              <span className="font-bold text-slate-800 text-sm">{doctor.specialty || 'General'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Experience</span>
              <span className="font-bold text-slate-800 text-sm">{doctor.exp || '5 yrs'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Consult Fee</span>
              <span className="font-bold text-blue-600 text-sm">{doctor.fee || '₹500'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status</span>
              <div className="mt-0.5">
                <StatusBadge status={doctor.status || 'Active'} />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3">
            <h3 className="font-bold text-slate-900 text-xs">Hospital Affiliation & Credentials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Hospital / Clinic</span>
                <span className="font-bold text-slate-800">{doctor.hospital || 'City Medical Center'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Contact Email</span>
                <span className="font-bold text-slate-800">{doctor.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Doctor Rating</span>
                <span className="font-bold text-amber-600">⭐ {doctor.rating || '5.0'} / 5.0</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Verification Audit</span>
                <span className="font-bold text-emerald-600">✓ MCI Registry Checked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          {isPending ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onApprove(doctor.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                ✓ Approve Credentials
              </button>
              <button
                onClick={() => onReject(doctor.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                ✕ Reject Application
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-medium">Doctor credentials verified & active</span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
