import React, { useState, useEffect } from 'react';
import StatusBadge from '../../../components/admin/StatusBadge.jsx';
import LoadingSpinner from '../../../components/admin/LoadingSpinner.jsx';
import EmptyState from '../../../components/admin/EmptyState.jsx';
import ConfirmModal from '../../../components/admin/ConfirmModal.jsx';
import { apiFetch } from '../../../utils/apiClient.js';

/**
 * AppointmentList Component (`/admin/appointments`)
 */
export default function AppointmentList({ syncTrigger }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [apptToCancel, setApptToCancel] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/appointments');
      if (!res.ok) throw new Error('Failed to fetch appointments');
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [syncTrigger]);

  const handleCancelAppointment = async (reason) => {
    if (!apptToCancel) return;
    try {
      const res = await apiFetch(`/api/admin/appointments/${apptToCancel.id}/cancel`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cancel operation failed');
      setFeedback({ type: 'success', text: `Appointment ${apptToCancel.id} cancelled successfully` });
      setApptToCancel(null);
      setSelectedAppt(null);
      fetchAppointments();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchesSearch =
      a.id?.toLowerCase().includes(search.toLowerCase()) ||
      a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      a.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
      a.date?.includes(search);
    const matchesStatus = statusFilter === 'all' || a.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Appointments Management</h2>
          <p className="text-xs text-slate-500">Monitor live schedules, consultation status, and video sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-xl">
            Total Sessions: {appointments.length}
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

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, patient, doctor, date..."
            className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      {loading ? (
        <LoadingSpinner message="Retrieving appointments schedule..." />
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          message="No appointment matches your search filter."
          actionLabel="Clear Filters"
          onAction={() => { setSearch(''); setStatusFilter('all'); }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Doctor</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5">Consultation Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id || appt._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800 font-mono">{appt.id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{appt.patientName}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{appt.doctorName}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {appt.date} · {appt.time}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        {appt.type?.includes('Video') ? '📹' : '🏥'} {appt.type || 'Video Consultation'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedAppt(appt)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        Inspect
                      </button>
                      {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                        <button
                          onClick={() => setApptToCancel(appt)}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">Appointment #{selectedAppt.id}</h3>
                <p className="text-xs text-slate-500">Telemedicine Consultation Session</p>
              </div>
              <StatusBadge status={selectedAppt.status} />
            </div>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
              <p><span className="text-slate-400 font-bold">Patient:</span> <span className="font-bold text-slate-900">{selectedAppt.patientName}</span> (ID: {selectedAppt.patientId})</p>
              <p><span className="text-slate-400 font-bold">Doctor:</span> <span className="font-bold text-slate-900">{selectedAppt.doctorName}</span> (ID: {selectedAppt.doctorId})</p>
              <p><span className="text-slate-400 font-bold">Scheduled:</span> {selectedAppt.date} at {selectedAppt.time}</p>
              <p><span className="text-slate-400 font-bold">Format:</span> {selectedAppt.type || 'Encrypted Video Consultation'}</p>
              {selectedAppt.reason && (
                <p><span className="text-slate-400 font-bold">Clinical Reason:</span> {selectedAppt.reason}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              {selectedAppt.status !== 'Cancelled' && (
                <button
                  onClick={() => {
                    setApptToCancel(selectedAppt);
                    setSelectedAppt(null);
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all"
                >
                  Administrative Cancel
                </button>
              )}
              <button
                onClick={() => setSelectedAppt(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {apptToCancel && (
        <ConfirmModal
          isOpen={true}
          title="Cancel Scheduled Appointment"
          message={`Are you sure you want to cancel appointment #${apptToCancel.id} between ${apptToCancel.patientName} and ${apptToCancel.doctorName}?`}
          confirmText="Yes, Cancel Session"
          isDestructive={true}
          requiresReason={true}
          onConfirm={handleCancelAppointment}
          onCancel={() => setApptToCancel(null)}
        />
      )}
    </div>
  );
}
