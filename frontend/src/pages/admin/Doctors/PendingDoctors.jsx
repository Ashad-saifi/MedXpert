import React, { useState, useEffect } from 'react';
import StatusBadge from '../../../components/admin/StatusBadge.jsx';
import LoadingSpinner from '../../../components/admin/LoadingSpinner.jsx';
import EmptyState from '../../../components/admin/EmptyState.jsx';
import DoctorDetailsModal from './DoctorDetailsModal.jsx';
import ConfirmModal from '../../../components/admin/ConfirmModal.jsx';
import { apiFetch } from '../../../utils/apiClient.js';

/**
 * PendingDoctors Component (`/admin/doctors/pending`)
 * Dedicated verification workflow queue for doctors awaiting approval.
 */
export default function PendingDoctors({ onCountChange, syncTrigger }) {
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve' | 'reject', doctor }
  const [feedback, setFeedback] = useState(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/doctors/pending');
      if (!res.ok) throw new Error('Failed to fetch pending applications');
      const data = await res.json();
      setPendingDocs(data);
      if (onCountChange) onCountChange(data.length);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [syncTrigger]);

  const handleApproveConfirm = async () => {
    if (!confirmAction?.doctor) return;
    try {
      const res = await apiFetch(`/api/admin/doctors/${confirmAction.doctor.id}/approve`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approval failed');
      setFeedback({ type: 'success', text: `Dr. ${confirmAction.doctor.name} approved & credentials verified` });
      setConfirmAction(null);
      setSelectedDoctor(null);
      fetchPending();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!confirmAction?.doctor) return;
    try {
      const res = await apiFetch(`/api/admin/doctors/${confirmAction.doctor.id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Rejection failed');
      setFeedback({ type: 'success', text: `Doctor application for ${confirmAction.doctor.name} was rejected` });
      setConfirmAction(null);
      setSelectedDoctor(null);
      fetchPending();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Doctor Verification Queue</h2>
          <p className="text-xs text-slate-500">Review clinical credentials and approve physician onboarding</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            Pending Review: {pendingDocs.length}
          </span>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border ${
          feedback.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          <span>{feedback.type === 'error' ? '⚠️ ' : '✓ '} {feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Checking verification requests..." />
      ) : pendingDocs.length === 0 ? (
        <EmptyState
          title="All doctor verification requests cleared"
          message="There are no pending doctor onboarding applications in the queue at this time."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pendingDocs.map((doc) => (
            <div key={doc.id || doc._id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">{doc.id}</span>
                  <StatusBadge status={doc.status || 'Pending'} />
                </div>
                <h3 className="text-base font-bold text-slate-900">{doc.name}</h3>
                <p className="text-xs font-semibold text-blue-600 mb-3">{doc.specialty || 'General Medicine'}</p>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                  <p><span className="text-slate-400">Hospital:</span> {doc.hospital || 'City Medical'}</p>
                  <p><span className="text-slate-400">Experience:</span> {doc.exp || '5 yrs'}</p>
                  <p><span className="text-slate-400">Email:</span> {doc.email}</p>
                  <p><span className="text-slate-400">Fee:</span> {doc.fee || '₹500'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setConfirmAction({ type: 'approve', doctor: doc })}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all text-center"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => setConfirmAction({ type: 'reject', doctor: doc })}
                  className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all text-center"
                >
                  ✕ Reject
                </button>
                <button
                  onClick={() => setSelectedDoctor(doc)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  title="Inspect Details"
                >
                  🔍
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <DoctorDetailsModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onApprove={(id) => setConfirmAction({ type: 'approve', doctor: selectedDoctor })}
          onReject={(id) => setConfirmAction({ type: 'reject', doctor: selectedDoctor })}
        />
      )}

      {/* Confirmation Modals */}
      {confirmAction?.type === 'approve' && (
        <ConfirmModal
          isOpen={true}
          title="Approve Doctor Verification"
          message={`Are you sure you want to verify credentials and activate clinical account for ${confirmAction.doctor.name}? They will gain immediate access to patient consultations.`}
          confirmText="Yes, Approve Doctor"
          isDestructive={false}
          onConfirm={handleApproveConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction?.type === 'reject' && (
        <ConfirmModal
          isOpen={true}
          title="Reject Doctor Application"
          message={`Are you sure you want to reject the application for ${confirmAction.doctor.name}? This will remove the unverified application from the system.`}
          confirmText="Yes, Reject Application"
          isDestructive={true}
          requiresReason={true}
          onConfirm={handleRejectConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
