import React, { useState, useEffect } from 'react';
import StatusBadge from '../../../components/admin/StatusBadge.jsx';
import LoadingSpinner from '../../../components/admin/LoadingSpinner.jsx';
import EmptyState from '../../../components/admin/EmptyState.jsx';
import PatientDetailsModal from './PatientDetailsModal.jsx';
import ConfirmModal from '../../../components/admin/ConfirmModal.jsx';
import { apiFetch } from '../../../utils/apiClient.js';

/**
 * PatientList Component (`/admin/patients`)
 */
export default function PatientList({ syncTrigger }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/patients');
      if (!res.ok) throw new Error('Failed to fetch patient records');
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [syncTrigger]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'Suspended' ? 'Active' : 'Suspended';
      const res = await apiFetch(`/api/admin/patients/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Status update failed');
      setFeedback({ type: 'success', text: `Patient account ${nextStatus}` });
      setSelectedPatientId(null);
      fetchPatients();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleDeletePatient = async (reason) => {
    if (!patientToDelete) return;
    try {
      const res = await apiFetch(`/api/admin/users/suspend/${patientToDelete.id}`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete operation failed');
      setFeedback({ type: 'success', text: `Patient ${patientToDelete.name} removed successfully` });
      setPatientToDelete(null);
      fetchPatients();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.id?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search);
    const matchesStatus = statusFilter === 'all' || p.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Directory</h2>
          <p className="text-xs text-slate-500">Manage registered patient accounts and healthcare access</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-xl">
            Total Patients: {patients.length}
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, email, phone..."
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
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      {loading ? (
        <LoadingSpinner message="Loading patient directory..." />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          title="No patients match your search"
          message="Try changing your search term or clearing the status filter."
          actionLabel="Clear Filters"
          onAction={() => { setSearch(''); setStatusFilter('all'); }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Patient ID</th>
                  <th className="px-5 py-3.5">Patient Name</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Admitted</th>
                  <th className="px-5 py-3.5">Appointments</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((pat) => (
                  <tr key={pat.id || pat._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800 font-mono">{pat.id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{pat.name}</p>
                      <p className="text-[11px] text-slate-500">{pat.age} yrs · {pat.bloodType}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-700 font-medium">{pat.email}</p>
                      <p className="text-[11px] text-slate-400">{pat.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">
                      {pat.registrationDate}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {pat.appointmentsCount} Visits
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={pat.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedPatientId(pat.id)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => setPatientToDelete(pat)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {selectedPatientId && (
        <PatientDetailsModal
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
          onStatusChange={handleToggleStatus}
        />
      )}

      {/* Delete Confirmation Modal */}
      {patientToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Remove Patient Account"
          message={`Are you sure you want to permanently delete patient profile for ${patientToDelete.name} (${patientToDelete.id})? This action cannot be undone.`}
          confirmText="Yes, Remove Patient"
          isDestructive={true}
          requiresReason={true}
          onConfirm={handleDeletePatient}
          onCancel={() => setPatientToDelete(null)}
        />
      )}
    </div>
  );
}
