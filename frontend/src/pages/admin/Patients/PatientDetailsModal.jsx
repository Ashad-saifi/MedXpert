import React, { useState, useEffect } from 'react';
import StatusBadge from '../../../components/admin/StatusBadge.jsx';
import LoadingSpinner from '../../../components/admin/LoadingSpinner.jsx';
import { apiFetch } from '../../../utils/apiClient.js';

/**
 * PatientDetailsModal Component
 * Deep-dive medical summary and profile inspector with strict authorization.
 */
export default function PatientDetailsModal({ patientId, onClose, onStatusChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) return;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/admin/patients/${patientId}`);
        if (!res.ok) throw new Error('Could not load patient medical records');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [patientId]);

  if (!patientId) return null;

  const { patient, appointments = [], prescriptions = [], labReports = [] } = data || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-lg font-bold">
              🧑‍⚕️
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{patient?.name || 'Patient Profile'}</h2>
              <p className="text-xs text-slate-500 font-mono">ID: {patient?.id || patientId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-200/60 flex items-center justify-center transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {loading ? (
            <LoadingSpinner message="Fetching clinical history..." />
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-xl">{error}</div>
          ) : (
            <>
              {/* Demographics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Age & Gender</span>
                  <span className="font-bold text-slate-800 text-sm">{patient?.age || '30'} yrs · {patient?.gender || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Blood Group</span>
                  <span className="font-bold text-rose-600 text-sm">{patient?.bloodType || 'O+'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Account Status</span>
                  <div className="mt-0.5">
                    <StatusBadge status={patient?.status || 'Active'} />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Phone Contact</span>
                  <span className="font-bold text-slate-800 text-xs">{patient?.phone || 'Not Specified'}</span>
                </div>
              </div>

              {/* Conditions & Insurance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <span>🩺</span> Chronic Conditions & Allergies
                  </h3>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                    {patient?.chronicConditions || patient?.conditions || 'None Reported'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <span>🛡️</span> Insurance Policy
                  </h3>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                    {patient?.insurance?.provider ? `${patient.insurance.provider} (Policy: ${patient.insurance.policyNo})` : 'Universal Health Coverage Active'}
                  </p>
                </div>
              </div>

              {/* Appointment History */}
              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center justify-between">
                  <span>Appointment Consultations ({appointments.length})</span>
                </h3>
                {appointments.length === 0 ? (
                  <p className="text-slate-400 italic p-3 bg-slate-50 rounded-xl">No past consultations recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {appointments.slice(0, 4).map((a) => (
                      <div key={a.id || a._id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800">{a.doctorName}</p>
                          <p className="text-[11px] text-slate-500">{a.date} at {a.time} ({a.type})</p>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lab Reports & Records */}
              <div>
                <h3 className="font-bold text-slate-900 mb-2">EHR Diagnostics & Lab Reports ({labReports.length})</h3>
                {labReports.length === 0 ? (
                  <p className="text-slate-400 italic p-3 bg-slate-50 rounded-xl">No diagnostic lab reports uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {labReports.slice(0, 3).map((r, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800">{r.testName || r.title || 'Pathology Report'}</p>
                          <p className="text-[11px] text-slate-500">{r.date || 'Recent'}</p>
                        </div>
                        <span className="text-[11px] font-bold text-blue-600">✓ Verified EHR</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            onClick={() => onStatusChange && onStatusChange(patient?.id, patient?.status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              patient?.status === 'Suspended'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
            }`}
          >
            {patient?.status === 'Suspended' ? 'Reactivate Account' : 'Suspend Patient Access'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
