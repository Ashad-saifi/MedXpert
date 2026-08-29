import React from 'react';

/**
 * Unauthorized403 Component
 * Displayed when non-admin users attempt to access the administrator portal.
 */
export default function Unauthorized403({ userRole = 'user' }) {
  const handleRedirect = () => {
    if (userRole === 'doctor') {
      window.location.href = '/medxpert.html';
    } else if (userRole === 'patient') {
      window.location.href = '/medxpert.html';
    } else {
      window.location.hash = '#/admin/login';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-4xl mb-6 shadow-2xl shadow-rose-500/20 animate-bounce">
        🛡️
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-sans">
        403 – Unauthorized Access
      </h1>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        Access to the MedXpert Admin Portal is restricted strictly to verified hospital administrators.
        Your current session role (<span className="text-rose-400 font-bold uppercase">{userRole}</span>) does not hold authorization for this privileged system.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleRedirect}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
        >
          Return to {userRole === 'doctor' ? 'Doctor Dashboard' : userRole === 'patient' ? 'Patient Portal' : 'Admin Login'}
        </button>
        <button
          onClick={() => {
            sessionStorage.removeItem('medxpert_user');
            sessionStorage.removeItem('medxpert_role');
            window.location.hash = '#/admin/login';
          }}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-all"
        >
          Switch Account
        </button>
      </div>
    </div>
  );
}
