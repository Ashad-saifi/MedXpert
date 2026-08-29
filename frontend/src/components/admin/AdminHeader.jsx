import React from 'react';

/**
 * AdminHeader Component
 * Top bar with real-time search, notification indicator, administrator status, and quick profile menu.
 */
export default function AdminHeader({ title, searchQuery, setSearchQuery, notificationsCount = 0, onOpenNotifications, onLogout, adminUser }) {
  const adminName = adminUser?.name || 'Administrator';
  const adminEmail = adminUser?.email || 'admin@medxpert.com';

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search Input */}
        <div className="relative hidden sm:block w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            placeholder="Search patients, doctors..."
            className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all text-sm"
          title="Notifications & Alerts"
        >
          🔔
          {notificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              {notificationsCount}
            </span>
          )}
        </button>

        {/* Admin Profile Details */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">{adminName}</span>
            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">{adminEmail}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
