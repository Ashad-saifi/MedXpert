import React from 'react';

/**
 * StatusBadge Component
 * Renders clinical and administrative status pills with refined colors.
 */
export default function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotClass = 'bg-slate-400';

  if (['active', 'approved', 'completed', 'confirmed', 'success'].includes(s)) {
    bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    dotClass = 'bg-emerald-500';
  } else if (['pending', 'in review', 'waiting'].includes(s)) {
    bgClass = 'bg-amber-50 text-amber-700 border-amber-200/80';
    dotClass = 'bg-amber-500 animate-pulse';
  } else if (['cancelled', 'rejected', 'suspended', 'inactive', 'failed'].includes(s)) {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-200/80';
    dotClass = 'bg-rose-500';
  } else if (['video', 'video consultation'].includes(s)) {
    bgClass = 'bg-blue-50 text-blue-700 border-blue-200/80';
    dotClass = 'bg-blue-500';
  } else if (['in-clinic', 'in-person'].includes(s)) {
    bgClass = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    dotClass = 'bg-indigo-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bgClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
      {status || 'Unknown'}
    </span>
  );
}
