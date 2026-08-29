import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar.jsx';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import PatientList from './Patients/PatientList.jsx';
import DoctorList from './Doctors/DoctorList.jsx';
import PendingDoctors from './Doctors/PendingDoctors.jsx';
import AppointmentList from './Appointments/AppointmentList.jsx';
import MedicalRecordsList from './MedicalRecords/MedicalRecordsList.jsx';
import PrescriptionList from './Prescriptions/PrescriptionList.jsx';
import ReportsAnalytics from './Reports/ReportsAnalytics.jsx';
import NotificationCenter from './Notifications/NotificationCenter.jsx';
import AdminSettings from './Settings/AdminSettings.jsx';
import SecurityLogs from './Security/SecurityLogs.jsx';
import AdminProtectedRoute from '../../components/admin/AdminProtectedRoute.jsx';
import ErrorBoundary from '../../components/admin/ErrorBoundary.jsx';
import { apiFetch } from '../../utils/apiClient.js';

/**
 * AdminLayout Component
 * Master layout container for all authenticated MedXpert Admin Portal modules.
 */
export default function AdminLayout({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingDocsCount, setPendingDocsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminUser, setAdminUser] = useState(null);
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [liveToast, setLiveToast] = useState(null);

  const fetchBadges = async () => {
    try {
      const [docsRes, notifRes] = await Promise.all([
        apiFetch('/api/admin/doctors/pending'),
        apiFetch('/api/admin/notifications')
      ]);
      if (docsRes.ok) {
        const docs = await docsRes.json();
        setPendingDocsCount(docs.length);
      }
      if (notifRes.ok) {
        const notifs = await notifRes.json();
        setNotificationsCount(notifs.filter(n => !n.read).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem('medxpert_user');
    if (storedUser) {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }

    fetchBadges();

    // Real-Time WebSocket Synchronization Listener
    let ws;
    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:5000`;
      
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('⚡ Admin Portal Real-time WebSocket Connected');
          ws.send(JSON.stringify({
            type: 'register',
            role: 'admin',
            userId: 'admin-001',
            userName: 'System Administrator'
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('⚡ Real-time Event Received in Admin Portal:', data);

            // Handle live user login alert
            if (data.type === 'user-login') {
              const icon = data.role === 'doctor' ? '👨‍⚕️' : data.role === 'patient' ? '🧑‍🤝‍🧑' : '🛡️';
              setLiveToast({
                icon,
                title: `${icon} ${data.name || 'User'} Logged In`,
                text: `${data.role?.toUpperCase()} (${data.email}) just authenticated live at ${data.time}`,
                type: 'login'
              });
              setSyncTrigger(prev => prev + 1);
              fetchBadges();
            }

            // Handle live user registration alert
            if (data.type === 'user-registered') {
              const icon = data.role === 'doctor' ? '👨‍⚕️' : '🧑‍🤝‍🧑';
              setLiveToast({
                icon,
                title: `✨ New ${data.role} Registered!`,
                text: `${data.name} (${data.email}) created an account right now.`,
                type: 'register'
              });
              setSyncTrigger(prev => prev + 1);
              fetchBadges();
            }

            // Handle general db sync events (appointments, prescriptions, status changes)
            if (data.type === 'db-sync' || data.type === 'appointment-booked') {
              if (data.message) {
                setLiveToast({
                  icon: '⚡',
                  title: 'Real-time Hospital Update',
                  text: data.message,
                  type: 'sync'
                });
              }
              setSyncTrigger(prev => prev + 1);
              fetchBadges();
            }
          } catch (err) {
            console.error('Error processing WS event:', err);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket closed. Reconnecting in 3s...');
          setTimeout(connectWS, 3000);
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
      }
    };

    connectWS();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Auto clear live toast after 6 seconds
  useEffect(() => {
    if (liveToast) {
      const timer = setTimeout(() => setLiveToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [liveToast]);

  const titles = {
    dashboard: 'Administrative Intelligence & Analytics',
    patients: 'Patient Directory & Health Management',
    doctors: 'Certified Medical Staff Directory',
    'pending-doctors': 'Doctor Credential Verification',
    appointments: 'Clinical Consultation Schedules',
    'medical-records': 'Electronic Health Records (EHR)',
    prescriptions: 'Digital Prescription Audit',
    reports: 'Healthcare Reports & Financial Intelligence',
    notifications: 'Notification Center & Alerts',
    security: 'Security Audit & Compliance Trail',
    settings: 'Platform & Security Parameters'
  };

  const handleLogout = () => {
    sessionStorage.removeItem('medxpert_user');
    sessionStorage.removeItem('medxpert_role');
    if (onLogout) {
      onLogout();
    } else {
      window.location.hash = '#/admin/login';
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900 relative">
        {/* Real-time Floating Live Toast Alert */}
        {liveToast && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3.5 max-w-sm animate-bounce">
            <span className="text-xl shrink-0 mt-0.5">{liveToast.icon}</span>
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-extrabold text-white">{liveToast.title}</p>
              <p className="text-slate-300 mt-0.5 leading-relaxed">{liveToast.text}</p>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="text-slate-400 hover:text-white font-bold text-sm ml-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Collapsible Enterprise Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingDocsCount={pendingDocsCount}
          notificationsCount={notificationsCount}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onLogout={handleLogout}
        />

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            title={titles[activeTab] || 'Admin Control Center'}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            notificationsCount={notificationsCount}
            onOpenNotifications={() => setActiveTab('notifications')}
            onLogout={handleLogout}
            adminUser={adminUser}
          />

          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            <ErrorBoundary key={activeTab}>
              {activeTab === 'dashboard' && <AdminDashboard syncTrigger={syncTrigger} onNavigate={setActiveTab} />}
              {activeTab === 'patients' && <PatientList syncTrigger={syncTrigger} />}
              {activeTab === 'doctors' && <DoctorList syncTrigger={syncTrigger} />}
              {activeTab === 'pending-doctors' && <PendingDoctors syncTrigger={syncTrigger} onCountChange={setPendingDocsCount} />}
              {activeTab === 'appointments' && <AppointmentList syncTrigger={syncTrigger} />}
              {activeTab === 'medical-records' && <MedicalRecordsList syncTrigger={syncTrigger} />}
              {activeTab === 'prescriptions' && <PrescriptionList syncTrigger={syncTrigger} />}
              {activeTab === 'reports' && <ReportsAnalytics syncTrigger={syncTrigger} />}
              {activeTab === 'notifications' && <NotificationCenter syncTrigger={syncTrigger} onNavigate={setActiveTab} />}
              {activeTab === 'security' && <SecurityLogs syncTrigger={syncTrigger} />}
              {activeTab === 'settings' && <AdminSettings syncTrigger={syncTrigger} adminUser={adminUser} />}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
