import React, { useState } from 'react';

/**
 * LoginModal Component
 * Renders the custom forms for logging in (Patient/Doctor/Admin) and signing up.
 * Supports credential autofilling for demo purposes and redirects successfully to /medxpert.html.
 */
export default function LoginModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleAutofill = (selectedRole) => {
    setRole(selectedRole);
    setPassword('');
    if (selectedRole === 'patient') {
      setEmail('saifiashad649@gmail.com');
    } else if (selectedRole === 'doctor') {
      setEmail('umaprajapati759@gmail.com');
    }
  };

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    handleAutofill(selectedRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (isSignUp && (!name || !phone)) {
      setErrorMsg('Please fill out all registration fields.');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (isSignUp) {
        // Sign Up
        res = await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, phone, role }),
        });
      } else {
        // Sign In
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Authentication failed');
      }

      // Store credentials in sessionStorage
      const currentUser = {
        ...data.user,
        token: data.token,
        profile: data.profile || (role === 'patient' ? { id: `P-${Math.floor(Math.random()*10000)}`, name: data.user.name } : { id: `D-${Math.floor(Math.random()*100)}`, name: data.user.name })
      };
      sessionStorage.setItem('medxpert_user', JSON.stringify(currentUser));
      sessionStorage.setItem('medxpert_role', role);

      setSuccessMsg('Authentication Successful! Redirecting to MedXpert portals...');
      setLoading(false);

      // Redirect to the vanilla app portals (medxpert.html)
      setTimeout(() => {
        window.location.href = '/medxpert.html';
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please check if the server is running.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-fadeIn z-10">
        
        {/* Switch tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              setIsSignUp(false);
            }}
            className={`flex-1 text-center py-4 font-bold text-sm transition-colors duration-150 ${
              !isSignUp
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 text-center py-4 font-bold text-sm transition-colors duration-150 ${
              isSignUp
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-slate-400 hover:text-slate-700 text-2xl font-bold focus:outline-none z-20"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Modal content body */}
        <div className="p-8">
          
          {/* Header Title */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="flex items-center space-x-2 text-2xl font-bold tracking-tight text-blue-900 mb-1">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <span className="text-xl">X</span>
              </div>
              <span className="font-extrabold text-blue-900">
                Med<span className="text-orange-500">X</span>pert
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isSignUp ? 'Create a secure health profile' : 'Sign in to access your portal'}
            </p>
          </div>

          {/* Error and Success alerts */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold mb-4">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-xs font-semibold mb-4 animate-pulse">
              ✓ {successMsg}
            </div>
          )}

          {/* Demo Autofills */}
          {!isSignUp && (
            <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-800 font-bold mb-2">Autofill Demo Credentials:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAutofill('patient')}
                  className="bg-white border border-blue-200 text-blue-700 font-bold py-1.5 px-2 rounded-lg text-2xs hover:bg-blue-50 transition-colors duration-150 text-center"
                >
                  🧑‍💼 Patient
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofill('doctor')}
                  className="bg-white border border-blue-200 text-blue-700 font-bold py-1.5 px-2 rounded-lg text-2xs hover:bg-blue-50 transition-colors duration-150 text-center"
                >
                  👨‍⚕️ Doctor
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role select */}
            <div className="form-group">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Portal Role</label>
              <select
                value={role}
                onChange={handleRoleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 text-sm text-slate-800 cursor-pointer transition-all duration-200"
              >
                <option value="patient">Patient Portal</option>
                <option value="doctor">Doctor Dashboard</option>
              </select>
            </div>

            {/* Signup details */}
            {isSignUp && (
              <>
                {/* Name */}
                <div className="form-group">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aarav Mehta"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 text-sm text-slate-800 transition-all duration-200"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 text-sm text-slate-800 transition-all duration-200"
                    required
                  />
                </div>
              </>
            )}

            {/* Email input */}
            <div className="form-group">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 text-sm text-slate-800 transition-all duration-200"
                required
              />
            </div>

            {/* Password input */}
            <div className="form-group">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 text-sm text-slate-800 transition-all duration-200"
                required
              />
            </div>

            {/* Form submit actions */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 transition-all duration-200 flex items-center justify-center space-x-2 ${
                loading ? 'opacity-80 cursor-wait' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
