import React, { useState } from 'react';

/**
 * AdminLogin Component
 * Dedicated standalone Admin Portal Authentication screen.
 */
export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email || !password) {
      setErrorMsg('Please provide both administrator email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin' })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Authentication failed');
      }

      if (data.user?.role !== 'admin') {
        throw new Error('Access Denied: Account does not have administrator privileges.');
      }

      // Save user session
      const adminSession = {
        ...data.user,
        token: data.token
      };

      if (rememberMe) {
        localStorage.setItem('medxpert_admin_remember', email);
      } else {
        localStorage.removeItem('medxpert_admin_remember');
      }

      sessionStorage.setItem('medxpert_user', JSON.stringify(adminSession));
      sessionStorage.setItem('medxpert_role', 'admin');

      setInfoMsg('Authentication verified. Accessing Admin Control Center...');
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(adminSession);
        } else {
          window.location.hash = '#/admin/dashboard';
        }
      }, 800);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-fadeIn">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black text-2xl mb-3 shadow-lg shadow-blue-500/20">
            X
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Med<span className="text-cyan-400">Xpert</span>
          </h1>
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mt-1">
            Healthcare Admin Portal
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[11px] font-semibold text-slate-300 mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Restricted Privilege Access Only
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <span>✓</span> {infoMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm">✉️</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@medxpert.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm">🔑</span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              Remember me
            </label>
            <a
              href="#/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                alert('For security reasons, administrator password resets must be requested through system support or secure CLI.');
              }}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Authenticate & Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 flex flex-col gap-2">
          <span>Enterprise Healthcare Management Architecture</span>
          <a href="/medxpert.html" className="text-slate-400 hover:text-white transition-colors">
            ← Switch to Patient & Doctor Portals
          </a>
        </div>
      </div>
    </div>
  );
}
