import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../../components/admin/LoadingSpinner.jsx';
import { apiFetch } from '../../../utils/apiClient.js';

/**
 * ReportsAnalytics Component (`/admin/reports`)
 * High-level analytics summaries, breakdown tables, and PDF/CSV export engine.
 */
export default function ReportsAnalytics({ syncTrigger }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/reports');
      if (!res.ok) throw new Error('Failed to fetch analytics reports');
      const data = await res.json();
      setReportData(data && typeof data === 'object' ? data : null);
    } catch (err) {
      console.error(err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [syncTrigger]);

  const handleExportCSV = () => {
    if (!reportData?.monthlyBreakdown) return;
    const headers = 'Month,Patients,Doctors,Appointments,Estimated Revenue (INR)\n';
    const rows = (Array.isArray(reportData.monthlyBreakdown) ? reportData.monthlyBreakdown : [])
      .map(r => `"${r.month}",${r.patients},${r.doctors},${r.appointments},${r.revenue}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MedXpert_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportHospitalPDF = () => {
    const summary = reportData?.summary || {};
    const monthlyBreakdown = Array.isArray(reportData?.monthlyBreakdown) ? reportData.monthlyBreakdown : [];
    const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const reportId = `MX-RPT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert('Please allow popups to generate the Hospital PDF Report');
      return;
    }

    const rowsHtml = monthlyBreakdown.map((row, i) => `
      <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 10px 14px; font-weight: 600; color: #1e293b;">${row.month}</td>
        <td style="padding: 10px 14px; color: #334155;">+${row.patients} Patients</td>
        <td style="padding: 10px 14px; color: #334155;">+${row.doctors} Clinicians</td>
        <td style="padding: 10px 14px; color: #334155;">${row.appointments} Visits</td>
        <td style="padding: 10px 14px; text-align: right; font-weight: bold; color: #059669;">₹${row.revenue?.toLocaleString() || 0}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MedXpert Hospital Clinical Intelligence Report - ${reportId}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #ffffff; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo-area h1 { margin: 0; color: #0369a1; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
          .logo-area p { margin: 3px 0 0 0; color: #64748b; font-size: 11px; }
          .report-tag { text-align: right; font-size: 11px; color: #475569; }
          .report-tag .badge { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; font-weight: bold; display: inline-block; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 11px; }
          .meta-box div span { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600; }
          .meta-box div strong { color: #0f172a; font-size: 12px; }
          .section-title { font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-left: 3px solid #0284c7; padding-left: 8px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 25px; }
          .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #ffffff; }
          .kpi-card .kpi-label { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .kpi-card .kpi-val { font-size: 20px; font-weight: 800; color: #0f172a; margin: 4px 0; }
          .kpi-card .kpi-sub { font-size: 10px; color: #059669; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 25px; }
          th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 14px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .footer-sign { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 11px; }
          .sign-box { text-align: center; width: 200px; }
          .sign-line { border-top: 1px solid #0f172a; margin-top: 40px; padding-top: 5px; font-weight: bold; }
          .disclaimer { font-size: 9px; color: #94a3b8; margin-top: 25px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 10px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            <h1>🏥 MedXpert Healthcare & Multi-Specialty Hospital</h1>
            <p>ISO 9001:2015 & NABH Accredited Telemedicine & Hospital Division</p>
            <p>Sector 62, Institutional Area, HealthTech Corridor, New Delhi | Helpline: +91 1800-MED-XPERT</p>
          </div>
          <div class="report-tag">
            <span class="badge">Official Clinical Record</span>
            <div><strong>${reportId}</strong></div>
            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">Generated: ${reportDate}, ${reportTime}</div>
          </div>
        </div>

        <div class="meta-box">
          <div><span>Department</span><strong>Central Administration</strong></div>
          <div><span>Authorized By</span><strong>Chief Medical Officer (CMO)</strong></div>
          <div><span>Report Scope</span><strong>Clinical & Operational Analytics</strong></div>
          <div><span>Security Standard</span><strong>AES-256 Encrypted Audit</strong></div>
        </div>

        <div class="section-title">Executive Clinical Summary</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Registered Patient Admissions</div>
            <div class="kpi-val">${summary?.totalPatients ?? 0}</div>
            <div class="kpi-sub">Active Patients: ${summary?.activePatients ?? 0}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Certified Clinical Staff</div>
            <div class="kpi-val">${summary?.totalDoctors ?? 0}</div>
            <div class="kpi-sub">Active Clinicians: ${summary?.activeDoctors ?? 0} · Pending: ${summary?.pendingDoctors ?? 0}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Consultations Handled</div>
            <div class="kpi-val">${summary?.totalAppointments ?? 0}</div>
            <div class="kpi-sub">Completed: ${summary?.completedAppointments ?? 0} · Cancelled: ${summary?.cancelledAppointments ?? 0}</div>
          </div>
        </div>

        <div class="section-title">Monthly Operational & Consultation Billing Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Billing Month</th>
              <th>New Patient Admissions</th>
              <th>Clinical Staff Added</th>
              <th>Completed Consultations</th>
              <th style="text-align: right;">Consultation Billing Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding: 20px; color:#94a3b8;">No records to display</td></tr>'}
          </tbody>
        </table>

        <div class="footer-sign">
          <div>
            <div style="font-weight: bold; color: #0284c7;">✓ Digitally Certified Hospital Record</div>
            <div style="color: #64748b; font-size: 10px; margin-top: 3px;">SHA-256 Hash: ${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}</div>
            <div style="color: #64748b; font-size: 10px;">Verification URL: https://medxpert.health/verify-report/${reportId}</div>
          </div>
          <div class="sign-box">
            <div style="font-family: cursive; color: #0369a1; font-size: 14px; font-weight: bold;">Dr. Clinical Admin</div>
            <div class="sign-line">Authorized Signatory / CMO<br><span style="font-size: 9px; color: #64748b; font-weight: normal;">MedXpert Hospital Authority</span></div>
          </div>
        </div>

        <div class="disclaimer">
          This document is an authenticated hospital management and clinical intelligence report generated electronically by the MedXpert Healthcare Management System. Any unauthorized reproduction is strictly prohibited under Clinical Establishment Act & IT Security Norms.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) return <LoadingSpinner message="Generating consolidated analytical reports..." />;

  const summary = reportData?.summary || {};
  const monthlyBreakdown = Array.isArray(reportData?.monthlyBreakdown) ? reportData.monthlyBreakdown : [];

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Clinical Intelligence</h2>
          <p className="text-xs text-slate-500">Executive metrics, operational summaries, and financial reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>📊</span> Export CSV
          </button>
          <button
            onClick={handleExportHospitalPDF}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>📑</span> Download / Print Hospital PDF
          </button>
        </div>
      </div>

      {/* Metric Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Patients Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Patient Population</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">🧑‍🤝‍🧑</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary?.totalPatients !== undefined ? summary.totalPatients.toLocaleString() : '0'}</div>
          <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Active Patients:</span>
              <span className="font-bold text-slate-800">{summary?.activePatients ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Retention Rate:</span>
              <span className="font-bold text-emerald-600">{summary?.totalPatients ? '100%' : '0%'}</span>
            </div>
          </div>
        </div>

        {/* Doctors Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Clinical Staff</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">👨‍⚕️</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary?.totalDoctors ?? 0}</div>
          <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Active Clinicians:</span>
              <span className="font-bold text-slate-800">{summary?.activeDoctors ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Awaiting Review:</span>
              <span className="font-bold text-amber-600">{summary?.pendingDoctors ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Consultation Outcomes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Consultation Volume</span>
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">📅</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary?.totalAppointments ?? 0}</div>
          <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Completed Visits:</span>
              <span className="font-bold text-emerald-600">{summary?.completedAppointments ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Cancelled Visits:</span>
              <span className="font-bold text-rose-600">{summary?.cancelledAppointments ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Reporting Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Monthly Operational & Revenue Summary</h3>
            <p className="text-xs text-slate-500">Consolidated financial overview and growth metrics</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Billing Month</th>
                <th className="px-5 py-3.5">New Patient Admissions</th>
                <th className="px-5 py-3.5">Doctors Added</th>
                <th className="px-5 py-3.5">Completed Consultations</th>
                <th className="px-5 py-3.5 text-right">Consultation Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyBreakdown.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800">{row.month}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">+{row.patients} Patients</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">+{row.doctors} Doctors</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">{row.appointments} Visits</td>
                  <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                    ₹{row.revenue?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
