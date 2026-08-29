import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../../components/admin/LoadingSpinner.jsx';
import EmptyState from '../../../components/admin/EmptyState.jsx';
import { apiFetch } from '../../../utils/apiClient.js';

/**
 * NotificationCenter Component (`/admin/notifications`)
 */
export default function NotificationCenter({ onNavigate, syncTrigger }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [syncTrigger]);

  const handleMarkAllRead = () => {
    setNotifications((Array.isArray(notifications) ? notifications : []).map(n => ({ ...n, read: true })));
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notification Center & Critical Alerts</h2>
          <p className="text-xs text-slate-500">Live platform alerts, verification requests, and administrative notices</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Mark All as Read
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Checking platform notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No unread notifications"
          message="You are all caught up. No new system alerts or verification notices at this time."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start gap-4 transition-colors ${
                n.read ? 'bg-white' : 'bg-blue-50/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                n.type === 'verification' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}>
                {n.type === 'verification' ? '🛡️' : '🔔'}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[11px] text-slate-400">
                    {new Date(n.timestamp).toLocaleDateString()} · {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {n.link && (
                    <button
                      onClick={() => onNavigate && onNavigate(n.link.replace('/admin/', ''))}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Inspect Action →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
