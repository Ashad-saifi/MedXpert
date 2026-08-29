import React, { useState, useEffect } from 'react';
import StatCard from '../../components/admin/StatCard.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import LoadingSpinner from '../../components/admin/LoadingSpinner.jsx';
import { apiFetch } from '../../utils/apiClient.js';

/**
 * AdminDashboard Component
 * Top-level real-time administrative intelligence and monitoring center.
 */
export default function AdminDashboard({ onNavigate, syncTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('7D'); // 7D, 30D, 6M, 1Y
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/dashboard');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch dashboard intelligence');
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [syncTrigger]);

  if (loading) return <LoadingSpinner message="Aggregating hospital metrics and real-time activity..." />;

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
        <p className="font-bold">Error loading dashboard</p>
        <p>{error}</p>
        <button onClick={fetchDashboard} className="mt-3 px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl">
          Retry
        </button>
      </div>
    );
  }

  const { stats, analytics, recentAppointments, recentLogs } = data || {};

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* KPI Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Patients"
          value={stats?.totalPatients?.value !== undefined ? stats.totalPatients.value.toLocaleString() : '0'}
          subtext={`${stats?.totalPatients?.newThisMonth ?? 0} new admissions this month`}
          icon="🧑‍🤝‍🧑"
          color="blue"
        />
        <StatCard
          title="Clinical Doctors"
          value={stats?.totalDoctors?.value ?? 0}
          subtext={`${stats?.totalDoctors?.active ?? 0} active · ${stats?.totalDoctors?.pending ?? 0} pending verification`}
          icon="👨‍⚕️"
          color="emerald"
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.appointments?.today ?? 0}
          subtext={`${stats?.appointments?.upcoming ?? 0} upcoming · ${stats?.appointments?.completed ?? 0} completed`}
          icon="📅"
          color="indigo"
        />
        <StatCard
          title="EHR Medical Records"
          value={stats?.medicalRecords?.total ?? 0}
          subtext={`${stats?.medicalRecords?.recentlyUploaded ?? 0} diagnostic records`}
          icon="📑"
          color="cyan"
        />
      </div>

      {/* Analytics Charts & Donut Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">Appointment & Patient Trajectory</h2>
              <p className="text-xs text-slate-500">Consultation volume and registration distribution</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['7D', '30D', '6M', '1Y'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    timeFilter === filter ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Bar / Height Visualization */}
          <div className="h-56 flex items-end justify-between gap-2 pt-6 border-b border-slate-100 pb-4">
            {(timeFilter === '7D' ? analytics?.daily : analytics?.monthly)?.map((item, idx) => {
              const maxVal = 50;
              const apptHeight = Math.min(100, Math.round((item.appointments / (timeFilter === '7D' ? 50 : 800)) * 100));
              const patHeight = Math.min(100, Math.round((item.patients / (timeFilter === '7D' ? 40 : 500)) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full max-w-[32px] flex items-end justify-center gap-1 h-full">
                    {/* Appointments Bar */}
                    <div
                      style={{ height: `${apptHeight}%` }}
                      className="w-1/2 bg-blue-600 rounded-t-md group-hover:bg-blue-700 transition-all relative"
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {item.appointments}
                      </span>
                    </div>
                    {/* Patients Bar */}
                    <div
                      style={{ height: `${patHeight}%` }}
                      className="w-1/2 bg-cyan-400 rounded-t-md group-hover:bg-cyan-500 transition-all relative"
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {item.patients}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600"></span>
              <span>Appointments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cyan-400"></span>
              <span>New Patients</span>
            </div>
          </div>
        </div>

        {/* Appointment Status Donut Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Appointment Status</h2>
            <p className="text-xs text-slate-500">Live operational consultation outcomes</p>
          </div>

          <div className="my-6 flex flex-col items-center">
            {/* Visual Circular Representation */}
            <div className="relative w-36 h-36 rounded-full border-8 border-slate-100 flex items-center justify-center bg-gradient-to-tr from-emerald-50 via-blue-50 to-amber-50 shadow-inner">
              <div className="text-center">
                <span className="text-2xl font-black text-slate-900 font-sans">
                  {stats?.appointments?.total ?? 0}
                </span>
                <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-slate-700">Completed</span>
              </div>
              <span className="font-bold text-slate-900">{analytics?.statusDistribution?.completed ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="font-semibold text-slate-700">Confirmed / Upcoming</span>
              </div>
              <span className="font-bold text-slate-900">{analytics?.statusDistribution?.confirmed ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="font-semibold text-slate-700">Pending Review</span>
              </div>
              <span className="font-bold text-slate-900">{analytics?.statusDistribution?.pending ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="font-semibold text-slate-700">Cancelled</span>
              </div>
              <span className="font-bold text-slate-900">{analytics?.statusDistribution?.cancelled ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Appointments & Live Activity Log Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Appointments</h2>
              <p className="text-xs text-slate-500">Latest scheduled patient-doctor sessions</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('appointments')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Schedule</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(recentAppointments || []).map((appt) => (
                  <tr key={appt.id || appt._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800 font-mono">{appt.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{appt.patientName}</td>
                    <td className="px-5 py-3.5 text-slate-600">{appt.doctorName}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">
                      {appt.date} · {appt.time}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        {appt.type?.includes('Video') ? '📹' : '🏥'} {appt.type || 'Video'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={appt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Security Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Security Audit Trail</h2>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Live Audit
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {(recentLogs || []).map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-xs">
                    🔒
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{log.action}</p>
                    <p className="text-[11px] text-slate-500">
                      by <span className="font-semibold text-slate-700">{log.user}</span> · {log.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('security')}
            className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Open Full Audit Trail →
          </button>
        </div>
      </div>
    </div>
  );
}
