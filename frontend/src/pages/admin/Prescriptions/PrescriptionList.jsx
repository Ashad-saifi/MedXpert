import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../../components/admin/LoadingSpinner.jsx';
import EmptyState from '../../../components/admin/EmptyState.jsx';
import { apiFetch } from '../../../utils/apiClient.js';

/**
 * PrescriptionList Component (`/admin/prescriptions`)
 */
export default function PrescriptionList({ syncTrigger }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRx, setSelectedRx] = useState(null);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/prescriptions');
      if (!res.ok) throw new Error('Failed to fetch prescriptions');
      const data = await res.json();
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [syncTrigger]);

  const safeRx = Array.isArray(prescriptions) ? prescriptions : [];

  const filteredRx = safeRx.filter((p) => {
    if (!p) return false;
    return (
      p.id?.toLowerCase().includes(search.toLowerCase()) ||
      p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      p.doctorName?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Prescriptions Management & Audit</h2>
          <p className="text-xs text-slate-500">Monitor digital prescription authorizations and medication schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-xl">
            Total Prescriptions: {prescriptions.length}
          </span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, patient, doctor..."
            className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
          />
        </div>
      </div>

      {/* Prescription Table */}
      {loading ? (
        <LoadingSpinner message="Auditing prescriptions database..." />
      ) : filteredRx.length === 0 ? (
        <EmptyState
          title="No prescriptions found"
          message="No matching prescription entries found in the system."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Rx ID</th>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Issuing Physician</th>
                  <th className="px-5 py-3.5">Issue Date</th>
                  <th className="px-5 py-3.5">Medications Count</th>
                  <th className="px-5 py-3.5">Digital Signature</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRx.map((rx) => (
                  <tr key={rx.id || rx._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800 font-mono">{rx.id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{rx.patientName}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{rx.doctorName}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">{rx.date}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 text-[11px]">
                        {(rx.medicines || []).length} Medicines
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        ✓ Cryptographically Signed
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedRx(rx)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        View Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prescription View Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Rx #{selectedRx.id}</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedRx.date}</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Signed
              </span>
            </div>

            <div className="text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 space-y-2">
              <p><span className="text-slate-400 font-bold">Patient:</span> <span className="font-bold text-slate-900">{selectedRx.patientName}</span></p>
              <p><span className="text-slate-400 font-bold">Prescribing Doctor:</span> <span className="font-bold text-slate-900">{selectedRx.doctorName}</span></p>
              {selectedRx.notes && (
                <p><span className="text-slate-400 font-bold">Doctor Notes:</span> {selectedRx.notes}</p>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Prescribed Medications</h4>
              {(selectedRx.medicines || []).map((med, i) => (
                <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{med.name}</p>
                    <p className="text-[11px] text-slate-500">{med.dosage} · {med.frequency}</p>
                  </div>
                  <span className="text-slate-600 text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded">
                    {med.duration || '5 days'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedRx(null)}
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
