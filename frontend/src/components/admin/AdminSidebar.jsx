import React from 'react';

/**
 * AdminSidebar Component
 * Enterprise collapsible sidebar with active page indicators and badge counters.
 */
export default function AdminSidebar({ activeTab, setActiveTab, pendingDocsCount = 0, notificationsCount = 0, isCollapsed, setIsCollapsed, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'patients', label: 'Patients', icon: '🧑‍🤝‍🧑' },
    { id: 'doctors', label: 'Doctors', icon: '👨‍⚕️' },
    { id: 'pending-doctors', label: 'Doctor Verification', icon: '🛡️', badge: pendingDocsCount > 0 ? pendingDocsCount : null, badgeColor: 'bg-amber-500' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'medical-records', label: 'Medical Records', icon: '📑' },
    { id: 'prescriptions', label: 'Prescriptions', icon: '💊' },
    { id: 'reports', label: 'Reports & Analytics', icon: '📈' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', badge: notificationsCount > 0 ? notificationsCount : null, badgeColor: 'bg-blue-500' },
    { id: 'security', label: 'Security Audit Logs', icon: '🔒' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className={`bg-slate-900 text-slate-300 flex flex-col justify-between transition-all duration-300 border-r border-slate-800 ${
      isCollapsed ? 'w-20' : 'w-64'
    } min-h-screen sticky top-0 z-40`}>
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-500/20 shrink-0">
              X
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-base tracking-tight leading-none">
                  Med<span className="text-cyan-400">Xpert</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">Admin Portal</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs hidden lg:block"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold text-white rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Session Block */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
          title={isCollapsed ? 'Logout' : undefined}
        >
          <span className="text-base shrink-0">🚪</span>
          {!isCollapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
