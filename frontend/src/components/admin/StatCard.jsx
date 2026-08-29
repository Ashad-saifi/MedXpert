import React from 'react';

/**
 * StatCard Component
 * Displays key healthcare administrative KPIs with trends and icons.
 */
export default function StatCard({ title, value, subtext, icon, trend, trendType = 'up', color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-lg ${selectedColor}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">{value}</span>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
            trendType === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
          }`}>
            {trendType === 'up' ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      {subtext && (
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 border-t border-slate-100 pt-2">
          {subtext}
        </div>
      )}
    </div>
  );
}
