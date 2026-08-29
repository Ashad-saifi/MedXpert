import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';

/**
 * App Root Component
 * Coordinates routing between Public Landing Page, Admin Login, and Admin Portal.
 */
export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    if (hash.includes('admin/login') || path === '/admin/login') return 'admin-login';
    if (hash.includes('admin') || path.startsWith('/admin')) return 'admin-portal';
    return 'landing';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.includes('admin/login') || path === '/admin/login') {
        setCurrentRoute('admin-login');
      } else if (hash.includes('admin') || path.startsWith('/admin')) {
        setCurrentRoute('admin-portal');
      } else {
        setCurrentRoute('landing');
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  if (currentRoute === 'admin-login') {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          window.location.hash = '#/admin/dashboard';
          setCurrentRoute('admin-portal');
        }}
      />
    );
  }

  if (currentRoute === 'admin-portal') {
    return (
      <AdminLayout
        onLogout={() => {
          window.location.hash = '#/admin/login';
          setCurrentRoute('admin-login');
        }}
      />
    );
  }

  return <LandingPage />;
}
