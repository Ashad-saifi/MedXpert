import React from 'react';
import Unauthorized403 from '../../pages/admin/Unauthorized403.jsx';
import AdminLogin from '../../pages/admin/AdminLogin.jsx';

/**
 * AdminProtectedRoute Component
 * Verifies that the current session is authenticated with role === 'admin'.
 * Renders Unauthorized403 if user is not an administrator, or AdminLogin if not logged in.
 */
export default function AdminProtectedRoute({ children }) {
  const storedUser = sessionStorage.getItem('medxpert_user');
  const storedRole = sessionStorage.getItem('medxpert_role');

  if (!storedUser || !storedRole) {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          window.location.hash = '#/admin/dashboard';
          window.location.reload();
        }}
      />
    );
  }

  try {
    const user = JSON.parse(storedUser);
    if (!user || !user.token || user.role !== 'admin' || storedRole !== 'admin') {
      return <Unauthorized403 userRole={user?.role || storedRole} />;
    }
  } catch (err) {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          window.location.hash = '#/admin/dashboard';
          window.location.reload();
        }}
      />
    );
  }

  return children;
}
