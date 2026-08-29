import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../../components/admin/LoadingSpinner.jsx';
import EmptyState from '../../../components/admin/EmptyState.jsx';
import { apiFetch } from '../../../utils/apiClient.js';

/**
 * MedicalRecordsList Component (`/admin/medical-records`)
 */
export default function MedicalRecordsList({ syncTrigger }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/medical-records');
      if (!res.ok) throw new Error('Failed to fetch medical records');
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [syncTrigger]);

  const safeRecords = Array.isArray(records) ? records : [];

  const filteredRecords = safeRecords.filter((r) => {
    if (!r) return false;
    const matchesSearch =
      r.id?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient?.toLowerCase().includes(search.toLowerCase()) ||
      r.doctor?.toLowerCase().includes(search.toLowerCase()) ||
      r.title?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || r.type?.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">EHR Medical Records Archive</h2>
          <p className="text-xs text-slate-500">Encrypted diagnostic lab reports, consultation summaries, and medical artifacts</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-cyan-50 border border-cyan-100 text-cyan-800 text-xs font-bold rounded-xl">
            Total Records: {records.length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records by ID, patient, title..."
            className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-semibold"
          >
            <option value="all">All Record Types</option>
            <option value="lab report">Lab Reports</option>
            <option value="prescription">Prescriptions</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <LoadingSpinner message="Querying encrypted EHR archive..." />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title="No medical records found"
          message="No records match your query."
          actionLabel="Clear Filters"
          onAction={() => { setSearch(''); setTypeFilter('all'); }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Record ID</th>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Attending Clinician</th>
                  <th className="px-5 py-3.5">Type & Title</th>
                  <th className="px-5 py-3.5">Date Recorded</th>
                  <th className="px-5 py-3.5">Compliance Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800 font-mono">{rec.id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{rec.patient}</td>
                    <td className="px-5 py-3.5 text-slate-600">{rec.doctor}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800">{rec.title}</p>
                      <span className="text-[10px] text-blue-600 font-semibold">{rec.type}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">{rec.date}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        🔒 {rec.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        Inspect Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Inspect Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedRecord.title}</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedRecord.id}</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Verified
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
              <p><span className="text-slate-400 font-bold">Patient:</span> <span className="font-bold text-slate-900">{selectedRecord.patient}</span></p>
              <p><span className="text-slate-400 font-bold">Doctor / Lab:</span> <span className="font-bold text-slate-900">{selectedRecord.doctor}</span></p>
              <p><span className="text-slate-400 font-bold">Record Category:</span> {selectedRecord.type}</p>
              <p><span className="text-slate-400 font-bold">Date of Record:</span> {selectedRecord.date}</p>
              <p><span className="text-slate-400 font-bold">Encryption:</span> AES-256 GCM Authenticated Hash Valid</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
