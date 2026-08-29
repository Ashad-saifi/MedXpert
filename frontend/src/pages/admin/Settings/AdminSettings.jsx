import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../../components/admin/LoadingSpinner.jsx';
import { apiFetch } from '../../../utils/apiClient.js';

/**
 * AdminSettings Component (`/admin/settings`)
 * Profile, Security, 2FA, and System Parameters configuration.
 */
export default function AdminSettings({ adminUser }) {
  const [settings, setSettings] = useState({
    platformName: 'MedXpert',
    supportEmail: 'support@medxpert.com',
    defaultDuration: '30 minutes',
    maxPatientsPerDay: 20,
    twoFAEnabled: true,
    sessionTimeoutEnabled: true,
    auditLoggingEnabled: true,
    e2eEncryptionEnabled: true
  });
  const [profile, setProfile] = useState({
    name: adminUser?.name || 'Administrator',
    email: adminUser?.email || 'admin@medxpert.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/api/admin/logs');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) setSettings(data.settings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save settings');
      setFeedback({ type: 'success', text: 'System configurations updated successfully' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (profile.newPassword !== profile.confirmPassword) {
      setFeedback({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (profile.newPassword.length < 8) {
      setFeedback({ type: 'error', text: 'Password must contain at least 8 characters' });
      return;
    }
    try {
      const res = await apiFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ password: profile.newPassword })
      });
      if (!res.ok) throw new Error('Password update failed');
      setFeedback({ type: 'success', text: 'Administrator password updated securely' });
      setProfile({ ...profile, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  if (loading) return <LoadingSpinner message="Loading administrator preferences..." />;

  return (
    <div className="space-y-6 animate-fadeIn font-sans max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Administrator & Platform Settings</h2>
        <p className="text-xs text-slate-500">Security policies, two-factor authentication, and platform preferences</p>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border ${
          feedback.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          <span>{feedback.type === 'error' ? '⚠️ ' : '✓ '} {feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
        </div>
      )}

      {/* Security & Authentication */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>🔒</span> Security & Authentication Controls
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-bold text-xs text-slate-800">Two-Factor Authentication (2FA)</p>
              <p className="text-[11px] text-slate-500">Require OTP code for administrative sign-in</p>
            </div>
            <input
              type="checkbox"
              checked={settings.twoFAEnabled}
              onChange={(e) => setSettings({ ...settings, twoFAEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-bold text-xs text-slate-800">Session Inactivity Timeout</p>
              <p className="text-[11px] text-slate-500">Automatically logout after 30 min idle</p>
            </div>
            <input
              type="checkbox"
              checked={settings.sessionTimeoutEnabled}
              onChange={(e) => setSettings({ ...settings, sessionTimeoutEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-bold text-xs text-slate-800">Immutable Audit Logging</p>
              <p className="text-[11px] text-slate-500">Record all privileged changes in log</p>
            </div>
            <input
              type="checkbox"
              checked={settings.auditLoggingEnabled}
              onChange={(e) => setSettings({ ...settings, auditLoggingEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-bold text-xs text-slate-800">E2E Video Call Encryption</p>
              <p className="text-[11px] text-slate-500">Force WebRTC DTLS/SRTP encryption</p>
            </div>
            <input
              type="checkbox"
              checked={settings.e2eEncryptionEnabled}
              onChange={(e) => setSettings({ ...settings, e2eEncryptionEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Platform Configurations */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>⚙️</span> Platform Operation Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Platform Brand Name</label>
            <input
              type="text"
              value={settings.platformName || ''}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Support Email Address</label>
            <input
              type="email"
              value={settings.supportEmail || ''}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Default Consultation Slot</label>
            <input
              type="text"
              value={settings.defaultDuration || ''}
              onChange={(e) => setSettings({ ...settings, defaultDuration: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Max Patients / Doctor / Day</label>
            <input
              type="number"
              value={settings.maxPatientsPerDay || 20}
              onChange={(e) => setSettings({ ...settings, maxPatientsPerDay: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
        >
          Save Platform Configurations
        </button>
      </form>

      {/* Change Password Card */}
      <form onSubmit={handleUpdatePassword} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>🔑</span> Change Administrator Password
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">New Secure Password</label>
            <input
              type="password"
              required
              value={profile.newPassword}
              onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={profile.confirmPassword}
              onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
