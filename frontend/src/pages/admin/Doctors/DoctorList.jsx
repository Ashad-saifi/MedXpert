import React, { useState, useEffect } from 'react';
import StatusBadge from '../../../components/admin/StatusBadge.jsx';
import LoadingSpinner from '../../../components/admin/LoadingSpinner.jsx';
import EmptyState from '../../../components/admin/EmptyState.jsx';
import DoctorDetailsModal from './DoctorDetailsModal.jsx';
import ConfirmModal from '../../../components/admin/ConfirmModal.jsx';
import { apiFetch } from '../../../utils/apiClient.js';

/**
 * DoctorList Component (`/admin/doctors`)
 */
export default function DoctorList({ syncTrigger }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorToDeactivate, setDoctorToDeactivate] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/doctors');
      if (!res.ok) throw new Error('Failed to fetch medical doctors');
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [syncTrigger]);

  const handleApprove = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/doctors/${id}/approve`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approval failed');
      setFeedback({ type: 'success', text: 'Doctor approved and activated' });
      setSelectedDoctor(null);
      fetchDoctors();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/doctors/${id}/reject`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Rejection failed');
      setFeedback({ type: 'success', text: 'Doctor registration rejected' });
      setSelectedDoctor(null);
      fetchDoctors();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const specialties = ['all', ...new Set(doctors.map(d => d.specialty).filter(Boolean))];

  const filteredDoctors = doctors.filter((d) => {
    const matchesSearch =
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(search.toLowerCase()) ||
      d.hospital?.toLowerCase().includes(search.toLowerCase()) ||
      d.id?.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty = specialtyFilter === 'all' || d.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Doctor Management</h2>
          <p className="text-xs text-slate-500">View and verify certified physicians and specialists</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-xl">
            Total Doctors: {doctors.length}
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

      {/* Search & Specialty Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor by name, specialty, hospital..."
            className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-semibold"
          >
            {specialties.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Specialties' : s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Table */}
      {loading ? (
        <LoadingSpinner message="Retrieving certified doctors..." />
      ) : filteredDoctors.length === 0 ? (
        <EmptyState
          title="No doctors match your criteria"
          message="Try clearing your search query or selecting another specialization."
          actionLabel="Clear Filters"
          onAction={() => { setSearch(''); setSpecialtyFilter('all'); }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Doctor ID</th>
                  <th className="px-5 py-3.5">Doctor Name</th>
                  <th className="px-5 py-3.5">Specialization</th>
                  <th className="px-5 py-3.5">Experience & Fee</th>
                  <th className="px-5 py-3.5">Hospital</th>
                  <th className="px-5 py-3.5">Verification</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id || doc._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800 font-mono">{doc.id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{doc.name}</p>
                      <p className="text-[11px] text-slate-500">{doc.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px]">
                        {doc.specialty || 'General Practice'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-800 font-medium">{doc.exp || '5 yrs'}</p>
                      <p className="text-[11px] text-blue-600 font-bold">{doc.fee || '₹500'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{doc.hospital || 'City Medical Center'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedDoctor(doc)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <DoctorDetailsModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
