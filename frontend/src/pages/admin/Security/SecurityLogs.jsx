import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../../components/admin/LoadingSpinner.jsx';
import EmptyState from '../../../components/admin/EmptyState.jsx';
import { apiFetch } from '../../../utils/apiClient.js';

/**
 * SecurityLogs Component (`/admin/security/activity`)
 * Immutable security audit trail with date-range filters (Today, 7 Days, 30 Days, All).
 */
export default function SecurityLogs({ syncTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all'); // today, 7days, 30days, all

  const fetchLogs = async (selectedRange = range) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/admin/security/activity?range=${selectedRange}`);
      if (!res.ok) throw new Error('Failed to fetch security audit logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(range);
  }, [range, syncTrigger]);

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Security Audit Activity Trail</h2>
          <p className="text-xs text-slate-500">Immutable chronological audit trail of privileged administrative operations</p>
        </div>

        {/* Range Filters */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: '7 Days' },
            { id: '30days', label: '30 Days' },
            { id: 'all', label: 'All Time' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setRange(f.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                range === f.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Retrieving cryptographic audit records..." />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit events found"
          message="No security actions recorded for the selected time window."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Action Executed</th>
                  <th className="px-5 py-3.5">Admin Actor</th>
                  <th className="px-5 py-3.5">Origin IP</th>
                  <th className="px-5 py-3.5">Execution Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                      {log.time} {log.createdAt ? `(${new Date(log.createdAt).toLocaleDateString()})` : ''}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {log.user}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                      {log.ip || '127.0.0.1'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 text-[11px]">
                        ✓ {log.status || 'Success'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
