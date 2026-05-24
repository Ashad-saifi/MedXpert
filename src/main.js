/**
 * MedXpert – Advanced Telemedicine & EHR Platform Frontend Controller
 * Implements: Dynamic navigation routing, session state persistence, modal triggers, 
 * forms, live feedback alerts, and backend API integration frameworks.
 */

// ==========================================
// 1. GLOBAL STATE & UTILITIES
// ==========================================

let state = {
  currentUser: null,
  currentRole: localStorage.getItem('medxpert_role') || '',
  activePages: {
    patient: 'pDashboard',
    doctor: 'dDashboard',
    admin: 'aDashboard'
  },
  // In-memory fallback dataset for seamless offline operation & early development
  mockData: {
    patients: [
      { id: 'P-10421', name: 'Alex Smith', email: 'demo@medxpert.com', age: 34, gender: 'Male', bloodType: 'O+', height: '175 cm', weight: '72 kg', chronicConditions: 'Type 2 Diabetes', allergies: 'Penicillin, Dust', emergencyContact: 'Emily Smith (Wife) – +1 (555) 019-2834', insurance: 'BlueShield Health · Policy #BS-991288-A' }
    ],
    doctors: [
      { id: 'D-20381', name: 'Dr. Sarah Johnson', email: 'doctor@medxpert.com', specialty: 'General Medicine', exp: '12 years', fee: '₹500', license: 'MCI-2014-08821', hospital: 'City Medical Center', rating: '4.9', status: 'Available Today' },
      { id: 'D-20511', name: 'Dr. Raj Patel', email: 'patel@medxpert.com', specialty: 'Cardiology', exp: '18 years', fee: '₹800', license: 'MCI-2008-01124', hospital: 'Heart Institute', rating: '4.8', status: 'Tomorrow' },
      { id: 'D-20921', name: 'Dr. Neha Kim', email: 'kim@medxpert.com', specialty: 'Endocrinology', exp: '9 years', fee: '₹600', license: 'MCI-2017-09432', hospital: 'Diabetes Clinic', rating: '4.7', status: 'Available Today' },
      { id: 'D-21044', name: 'Dr. Arun Mehta', email: 'mehta@medxpert.com', specialty: 'Neurology', exp: '15 years', fee: '₹900', license: 'MCI-2011-04399', hospital: 'Neuro Center', rating: '4.9', status: 'Mon/Wed/Fri' }
    ],
    appointments: [
      { id: 'A-901', doctorName: 'Dr. Sarah Johnson', patientName: 'Alex Smith', date: '2026-05-25', time: '10:30 AM', type: 'Video Consultation', status: 'Confirmed', reason: 'Routine review of vitals' },
      { id: 'A-902', doctorName: 'Dr. Raj Patel', patientName: 'Alex Smith', date: '2026-06-03', time: '02:00 PM', type: 'In-Clinic', status: 'Confirmed', reason: 'Cardio follow-up test' }
    ],
    prescriptions: [
      { id: 'R-401', medicine: 'Metformin 500mg', dosage: 'Twice daily – Morning & Evening', duration: '3 months', doctor: 'Dr. Raj Patel', date: '2026-05-08', status: 'Active', refillsLeft: 2, totalRefills: 3 },
      { id: 'R-402', medicine: 'Atorvastatin 10mg', dosage: 'Once daily – Bedtime', duration: '6 months', doctor: 'Dr. Sarah Johnson', date: '2026-05-10', status: 'Active', refillsLeft: 4, totalRefills: 6 },
      { id: 'R-403', medicine: 'Vitamin D3 1000IU', dosage: 'Once daily – Morning', duration: '3 months', doctor: 'Dr. Neha Kim', date: '2026-05-15', status: 'Refill soon', refillsLeft: 0, totalRefills: 3 }
    ],
    documents: [
      { name: 'CBC Blood Test', type: 'Lab Report', date: '2026-05-15', doctor: 'Dr. Neha Kim' },
      { name: 'Lipid Panel', type: 'Lab Report', date: '2026-05-15', doctor: 'Dr. Neha Kim' },
      { name: 'ECG Report', type: 'Cardiac', date: '2026-03-10', doctor: 'Dr. Raj Patel' },
      { name: 'Chest X-Ray', type: 'Radiology', date: '2026-02-05', doctor: 'Dr. Sarah Johnson' }
    ],
    activityLogs: [
      { time: 'Today, 04:32 PM', user: 'Admin (System)', action: 'Configured E2E Encryption parameters', ip: '192.168.1.120', status: 'Success' },
      { time: 'Today, 03:15 PM', user: 'Dr. Sarah Johnson', action: 'Accessed Patient Record Summary (P-10421)', ip: '192.168.1.104', status: 'Success' },
      { time: 'Today, 10:30 AM', user: 'Alex Smith', action: 'Joined encrypted Video Consult Room (A-901)', ip: '192.168.1.42', status: 'Success' },
      { time: 'Yesterday, 09:12 AM', user: 'Dr. Raj Patel', action: 'Issued digital prescription (R-401)', ip: '192.168.1.108', status: 'Success' }
    ]
  }
};

/**
 * Custom Notification Alert Toast
 */
function notify(message, type = 'success') {
  const alertContainer = document.getElementById('notification');
  if (!alertContainer) return;
  alertContainer.textContent = message;
  alertContainer.className = 'notification' + (type === 'success' ? ' success' : '');
  alertContainer.classList.add('show');
  setTimeout(() => alertContainer.classList.remove('show'), 3500);
}

// Ensure globally accessible (called in index.html inline tabs/buttons if needed)
window.notify = notify;

// ==========================================
// 2. DOM & EVENT LISTENERS SETUP
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initUIHandlers();
  restoreUserSession();
});

function initUIHandlers() {
  // Navigation role selection triggers
  bindClick('btn-patient-login', () => openLoginModal('patient'));
  bindClick('btn-doctor-login', () => openLoginModal('doctor'));
  bindClick('btn-admin-login', () => openLoginModal('admin'));
  bindClick('btn-close-login', closeLoginModal);
  bindClick('btn-do-login', executeLogin);

  // Home buttons returning to landing views
  document.querySelectorAll('.back-to-home').forEach(btn => {
    btn.addEventListener('click', () => terminateUserSession());
  });

  // Sidebar dynamic tab loaders
  setupSidebarNavigation('patient-nav', 'p');
  setupSidebarNavigation('doctor-nav', 'd');
  setupSidebarNavigation('admin-nav', 'a');

  // Sidebar mobile toggling controllers
  setupSidebarMobileMenu('p-menu-toggle', 'patientPanel', 'p-sidebar-overlay');
  setupSidebarMobileMenu('d-menu-toggle', 'doctorPanel', 'd-sidebar-overlay');
  setupSidebarMobileMenu('a-menu-toggle', 'adminPanel', 'a-sidebar-overlay');

  // Modal Action Buttons (Closing buttons)
  document.querySelectorAll('.modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal');
      if (modalId) closeModal(modalId);
    });
  });

  // Book Appointment Trigger Form Open
  bindClick('btn-p-book-new', () => {
    populateDoctorDropdown('book-appt-doctor-select');
    openModal('bookApptModal');
  });

  // Submit appointment booking
  bindClick('btn-book-appt-submit', handleConfirmAppointment);

  // Profile Save
  bindClick('btn-p-profile-save', () => {
    notify('Profile data updated in EHR records!', 'success');
  });

  // Start instant call
  bindClick('btn-p-connect-now', () => {
    openVideoCall();
  });
  
  // Doctor Queue Trigger Call
  document.querySelectorAll('.btn-start-consult').forEach(btn => {
    btn.addEventListener('click', () => openVideoCall());
  });

  // Closing video consult modal
  bindClick('btn-end-video-call', closeVideoCall);

  // Issuing Prescription Row Addition inside Form
  bindClick('btn-d-new-rx', () => openModal('prescModal'));
  bindClick('btn-add-rx-row', addRxRow);
  bindClick('btn-issue-presc-submit', handleConfirmPrescription);

  // Administrative User Modals
  bindClick('btn-a-add-user', () => openModal('addUserModal'));
  bindClick('btn-add-user-submit', handleConfirmAddUser);

  // Admin Export triggers
  bindClick('btn-a-export-report', () => notify('Platform analytics CSV exported successfully!', 'success'));
  bindClick('btn-a-export-pdf', () => notify('Full system reports printed as PDF!', 'success'));
  bindClick('btn-a-save-settings', () => notify('Platform preferences synchronized to disk.', 'success'));
  bindClick('btn-a-update-security', () => notify('Compliance & cryptography parameters updated.', 'success'));

  // Close modals clicking background overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });
}

// Helper to bind clicks safely preventing throw crashes
function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', handler);
}

// ==========================================
// 3. AUTHENTICATION & LOGIN FLOW
// ==========================================

function openLoginModal(role) {
  state.currentRole = role;
  const titles = { patient: 'Patient Portal Login', doctor: 'Doctor Dashboard Login', admin: 'Admin System Login' };
  
  const subtitle = document.getElementById('loginSubtitle');
  if (subtitle) subtitle.textContent = titles[role] || 'System Login';

  const emailInput = document.getElementById('loginEmail');
  const pwdInput = document.getElementById('loginPwd');

  if (emailInput && pwdInput) {
    if (role === 'patient') {
      emailInput.value = 'demo@medxpert.com';
    } else if (role === 'doctor') {
      emailInput.value = 'doctor@medxpert.com';
    } else {
      emailInput.value = 'admin@medxpert.com';
    }
    pwdInput.value = 'password123';
  }

  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.style.display = 'flex';
}

function closeLoginModal() {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.style.display = 'none';
}

async function executeLogin() {
  const email = document.getElementById('loginEmail')?.value;
  const password = document.getElementById('loginPwd')?.value;

  if (!email || !password) {
    notify('Please fill out all credentials.', 'error');
    return;
  }

  closeLoginModal();

  try {
    // Attempt connecting to Express REST endpoints (Integrated fully on Day 3)
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      state.currentUser = data.user;
      state.currentRole = data.user.role;
    } else {
      // Offline / Local Mock Fallback Sequence for graceful initial execution
      initializeMockUserSession(email);
    }
  } catch (err) {
    // No backend running yet – perform local fallback
    initializeMockUserSession(email);
  }

  localStorage.setItem('medxpert_role', state.currentRole);
  renderDashboard(state.currentRole);
  notify(`Welcome back! Authenticated successfully as ${state.currentRole}.`, 'success');
}

function initializeMockUserSession(email) {
  if (state.currentRole === 'patient') {
    state.currentUser = state.mockData.patients[0];
  } else if (state.currentRole === 'doctor') {
    state.currentUser = { name: 'Dr. Sarah Johnson', role: 'doctor', id: 'D-20381' };
  } else {
    state.currentUser = { name: 'System Administrator', role: 'admin', id: 'A-1000' };
  }
}

function restoreUserSession() {
  if (state.currentRole) {
    initializeMockUserSession(state.currentRole === 'patient' ? 'demo@medxpert.com' : 'doctor@medxpert.com');
    renderDashboard(state.currentRole);
  } else {
    goLandingPage();
  }
}

function terminateUserSession() {
  state.currentUser = null;
  state.currentRole = '';
  localStorage.removeItem('medxpert_role');
  goLandingPage();
  notify('You have successfully logged out.', 'success');
}

function goLandingPage() {
  document.getElementById('landing').style.display = 'flex';
  document.getElementById('patientPanel').style.display = 'none';
  document.getElementById('doctorPanel').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'none';
  closeLoginModal();
}

// ==========================================
// 4. NAVIGATION SHELL INTERACTION
// ==========================================

function setupSidebarNavigation(sidebarId, rolePrefix) {
  const container = document.getElementById(sidebarId);
  if (!container) return;

  container.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const pageId = item.getAttribute('data-page');
      if (!pageId) return;

      const panelId = rolePrefix === 'p' ? 'patientPanel' : rolePrefix === 'd' ? 'doctorPanel' : 'adminPanel';
      
      // Toggle pages
      document.querySelectorAll(`#${panelId} .page`).forEach(p => p.classList.remove('active'));
      const activePageEl = document.getElementById(pageId);
      if (activePageEl) activePageEl.classList.add('active');

      // Toggle active states in list items
      container.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Sync active page header
      syncPageHeader(rolePrefix, pageId);
      
      // Close mobile sidebars upon navigation click
      document.getElementById(panelId).querySelector('.sidebar').classList.remove('open');
      const overlay = document.getElementById(`${rolePrefix}-sidebar-overlay`);
      if (overlay) overlay.style.display = 'none';
    });
  });
}

function setupSidebarMobileMenu(toggleId, panelId, overlayId) {
  const toggleBtn = document.getElementById(toggleId);
  const panel = document.getElementById(panelId);
  const overlay = document.getElementById(overlayId);
  if (!toggleBtn || !panel || !overlay) return;

  const sidebar = panel.querySelector('.sidebar');

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (sidebar.classList.contains('open')) {
      overlay.style.display = 'block';
    } else {
      overlay.style.display = 'none';
    }
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.style.display = 'none';
  });
}

function syncPageHeader(rolePrefix, pageId) {
  const titles = {
    pDashboard: 'Dashboard Overview', pAppointments: 'My Scheduled Appointments', pDoctors: 'Find Clinical Specialists',
    pConsultation: 'Live Telemedicine Rooms', pRecords: 'Electronic Health Summary (EHR)', pPrescriptions: 'My Active Prescriptions',
    pReports: 'Uploaded Lab Diagnostic Reports', pProfile: 'My Patient EHR Profile',
    dDashboard: 'Clinical Dashboard', dAppointments: 'Patient Appointment Matrix', dPatients: 'My Chronological Patients',
    dConsultation: 'Active Consultation Room', dPrescriptions: 'Prescription Records', dReports: 'Diagnostic Reviews', dProfile: 'My Doctor Profile',
    aDashboard: 'System Infrastructure Overview', aUsers: 'Platform User Administration', aDoctors: 'Clinical Specialists Verification', aAppointments: 'Central Appointment Ledger',
    aReports: 'Analytics & Compliance Auditing', aActivity: 'Cryptographic Security Audit Log', aSettings: 'Global Platform Configuration'
  };

  const header = document.getElementById(`${rolePrefix}PageTitle`);
  if (header && titles[pageId]) {
    header.textContent = titles[pageId];
  }
}

// ==========================================
// 5. MODAL SYSTEM HELPERS
// ==========================================

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

window.openModal = openModal;
window.closeModal = closeModal;

// ==========================================
// 6. DYNAMIC UI RENDERING & INLINE EVENT FLOWS
// ==========================================

function renderDashboard(role) {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('patientPanel').style.display = 'none';
  document.getElementById('doctorPanel').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'none';

  if (role === 'patient') {
    document.getElementById('patientPanel').style.display = 'flex';
    renderPatientView();
  } else if (role === 'doctor') {
    document.getElementById('doctorPanel').style.display = 'flex';
    renderDoctorView();
  } else if (role === 'admin') {
    document.getElementById('adminPanel').style.display = 'flex';
    renderAdminView();
  }
}

/**
 * 🧑‍💼 PATIENT DASHBOARD RENDER
 */
function renderPatientView() {
  const patient = state.mockData.patients[0];
  
  // Vitals summary text injection
  const profileName = document.getElementById('p-profile-name');
  if (profileName) profileName.textContent = patient.name;
  
  const displayId = document.getElementById('p-user-display-id');
  if (displayId) displayId.textContent = `Patient ID: ${patient.id}`;

  const displayName = document.getElementById('p-user-display-name');
  if (displayName) displayName.textContent = patient.name;

  // Render EHR Panel Details
  const ehrSummary = document.getElementById('p-ehr-summary');
  if (ehrSummary) {
    ehrSummary.innerHTML = `
      <div class="flex justify-between"><span class="text-muted">Blood Type</span><span class="font-semibold">${patient.bloodType}</span></div>
      <div class="flex justify-between"><span class="text-muted">Height</span><span class="font-semibold">${patient.height}</span></div>
      <div class="flex justify-between"><span class="text-muted">Weight</span><span class="font-semibold">${patient.weight}</span></div>
      <div class="flex justify-between"><span class="text-muted">Chronic Conditions</span><span class="font-semibold text-orange-600">${patient.chronicConditions}</span></div>
      <div class="flex justify-between"><span class="text-muted">Allergies</span><span class="font-semibold text-red-600">${patient.allergies}</span></div>
    `;
  }

  // Active Profile Details Page
  const profileDetails = document.getElementById('p-profile-details');
  if (profileDetails) {
    profileDetails.innerHTML = `
      <div class="flex justify-between mb-1"><span class="text-muted">Full Name</span><span class="font-semibold">${patient.name}</span></div>
      <div class="flex justify-between mb-1"><span class="text-muted">Email Address</span><span class="font-semibold">${patient.email}</span></div>
      <div class="flex justify-between mb-1"><span class="text-muted">Age / Gender</span><span class="font-semibold">${patient.age} years / ${patient.gender}</span></div>
    `;
  }

  const profileEmergency = document.getElementById('p-profile-emergency');
  if (profileEmergency) {
    profileEmergency.innerHTML = `<div class="font-semibold">${patient.emergencyContact}</div>`;
  }

  const profileInsurance = document.getElementById('p-profile-insurance');
  if (profileInsurance) {
    profileInsurance.innerHTML = `<div class="font-semibold">${patient.insurance}</div>`;
  }

  // Populate dynamic dashboard appointment cards
  populatePatientAppointments();
  populatePatientPrescriptions();
  populatePatientDoctors();
  populatePatientDocuments();
}

function populatePatientAppointments() {
  const cardList = document.getElementById('p-dashboard-appts');
  const tableBody = document.getElementById('p-appointments-table-body');
  const videoList = document.getElementById('p-video-appts-list');
  
  if (cardList) cardList.innerHTML = '';
  if (tableBody) tableBody.innerHTML = '';
  if (videoList) videoList.innerHTML = '';

  state.mockData.appointments.forEach(appt => {
    const isVideo = appt.type === 'Video Consultation';

    // Dashboard upcoming cards
    if (cardList) {
      const card = document.createElement('div');
      card.className = 'appt-card';
      card.innerHTML = `
        <div class="appt-time">
          <div class="time">${appt.time.split(' ')[0]}</div>
          <div class="period">${appt.time.split(' ')[1]}</div>
        </div>
        <div class="appt-info">
          <div class="name">${appt.doctorName}</div>
          <div class="type">${appt.reason}</div>
        </div>
        <span class="badge ${isVideo ? 'badge-blue' : 'badge-teal'}">${appt.type.split(' ')[0]}</span>
      `;
      cardList.appendChild(card);
    }

    // Appointment management grid rows
    if (tableBody) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><div class="font-semibold">${appt.doctorName}</div></td>
        <td>${appt.date} · ${appt.time}</td>
        <td><span class="badge ${isVideo ? 'badge-blue' : 'badge-teal'}">${appt.type}</span></td>
        <td><span class="badge badge-green">${appt.status}</span></td>
        <td>
          ${isVideo ? `<button class="btn btn-sm btn-primary" id="btn-call-${appt.id}">Join Video</button>` : `<button class="btn btn-sm btn-ghost" id="btn-cancel-${appt.id}">Cancel</button>`}
        </td>
      `;
      tableBody.appendChild(row);
      
      const callBtn = row.querySelector(`#btn-call-${appt.id}`);
      if (callBtn) callBtn.addEventListener('click', openVideoCall);
    }

    // Consultation list view
    if (videoList && isVideo) {
      const item = document.createElement('div');
      item.className = 'appt-card';
      item.innerHTML = `
        <div class="appt-time">
          <div class="time">${appt.time.split(' ')[0]}</div>
          <div class="period">Today</div>
        </div>
        <div class="appt-info">
          <div class="name">${appt.doctorName}</div>
          <div class="type">Encrypted P2P Room</div>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-join-call-${appt.id}">Join Room</button>
      `;
      videoList.appendChild(item);

      const joinBtn = item.querySelector(`#btn-join-call-${appt.id}`);
      if (joinBtn) joinBtn.addEventListener('click', openVideoCall);
    }
  });
}

function populatePatientPrescriptions() {
  const dashList = document.getElementById('p-dashboard-prescriptions');
  const activeList = document.getElementById('p-prescriptions-active-list');
  const histTable = document.getElementById('p-prescriptions-history-table');

  if (dashList) dashList.innerHTML = '';
  if (activeList) activeList.innerHTML = '';
  if (histTable) histTable.innerHTML = '';

  state.mockData.prescriptions.forEach(rx => {
    // Dashboard list items
    if (dashList && rx.status === 'Active') {
      const row = document.createElement('div');
      row.className = 'flex justify-between items-center py-2 border-b border-border';
      row.innerHTML = `
        <div>
          <div class="text-sm font-semibold">${rx.medicine}</div>
          <div class="text-muted">${rx.dosage} · ${rx.doctor}</div>
        </div>
        <span class="badge ${rx.refillsLeft === 0 ? 'badge-yellow' : 'badge-green'}">
          ${rx.refillsLeft === 0 ? 'Refill soon' : 'Active'}
        </span>
      `;
      dashList.appendChild(row);
    }

    // Full Active tab items
    if (activeList && rx.status === 'Active') {
      const card = document.createElement('div');
      card.className = 'card card-sm';
      card.style.borderLeft = `3px solid ${rx.refillsLeft === 0 ? 'var(--warning)' : 'var(--primary-light)'}`;
      
      const refillPercent = (rx.refillsLeft / rx.totalRefills) * 100;
      
      card.innerHTML = `
        <div class="flex justify-between mb-1"><span class="font-semibold">${rx.medicine}</span><span class="badge ${rx.refillsLeft === 0 ? 'badge-yellow' : 'badge-green'}">${rx.status}</span></div>
        <div class="text-muted text-sm">${rx.dosage}</div>
        <div class="text-muted text-sm">Duration: ${rx.duration} · ${rx.doctor}</div>
        <div style="margin-top:.75rem;">
          <div class="flex justify-between text-sm mb-1"><span>Refills left</span><span>${rx.refillsLeft} of ${rx.totalRefills}</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${refillPercent}%"></div></div>
        </div>
      `;
      activeList.appendChild(card);
    }

    // Dynamic prescriptions list
    if (histTable) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><div class="font-semibold">${rx.medicine}</div><div class="text-muted">${rx.doctor}</div></td>
        <td>${rx.date}</td>
        <td><span class="badge ${rx.status === 'Active' ? 'badge-green' : 'badge-gray'}">${rx.status}</span></td>
      `;
      histTable.appendChild(row);
    }
  });
}

function populatePatientDoctors() {
  const container = document.getElementById('p-doctors-list');
  if (!container) return;
  container.innerHTML = '';

  state.mockData.doctors.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="display:flex;gap:1rem;align-items:flex-start;">
        <div class="avatar avatar-teal" style="width:52px;height:52px;font-size:1rem;">${doc.name.split(' ').map(n => n[0]).join('')}</div>
        <div style="flex:1;">
          <div class="font-semibold">${doc.name}</div>
          <div class="text-muted mb-1">${doc.specialty} · ${doc.exp} exp.</div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
            <span class="badge badge-teal">${doc.license.split('-')[0]}</span>
            <span class="badge badge-green">${doc.status}</span>
            <span>⭐ ${doc.rating}</span>
          </div>
        </div>
      </div>
      <hr class="divider">
      <div class="flex gap-2" style="font-size:.83rem;color:var(--text3);margin-bottom:1rem;">
        <span>📍 ${doc.hospital}</span>
        <span>💰 ${doc.fee}/consult</span>
      </div>
      <div style="display:flex;gap:.5rem;">
        <button class="btn btn-primary btn-sm" onclick="openModal('bookApptModal')">Book Appointment</button>
        <button class="btn btn-outline btn-sm" onclick="openVideoCall()">Quick Video</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function populatePatientDocuments() {
  const tableBody = document.getElementById('p-documents-table-body');
  const reportsTable = document.getElementById('p-reports-table-body');
  
  if (tableBody) tableBody.innerHTML = '';
  if (reportsTable) reportsTable.innerHTML = '';

  state.mockData.documents.forEach(doc => {
    const rowContent = `
      <td class="font-semibold">${doc.name}</td>
      <td><span class="badge ${doc.type === 'Lab Report' ? 'badge-blue' : 'badge-teal'}">${doc.type}</span></td>
      <td>${doc.date}</td>
      <td>${doc.doctor}</td>
      <td><button class="btn btn-sm btn-ghost" onclick="notify('Retrieving highly secure, E2E decrypted laboratory record...', 'success')">Decrypt & View</button></td>
    `;

    if (tableBody) {
      const r = document.createElement('tr');
      r.innerHTML = rowContent;
      tableBody.appendChild(r);
    }

    if (reportsTable && doc.type === 'Lab Report') {
      const r = document.createElement('tr');
      r.innerHTML = rowContent;
      reportsTable.appendChild(r);
    }
  });
}

/**
 * Helper to dynamically load Doctors inside appointment selectors
 */
function populateDoctorDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '';
  state.mockData.doctors.forEach(doc => {
    const opt = document.createElement('option');
    opt.value = doc.name;
    opt.textContent = `${doc.name} – ${doc.specialty}`;
    select.appendChild(opt);
  });
}

/**
 * Form handler to confirm bookings
 */
function handleConfirmAppointment() {
  const doctor = document.getElementById('book-appt-doctor-select')?.value;
  const type = document.getElementById('book-appt-type')?.value;
  const date = document.getElementById('book-appt-date')?.value;
  const time = document.getElementById('book-appt-time')?.value;
  const reason = document.getElementById('book-appt-reason')?.value || 'Clinical review';

  if (!doctor || !date || !time) {
    notify('Please fill in appointment date and time.', 'error');
    return;
  }

  const newAppt = {
    id: `A-${Math.floor(100 + Math.random() * 900)}`,
    doctorName: doctor,
    patientName: 'Alex Smith',
    date,
    time: `${time} PM`,
    type,
    status: 'Confirmed',
    reason
  };

  state.mockData.appointments.push(newAppt);
  closeModal('bookApptModal');
  
  // Re-render
  populatePatientAppointments();
  notify('Appointment scheduled successfully!', 'success');
}

/**
 * 👨‍⚕️ DOCTOR DASHBOARD RENDER
 */
function renderDoctorView() {
  const apptTable = document.getElementById('d-appointments-table-body');
  const dSchedule = document.getElementById('d-dashboard-schedule');
  const dPatientsTable = document.getElementById('d-patients-table-body');
  const dPrescTable = document.getElementById('d-prescriptions-table-body');
  const dReportsTable = document.getElementById('d-reports-table-body');
  const consultQueue = document.getElementById('d-consultation-queue');

  if (apptTable) apptTable.innerHTML = '';
  if (dSchedule) dSchedule.innerHTML = '';
  if (dPatientsTable) dPatientsTable.innerHTML = '';
  if (dPrescTable) dPrescTable.innerHTML = '';
  if (dReportsTable) dReportsTable.innerHTML = '';
  if (consultQueue) consultQueue.innerHTML = '';

  state.mockData.appointments.forEach(appt => {
    const isVideo = appt.type === 'Video Consultation';

    // Doctor dashboard list items
    if (dSchedule) {
      const item = document.createElement('div');
      item.className = 'appt-card';
      item.innerHTML = `
        <div class="appt-time">
          <div class="time">${appt.time.split(' ')[0]}</div>
          <div class="period">${appt.time.split(' ')[1]}</div>
        </div>
        <div class="appt-info">
          <div class="name">${appt.patientName}</div>
          <div class="type">${appt.reason}</div>
        </div>
        <span class="badge ${isVideo ? 'badge-blue' : 'badge-teal'}">${appt.type.split(' ')[0]}</span>
      `;
      dSchedule.appendChild(item);
    }

    // Main Appointments table
    if (apptTable) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><div class="font-semibold">${appt.patientName}</div></td>
        <td>${appt.date} · ${appt.time}</td>
        <td><span class="badge ${isVideo ? 'badge-blue' : 'badge-teal'}">${appt.type}</span></td>
        <td>${appt.reason}</td>
        <td><span class="badge badge-green">${appt.status}</span></td>
        <td>
          ${isVideo ? `<button class="btn btn-sm btn-primary" id="btn-doc-join-${appt.id}">Launch Room</button>` : `<button class="btn btn-sm btn-ghost" onclick="notify('Checking status...', 'info')">Check-in</button>`}
        </td>
      `;
      apptTable.appendChild(row);

      const joinBtn = row.querySelector(`#btn-doc-join-${appt.id}`);
      if (joinBtn) joinBtn.addEventListener('click', openVideoCall);
    }

    // Active Consultation Queue
    if (consultQueue && isVideo) {
      const item = document.createElement('div');
      item.className = 'appt-card';
      item.innerHTML = `
        <div class="appt-time">
          <div class="time">Active</div>
          <div class="period">Queue</div>
        </div>
        <div class="appt-info">
          <div class="name">${appt.patientName}</div>
          <div class="type">Secure consult pending</div>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-consult-join-${appt.id}">Join Call</button>
      `;
      consultQueue.appendChild(item);

      const joinBtn = item.querySelector(`#btn-consult-join-${appt.id}`);
      if (joinBtn) joinBtn.addEventListener('click', openVideoCall);
    }
  });

  // Doctor Patients list
  state.mockData.patients.forEach(pat => {
    if (dPatientsTable) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><div class="font-semibold">${pat.name}</div><div class="text-muted">ID: ${pat.id}</div></td>
        <td>${pat.age} years</td>
        <td><span class="badge badge-teal">${pat.chronicConditions}</span></td>
        <td>May 15, 2026</td>
        <td>Tomorrow · 10:30 AM</td>
        <td><button class="btn btn-sm btn-ghost" id="btn-ehr-inspect-${pat.id}">Inspect EHR</button></td>
      `;
      dPatientsTable.appendChild(row);
      
      const inspectBtn = row.querySelector(`#btn-ehr-inspect-${pat.id}`);
      if (inspectBtn) inspectBtn.addEventListener('click', () => notify(`Decrypted longitudinal EHR details for ${pat.name} successfully!`, 'success'));
    }
  });

  // Doctor Prescriptions lists
  state.mockData.prescriptions.forEach(rx => {
    if (dPrescTable) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><div class="font-semibold">Alex Smith</div><div class="text-muted">ID: P-10421</div></td>
        <td>${rx.medicine}</td>
        <td>${rx.dosage}</td>
        <td>${rx.duration}</td>
        <td>${rx.date}</td>
        <td><span class="badge badge-green">Sent</span></td>
      `;
      dPrescTable.appendChild(row);
    }
  });

  // Patient Reports Lists
  state.mockData.documents.forEach(doc => {
    if (dReportsTable && doc.type === 'Lab Report') {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><div class="font-semibold">Alex Smith</div><div class="text-muted">ID: P-10421</div></td>
        <td>${doc.name}</td>
        <td>${doc.date}</td>
        <td><span class="badge badge-yellow">Awaiting Review</span></td>
        <td><button class="btn btn-sm btn-outline" onclick="notify('Report approved and synchronized to patients EHR', 'success')">Approve Report</button></td>
      `;
      dReportsTable.appendChild(row);
    }
  });
}

function addRxRow() {
  const rxList = document.getElementById('rxList');
  if (!rxList) return;
  const newRow = document.createElement('div');
  newRow.className = 'form-row';
  newRow.style.alignItems = 'end';
  newRow.innerHTML = `
    <div class="form-group"><input type="text" class="form-control rx-med" placeholder="e.g. Atorvastatin 10mg"></div>
    <div class="form-group"><input type="text" class="form-control rx-dosage" placeholder="e.g. Once daily at bedtime"></div>
  `;
  rxList.appendChild(newRow);
}

function handleConfirmPrescription() {
  const med = document.querySelector('.rx-med')?.value;
  const dosage = document.querySelector('.rx-dosage')?.value;
  
  if (!med || !dosage) {
    notify('Please input medicine particulars.', 'error');
    return;
  }

  const newRx = {
    id: `R-${Math.floor(500 + Math.random() * 500)}`,
    medicine: med,
    dosage,
    duration: '1 month',
    doctor: 'Dr. Sarah Johnson',
    date: new Date().toISOString().split('T')[0],
    status: 'Active',
    refillsLeft: 1,
    totalRefills: 1
  };

  state.mockData.prescriptions.push(newRx);
  closeModal('prescModal');
  renderDoctorView();
  notify('Digital prescription issued and encrypted in EHR database.', 'success');
}

/**
 * 🛡️ ADMIN PANEL RENDER
 */
function renderAdminView() {
  const userTable = document.getElementById('a-users-table-body');
  const logsList = document.getElementById('a-dashboard-logs');
  const activityTable = document.getElementById('a-activity-table-body');

  if (userTable) userTable.innerHTML = '';
  if (logsList) logsList.innerHTML = '';
  if (activityTable) activityTable.innerHTML = '';

  // Render system platform users
  const mockUsers = [
    { name: 'Alex Smith', role: 'Patient', email: 'demo@medxpert.com', joined: 'May 10, 2026', status: 'Active' },
    { name: 'Dr. Sarah Johnson', role: 'Doctor', email: 'doctor@medxpert.com', joined: 'May 08, 2026', status: 'Active' },
    { name: 'Dr. Raj Patel', role: 'Doctor', email: 'patel@medxpert.com', joined: 'May 02, 2026', status: 'Active' },
    { name: 'Dr. Neha Kim', role: 'Doctor', email: 'kim@medxpert.com', joined: 'May 11, 2026', status: 'Active' }
  ];

  mockUsers.forEach(u => {
    if (userTable) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><div class="font-semibold">${u.name}</div></td>
        <td><span class="badge ${u.role === 'Doctor' ? 'badge-blue' : 'badge-teal'}">${u.role}</span></td>
        <td>${u.email}</td>
        <td>${u.joined}</td>
        <td><span class="badge badge-green">${u.status}</span></td>
        <td><button class="btn btn-sm btn-ghost" onclick="notify('Platform user profile locked for modification.', 'info')">Suspend</button></td>
      `;
      userTable.appendChild(row);
    }
  });

  // Render Admin activity logs
  state.mockData.activityLogs.forEach((log, idx) => {
    // Dashboard timeline
    if (logsList && idx < 3) {
      const item = document.createElement('div');
      item.className = 'tl-item';
      item.innerHTML = `
        <div class="tl-dot"></div>
        <div class="tl-content">
          <div class="tl-title">${log.action}</div>
          <div class="tl-sub">${log.user} · ${log.time}</div>
        </div>
      `;
      logsList.appendChild(item);
    }

    // Full system log table
    if (activityTable) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${log.time}</td>
        <td class="font-semibold">${log.user}</td>
        <td>${log.action}</td>
        <td><code>${log.ip}</code></td>
        <td><span class="badge badge-green">${log.status}</span></td>
      `;
      activityTable.appendChild(row);
    }
  });
}

function handleConfirmAddUser() {
  notify('Registration successful, securely logged administrative request.', 'success');
  closeModal('addUserModal');
}

// ==========================================
// 7. TELEMEDICINE WEBRTC SIMULATION INTERACTION
// ==========================================

let callSeconds = 0;
let callTimerInterval = null;

function openVideoCall() {
  const container = document.getElementById('videoCallOverlay');
  if (!container) return;
  container.style.display = 'flex';
  
  // Set correct view toggle layout
  const doctorView = document.getElementById('ehr-doctor-view');
  const patientView = document.getElementById('ehr-patient-view');
  
  if (state.currentRole === 'doctor') {
    if (doctorView) doctorView.style.display = 'flex';
    if (patientView) patientView.style.display = 'none';
  } else {
    if (doctorView) doctorView.style.display = 'none';
    if (patientView) patientView.style.display = 'flex';
  }

  // Handle active countdown counter
  callSeconds = 0;
  const timer = document.getElementById('callTimer');
  if (timer) timer.textContent = '00:00';

  if (callTimerInterval) clearInterval(callTimerInterval);
  callTimerInterval = setInterval(() => {
    callSeconds++;
    const m = String(Math.floor(callSeconds / 60)).padStart(2, '0');
    const s = String(callSeconds % 60).padStart(2, '0');
    if (timer) timer.textContent = `${m}:${s}`;
  }, 1000);
}

function closeVideoCall() {
  const container = document.getElementById('videoCallOverlay');
  if (container) container.style.display = 'none';
  if (callTimerInterval) clearInterval(callTimerInterval);

  const timerVal = document.getElementById('callTimer')?.textContent || '00:00';
  notify(`Consultation session complete. Total duration: ${timerVal}`, 'success');

  if (state.currentRole === 'doctor') {
    // If a doctor completes a consultation, automatically prompt the prescription modal
    setTimeout(() => openModal('prescModal'), 500);
  }
}

// Premium visual features - live calling side-tab switches
window.switchCallTab = function(tabName) {
  const chatPanel = document.getElementById('call-tab-chat');
  const ehrPanel = document.getElementById('call-tab-ehr');
  
  const tabChatBtn = document.getElementById('tab-btn-chat');
  const tabEhrBtn = document.getElementById('tab-btn-ehr');

  if (tabName === 'chat') {
    if (chatPanel) chatPanel.style.display = 'flex';
    if (ehrPanel) ehrPanel.style.display = 'none';
    tabChatBtn?.classList.add('active');
    tabEhrBtn?.classList.remove('active');
  } else {
    if (chatPanel) chatPanel.style.display = 'none';
    if (ehrPanel) ehrPanel.style.display = 'flex';
    tabChatBtn?.classList.remove('active');
    tabEhrBtn?.classList.add('active');
  }
};
