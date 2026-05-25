// MedXpert Core Application JavaScript

// Base API configuration (proxied via Vite server)
const API_BASE = '/api';

// Application State
let currentRole = '';
let currentUser = null;
let callInterval = null;
let callSeconds = 0;
let doctorsData = [];
let appointmentsData = [];
let prescriptionsData = [];
let reportsData = [];
let patientData = null;
let localStream = null;
let screenStream = null;
let currentReplyIndex = 0;

const doctorChatReplies = [
  "Hello! I am reviewing Your health records. How have you been feeling since your last appointment?",
  "I see. Have you been experiencing any other symptoms, like headache, fever, or shortness of breath?",
  "Let's review your recent lab test results. They look quite stable, but I'd like to check your daily vitals.",
  "I will update your prescriptions list. Please take the Metformin twice daily with meals.",
  "Make sure to monitor your symptoms closely. If there's any discomfort, feel free to call again. Stay hydrated!"
];

const patientChatReplies = [
  "Hello Doctor! I've been feeling generally fine, but I wanted to discuss my daily medication dosage.",
  "No other major symptoms, just some slight fatigue in the evening hours.",
  "Yes, I have been taking the metformin regularly after breakfast and dinner.",
  "Understood. Should I continue this dosage schedule for the next three weeks?",
  "Thank you so much, Doctor! I will upload the new lab reports as soon as they are ready."
];


// Initialize Event Listeners on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
});

function initEventListeners() {
  // Landing login triggers
  document.getElementById('btn-patient-login')?.addEventListener('click', () => openLogin('patient'));
  document.getElementById('btn-doctor-login')?.addEventListener('click', () => openLogin('doctor'));
  document.getElementById('btn-admin-login')?.addEventListener('click', () => openLogin('admin'));

  // Login controls
  document.getElementById('btn-do-login')?.addEventListener('click', doLogin);
  document.getElementById('btn-close-login')?.addEventListener('click', closeLogin);

  // Back to home controls (sidebar footers)
  document.querySelectorAll('.back-to-home').forEach(btn => {
    btn.addEventListener('click', goLanding);
  });

  // Modal close buttons (cancel)
  document.querySelectorAll('.modal-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalId = btn.getAttribute('data-modal');
      if (modalId) closeModal(modalId);
    });
  });

  // Page navigation click handlers
  bindSidebarNavs('patient-nav', 'p');
  bindSidebarNavs('doctor-nav', 'd');
  bindSidebarNavs('admin-nav', 'a');

  // Video call controls
  document.getElementById('btn-end-video-call')?.addEventListener('click', closeVideoCall);
  document.getElementById('btn-p-connect-now')?.addEventListener('click', () => openVideoCall('Doctor'));
  document.querySelector('.btn-start-consult')?.addEventListener('click', () => openVideoCall('Patient'));

  // Custom video toggles
  document.querySelector('.mic-toggle')?.addEventListener('click', function () {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const isMuted = !audioTrack.enabled;
        this.style.opacity = isMuted ? '0.5' : '1';
        notify(isMuted ? 'Microphone muted' : 'Microphone unmuted', '');
      } else {
        notify('No active microphone found', 'error');
      }
    } else {
      this.style.opacity = this.style.opacity == '0.5' ? '1' : '0.5';
      notify(this.style.opacity == '0.5' ? 'Microphone muted' : 'Microphone unmuted', '');
    }
  });
  document.querySelector('.camera-toggle')?.addEventListener('click', function () {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const isDisabled = !videoTrack.enabled;
        this.style.opacity = isDisabled ? '0.5' : '1';

        const localVideo = document.getElementById('localVideo');
        const placeholder = document.getElementById('localVideoPlaceholder');
        if (localVideo) {
          localVideo.style.display = isDisabled ? 'none' : 'block';
        }
        if (placeholder) {
          placeholder.style.display = isDisabled ? 'inline' : 'none';
        }

        notify(isDisabled ? 'Camera disabled' : 'Camera enabled', '');
      } else {
        notify('No active camera found', 'error');
      }
    } else {
      this.style.opacity = this.style.opacity == '0.5' ? '1' : '0.5';
      notify(this.style.opacity == '0.5' ? 'Camera disabled' : 'Camera enabled', '');
    }
  });

  // Custom video screen share and chat triggers
  document.querySelector('.screen-share-toggle')?.addEventListener('click', function () {
    toggleScreenShare(this);
  });
  document.querySelector('.chat-toggle')?.addEventListener('click', function () {
    toggleVideoChat(this);
  });
  document.getElementById('btn-close-video-chat')?.addEventListener('click', () => {
    const chatBtn = document.querySelector('.chat-toggle');
    if (chatBtn) toggleVideoChat(chatBtn);
  });
  document.getElementById('btn-send-video-message')?.addEventListener('click', sendVideoChatMessage);
  document.getElementById('videoChatInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendVideoChatMessage();
    }
  });

  // Patient features
  document.getElementById('btn-p-book-new')?.addEventListener('click', () => openBookAppointmentModal());
  document.getElementById('btn-book-appt-submit')?.addEventListener('click', submitBookAppointment);
  document.querySelectorAll('.btn-p-upload-report').forEach(btn => {
    btn.addEventListener('click', () => triggerReportUpload());
  });
  document.querySelectorAll('.btn-p-download-all').forEach(btn => {
    btn.addEventListener('click', () => downloadRecords());
  });
  document.getElementById('btn-p-profile-save')?.addEventListener('click', () => savePatientProfile());

  // Doctor features
  document.getElementById('btn-add-rx-row')?.addEventListener('click', addRxRow);
  document.getElementById('btn-d-new-rx')?.addEventListener('click', () => openModal('prescModal'));
  document.getElementById('btn-issue-presc-submit')?.addEventListener('click', submitIssuePrescription);
  document.getElementById('btn-d-save-draft')?.addEventListener('click', () => notify('Draft consultation notes saved', ''));
  document.getElementById('btn-d-proceed-rx')?.addEventListener('click', proceedToPrescription);
  document.getElementById('btn-d-profile-edit')?.addEventListener('click', () => notify('Doctor profile changes saved', 'success'));
  document.getElementById('d-action-review-now')?.addEventListener('click', () => {
    showPage('d', 'dReports');
    notify('Opened pending lab reports for review', 'success');
  });
  document.getElementById('d-action-issue-rx')?.addEventListener('click', () => {
    openModal('prescModal');
  });
  document.getElementById('d-action-create-referral')?.addEventListener('click', () => {
    notify('Referral letter generated successfully', 'success');
  });

  // Admin features
  document.getElementById('btn-a-export-report')?.addEventListener('click', () => notify('System report exported to PDF', 'success'));
  document.getElementById('btn-a-export-pdf')?.addEventListener('click', () => notify('Monthly analytics downloaded', 'success'));
  document.getElementById('btn-a-add-user')?.addEventListener('click', () => openModal('addUserModal'));
  document.getElementById('btn-add-user-submit')?.addEventListener('click', submitAddUser);
  document.getElementById('btn-a-save-settings')?.addEventListener('click', saveAdminSettings);
  document.getElementById('btn-a-update-security')?.addEventListener('click', () => notify('Security parameters updated successfully', 'success'));

  // Dynamic filter event triggers
  document.getElementById('p-doctors-search')?.addEventListener('input', filterDoctors);
  document.getElementById('p-doctors-specialty-filter')?.addEventListener('change', filterDoctors);
  document.getElementById('d-patient-search')?.addEventListener('input', filterPatients);
  document.getElementById('d-patient-condition-filter')?.addEventListener('change', filterPatients);
  document.getElementById('a-users-search')?.addEventListener('input', filterAdminUsers);

  // Close modals on overlay backdrop clicks
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });

  // Mobile sidebar toggles
  document.querySelectorAll('.menu-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parentShell = btn.closest('.app-shell');
      if (parentShell) {
        parentShell.querySelector('.sidebar')?.classList.toggle('open');
        parentShell.querySelector('.sidebar-mobile-overlay')?.classList.toggle('active');
      }
    });
  });

  // Mobile sidebar backdrop overlay clicks
  document.querySelectorAll('.sidebar-mobile-overlay').forEach(overlay => {
    overlay.addEventListener('click', () => {
      const parentShell = overlay.closest('.app-shell');
      if (parentShell) {
        parentShell.querySelector('.sidebar')?.classList.remove('open');
        overlay.classList.remove('active');
      }
    });
  });
}

// Bind navigation actions to sidebar lists
function bindSidebarNavs(navId, prefix) {
  const navContainer = document.getElementById(navId);
  if (!navContainer) return;
  navContainer.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const pageId = item.getAttribute('data-page');
      if (pageId) {
        showPage(prefix, pageId, item);
      }
      // Auto-close sidebar on mobile after clicking item
      const parentShell = item.closest('.app-shell');
      if (parentShell) {
        parentShell.querySelector('.sidebar')?.classList.remove('open');
        parentShell.querySelector('.sidebar-mobile-overlay')?.classList.remove('active');
      }
    });
  });
  // Connect section link links (like Dashboard View Alls)
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const pageId = link.getAttribute('data-page');
      if (pageId) {
        const matchingNavItem = navContainer.querySelector(`[data-page="${pageId}"]`);
        showPage(prefix, pageId, matchingNavItem);
      }
    });
  });
}

// ── UTILITY FUNCTIONS ──
function notify(msg, type) {
  const n = document.getElementById('notification');
  if (!n) return;
  n.textContent = msg;
  n.className = 'notification' + (type === 'success' ? ' success' : '');
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 3500);
}

function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

// ── APP SCREEN CONTROL ──
function openLogin(role) {
  currentRole = role;
  const titles = { patient: 'Patient Login', doctor: 'Doctor Login', admin: 'Admin Login' };
  const subtitleEl = document.getElementById('loginSubtitle');
  if (subtitleEl) subtitleEl.textContent = titles[role] || 'Login';

  // Prefill credentials based on role
  const emailInput = document.getElementById('loginEmail');
  const pwdInput = document.getElementById('loginPwd');
  if (emailInput && pwdInput) {
    if (role === 'patient') {
      emailInput.value = 'alex@email.com';
    } else if (role === 'doctor') {
      emailInput.value = 'sarah@hospital.com';
    } else {
      emailInput.value = 'admin@medxpert.com';
    }
    pwdInput.value = 'password123';
  }

  const loginOverlay = document.getElementById('loginOverlay');
  if (loginOverlay) loginOverlay.style.display = 'flex';
}

function closeLogin() {
  const loginOverlay = document.getElementById('loginOverlay');
  if (loginOverlay) loginOverlay.style.display = 'none';
}

async function doLogin() {
  const email = document.getElementById('loginEmail')?.value;
  const password = document.getElementById('loginPwd')?.value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: currentRole })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error during login');

    currentUser = data.user;
    closeLogin();

    // Hide all panel screens
    document.getElementById('landing').style.display = 'none';
    document.getElementById('patientPanel').style.display = 'none';
    document.getElementById('doctorPanel').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'none';

    // Display dashboard
    if (currentRole === 'patient') {
      document.getElementById('patientPanel').style.display = 'flex';
      await loadPatientData();
      showPage('p', 'pDashboard', document.querySelector('#patient-nav [data-page="pDashboard"]'));
    } else if (currentRole === 'doctor') {
      document.getElementById('doctorPanel').style.display = 'flex';
      await loadDoctorData();
      showPage('d', 'dDashboard', document.querySelector('#doctor-nav [data-page="dDashboard"]'));
    } else {
      document.getElementById('adminPanel').style.display = 'flex';
      await loadAdminData();
      showPage('a', 'aDashboard', document.querySelector('#admin-nav [data-page="aDashboard"]'));
    }

    notify(data.message, 'success');
  } catch (err) {
    notify(err.message, 'error');
  }
}

function goLanding() {
  document.getElementById('landing').style.display = 'flex';
  document.getElementById('patientPanel').style.display = 'none';
  document.getElementById('doctorPanel').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'none';
  currentUser = null;
  currentRole = '';
}

async function showPage(prefix, pageId, el) {
  const panel = prefix === 'p' ? 'patientPanel' : prefix === 'd' ? 'doctorPanel' : 'adminPanel';

  // Toggle screens
  document.querySelectorAll(`#${panel} .page`).forEach(p => p.classList.remove('active'));
  document.getElementById(pageId)?.classList.add('active');

  // Highlight active nav
  document.querySelectorAll(`#${panel} .nav-item`).forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');

  // Update header text
  const titles = {
    pDashboard: 'Dashboard', pAppointments: 'My Appointments', pDoctors: 'Find Doctors',
    pConsultation: 'Video Consultation', pRecords: 'Medical Records', pPrescriptions: 'Prescriptions',
    pReports: 'Lab Reports', pProfile: 'My Profile',
    dDashboard: 'Dashboard', dAppointments: 'Appointments', dPatients: 'My Patients',
    dConsultation: 'Consultation Room', dPrescriptions: 'Prescriptions', dReports: 'Patient Reports', dProfile: 'My Profile',
    aDashboard: 'Dashboard', aUsers: 'Manage Users', aDoctors: 'Manage Doctors', aAppointments: 'All Appointments',
    aReports: 'Reports & Analytics', aActivity: 'Activity Log', aSettings: 'System Settings'
  };
  const titleEl = document.getElementById(prefix + 'PageTitle');
  if (titleEl && titles[pageId]) {
    titleEl.textContent = titles[pageId];
  }

  // Refresh content on navigate
  if (prefix === 'p') {
    await loadPatientData();
  } else if (prefix === 'd') {
    await loadDoctorData();
  } else {
    await loadAdminData();
  }
}

// ── VIDEO ROOM CONTROLLER ──
async function openVideoCall(partnerName = 'Doctor') {
  const overlay = document.getElementById('videoCallOverlay');
  if (!overlay) return;

  const timer = document.getElementById('callTimer');
  const partnerEl = document.getElementById('video-partner-name');
  const partnerSub = document.getElementById('video-partner-sub');
  const pulseRing = document.getElementById('videoPulseRing');

  if (partnerEl) {
    partnerEl.textContent = `${partnerName} · Connecting...`;
    setTimeout(() => {
      partnerEl.textContent = `${partnerName} (Connected)`;
    }, 1500);
  }

  overlay.style.display = 'flex';
  callSeconds = 0;
  if (timer) timer.textContent = '00:00';

  if (callInterval) clearInterval(callInterval);
  callInterval = setInterval(() => {
    callSeconds++;
    const m = String(Math.floor(callSeconds / 60)).padStart(2, '0');
    const s = String(callSeconds % 60).padStart(2, '0');
    if (timer) timer.textContent = `${m}:${s}`;
  }, 1000);

  // Reset video layout text views
  if (partnerEl) partnerEl.style.display = 'block';
  if (partnerSub) partnerSub.style.display = 'block';
  if (pulseRing) pulseRing.style.display = 'block';

  // Reset chat state
  currentReplyIndex = 0;
  const chatPanel = document.getElementById('videoChatPanel');
  if (chatPanel) chatPanel.style.display = 'none';

  const chatMessages = document.getElementById('videoChatMessages');
  if (chatMessages) {
    chatMessages.innerHTML = `
      <div class="chat-msg system">
        <span class="text">Chat session started. All messages are encrypted.</span>
      </div>
    `;
  }

  const chatToggle = document.querySelector('.chat-toggle');
  if (chatToggle) {
    chatToggle.style.background = '';
    chatToggle.style.opacity = '1';
  }

  // Reset screen share button
  const screenToggle = document.querySelector('.screen-share-toggle');
  if (screenToggle) {
    screenToggle.style.background = '';
    screenToggle.style.opacity = '1';
  }

  // Access user's camera and microphone
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream = stream;

    const localVideo = document.getElementById('localVideo');
    const placeholder = document.getElementById('localVideoPlaceholder');
    if (localVideo) {
      localVideo.srcObject = stream;
      localVideo.style.display = 'block';
    }
    if (placeholder) {
      placeholder.style.display = 'none';
    }

    // Reset control buttons visually
    const camBtn = document.querySelector('.camera-toggle');
    const micBtn = document.querySelector('.mic-toggle');
    if (camBtn) camBtn.style.opacity = '1';
    if (micBtn) micBtn.style.opacity = '1';
  } catch (err) {
    console.warn("Camera/microphone access denied or unavailable:", err);
    notify("Could not access camera/microphone", "error");
  }
}

function closeVideoCall() {
  document.getElementById('videoCallOverlay').style.display = 'none';
  clearInterval(callInterval);

  const timer = document.getElementById('callTimer');
  const durationText = timer ? timer.textContent : '00:00';
  notify(`Consultation ended. Duration: ${durationText}`, 'success');

  // Stop screen sharing if active
  if (screenStream) {
    stopScreenShare();
  }

  // Stop all camera and microphone tracks
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  const localVideo = document.getElementById('localVideo');
  const placeholder = document.getElementById('localVideoPlaceholder');
  if (localVideo) {
    localVideo.srcObject = null;
    localVideo.style.display = 'none';
  }
  if (placeholder) {
    placeholder.style.display = 'inline';
  }

  if (currentRole === 'doctor') {
    openModal('prescModal');
  }
}

// ── SCREEN SHARE HELPERS ──
async function toggleScreenShare(btn) {
  if (screenStream) {
    stopScreenShare();
    btn.style.background = '';
    notify('Screen sharing stopped', '');
  } else {
    try {
      btn.style.opacity = '0.5';
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStream = stream;
      btn.style.opacity = '1';
      btn.style.background = '#14b8a6';

      const screenVideo = document.getElementById('mainScreenShareVideo');
      const pulseRing = document.getElementById('videoPulseRing');
      const partnerName = document.getElementById('video-partner-name');
      const partnerSub = document.getElementById('video-partner-sub');

      if (screenVideo) {
        screenVideo.srcObject = stream;
        screenVideo.style.display = 'block';
      }
      if (pulseRing) pulseRing.style.display = 'none';
      if (partnerName) partnerName.style.display = 'none';
      if (partnerSub) partnerSub.style.display = 'none';

      // Auto-cleanup on end of screen share (browser native toolbar button click)
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      notify('Screen sharing started', 'success');
    } catch (err) {
      console.warn("Screen share permission denied or unavailable:", err);
      btn.style.opacity = '1';
      btn.style.background = '';
      notify('Could not start screen sharing', 'error');
    }
  }
}

function stopScreenShare() {
  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    screenStream = null;
  }

  const btn = document.querySelector('.screen-share-toggle');
  if (btn) {
    btn.style.background = '';
  }

  const screenVideo = document.getElementById('mainScreenShareVideo');
  const pulseRing = document.getElementById('videoPulseRing');
  const partnerName = document.getElementById('video-partner-name');
  const partnerSub = document.getElementById('video-partner-sub');

  if (screenVideo) {
    screenVideo.srcObject = null;
    screenVideo.style.display = 'none';
  }
  if (pulseRing) pulseRing.style.display = 'block';
  if (partnerName) partnerName.style.display = 'block';
  if (partnerSub) partnerSub.style.display = 'block';
}

// ── VIDEO CHAT HELPERS ──
function toggleVideoChat(btn) {
  const panel = document.getElementById('videoChatPanel');
  if (!panel) return;

  const isOpen = panel.style.display === 'flex';
  panel.style.display = isOpen ? 'none' : 'flex';
  btn.style.background = isOpen ? '' : '#14b8a6';

  if (!isOpen) {
    const input = document.getElementById('videoChatInput');
    if (input) input.focus();
    const messages = document.getElementById('videoChatMessages');
    if (messages) messages.scrollTop = messages.scrollHeight;
  }
}

function appendChatMessage(sender, text, type) {
  const container = document.getElementById('videoChatMessages');
  if (!container) return;

  const msgEl = document.createElement('div');
  msgEl.className = `chat-msg ${type}`;

  if (type !== 'system') {
    const senderEl = document.createElement('span');
    senderEl.className = 'sender';
    senderEl.textContent = sender;
    msgEl.appendChild(senderEl);
  }

  const textEl = document.createElement('span');
  textEl.className = 'text';
  textEl.textContent = text;
  msgEl.appendChild(textEl);

  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

function sendVideoChatMessage() {
  const input = document.getElementById('videoChatInput');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const myName = currentRole === 'doctor' ? 'Dr. Sarah Johnson' : 'Alex Smith';
  appendChatMessage(myName, text, 'self');
  input.value = '';

  // Trigger simulated response after 2 seconds
  setTimeout(() => {
    const isDoctor = currentRole === 'doctor';
    const replies = isDoctor ? patientChatReplies : doctorChatReplies;
    const partnerName = isDoctor ? 'Alex Smith' : 'Dr. Sarah Johnson';

    const replyText = replies[currentReplyIndex % replies.length];
    currentReplyIndex++;

    appendChatMessage(partnerName, replyText, 'other');

    // If chat side panel is hidden, notify user via notification bubble
    const panel = document.getElementById('videoChatPanel');
    if (panel && panel.style.display === 'none') {
      notify(`New message from ${partnerName}`, 'success');
    }
  }, 2000);
}

// ── PATIENT FLOW APIS ──
async function loadPatientData() {
  try {
    // 1. Load profile data
    const resPat = await fetch(`${API_BASE}/patients/P-10421`);
    patientData = await resPat.json();
    updatePatientProfileUI();

    // 2. Load appointments
    const resAppt = await fetch(`${API_BASE}/appointments`);
    appointmentsData = await resAppt.json();
    renderPatientAppointments();

    // 3. Load prescriptions
    const resRx = await fetch(`${API_BASE}/prescriptions`);
    prescriptionsData = await resRx.json();
    renderPatientPrescriptions();

    // 4. Load reports
    const resRep = await fetch(`${API_BASE}/reports`);
    reportsData = await resRep.json();
    renderPatientReports();

    // 5. Load doctors for lists
    const resDocs = await fetch(`${API_BASE}/doctors`);
    doctorsData = await resDocs.json();
    renderDoctorsList();

  } catch (err) {
    console.error("Error loading patient data", err);
  }
}

function updatePatientProfileUI() {
  if (!patientData) return;

  // Dashboard stats
  const activeRx = prescriptionsData.filter(rx => rx.patientId === patientData.id && rx.status === 'Active').length;
  const upcomingAppts = appointmentsData.filter(a => a.patientId === patientData.id && a.status === 'Confirmed').length;

  const statRxEl = document.getElementById('p-stat-prescriptions');
  const statApptEl = document.getElementById('p-stat-upcoming');
  const statRepEl = document.getElementById('p-stat-lab-reports');

  if (statRxEl) statRxEl.textContent = activeRx;
  if (statApptEl) statApptEl.textContent = upcomingAppts;
  if (statRepEl) statRepEl.textContent = reportsData.filter(r => r.patientId === patientData.id).length;

  // Profile displays
  const profName = document.getElementById('p-profile-name');
  const profId = document.getElementById('p-profile-id');
  if (profName) profName.textContent = patientData.name;
  if (profId) profId.textContent = `Patient ID: ${patientData.id}`;

  // Profile detailed parameters
  const detailsContainer = document.getElementById('p-profile-details');
  if (detailsContainer) {
    detailsContainer.innerHTML = `
      <div class="flex justify-between"><span class="text-muted">📧 Email</span><span>${patientData.email}</span></div>
      <div class="flex justify-between"><span class="text-muted">📱 Phone</span><span>${patientData.phone}</span></div>
      <div class="flex justify-between"><span class="text-muted">🎂 DOB</span><span>${patientData.dob}</span></div>
      <div class="flex justify-between"><span class="text-muted">🩸 Blood</span><span>${patientData.bloodType}</span></div>
      <div class="flex justify-between"><span class="text-muted">📍 City</span><span>${patientData.city}</span></div>
    `;
  }

  // Emergency contacts & insurance
  const emergencyContainer = document.getElementById('p-profile-emergency');
  if (emergencyContainer) {
    emergencyContainer.innerHTML = `
      <div class="flex justify-between"><span class="text-muted">Name</span><span>${patientData.emergencyContact.name}</span></div>
      <div class="flex justify-between"><span class="text-muted">Relation</span><span>${patientData.emergencyContact.relation}</span></div>
      <div class="flex justify-between"><span class="text-muted">Phone</span><span>${patientData.emergencyContact.phone}</span></div>
    `;
  }

  const insuranceContainer = document.getElementById('p-profile-insurance');
  if (insuranceContainer) {
    insuranceContainer.innerHTML = `
      <div class="flex justify-between"><span class="text-muted">Provider</span><span>${patientData.insurance.provider}</span></div>
      <div class="flex justify-between"><span class="text-muted">Policy No.</span><span>${patientData.insurance.policyNo}</span></div>
      <div class="flex justify-between"><span class="text-muted">Valid Until</span><span>${patientData.insurance.validUntil}</span></div>
    `;
  }

  // EHR Summary
  const ehrContainer = document.getElementById('p-ehr-summary');
  if (ehrContainer) {
    ehrContainer.innerHTML = `
      <div class="flex justify-between"><span class="text-muted">Blood Type</span><span class="font-semibold">${patientData.bloodType}</span></div>
      <div class="flex justify-between"><span class="text-muted">Height</span><span class="font-semibold">${patientData.height}</span></div>
      <div class="flex justify-between"><span class="text-muted">Weight</span><span class="font-semibold">${patientData.weight}</span></div>
      <div class="flex justify-between"><span class="text-muted">BMI</span><span class="font-semibold">${patientData.bmi}</span></div>
      <div class="flex justify-between"><span class="text-muted">Allergies</span><span class="font-semibold">${patientData.allergies}</span></div>
      <div class="flex justify-between"><span class="text-muted">Chronic Conditions</span><span class="font-semibold">${patientData.conditions}</span></div>
    `;
  }
}

function renderPatientAppointments() {
  const tableBody = document.getElementById('p-appointments-table-body');
  const dashboardContainer = document.getElementById('p-dashboard-appts');
  const videoApptList = document.getElementById('p-video-appts-list');

  if (tableBody) tableBody.innerHTML = '';
  if (dashboardContainer) dashboardContainer.innerHTML = '';
  if (videoApptList) videoApptList.innerHTML = '';

  const patId = patientData ? patientData.id : "P-10421";
  const myAppts = appointmentsData.filter(a => a.patientId === patId);

  myAppts.forEach(appt => {
    const formattedDate = new Date(appt.dateTime).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const badgeClass = appt.type === 'Video' ? 'badge-blue' : 'badge-teal';
    const statusBadge = appt.status === 'Confirmed' ? 'badge-green' : appt.status === 'Cancelled' ? 'badge-red' : 'badge-gray';

    // Append to appointments page table
    if (tableBody && appt.status !== 'Completed') {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="font-semibold">${appt.doctorName}</div></td>
        <td>${formattedDate}</td>
        <td><span class="badge ${badgeClass}">${appt.type}</span></td>
        <td><span class="badge ${statusBadge}">${appt.status}</span></td>
        <td>
          ${appt.status === 'Confirmed' && appt.type === 'Video'
          ? `<button class="btn btn-sm btn-primary" onclick="window.joinVideoRoom('${appt.doctorName}')">Join Call</button>`
          : appt.status === 'Confirmed'
            ? `<button class="btn btn-sm btn-ghost" onclick="window.cancelAppointment('${appt.id}')">Cancel</button>`
            : `–`}
        </td>
      `;
      tableBody.appendChild(tr);
    }

    // Append to dashboard page upcoming panel (max 2)
    if (dashboardContainer && appt.status === 'Confirmed') {
      const div = document.createElement('div');
      div.className = 'appt-card';
      const time = new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateLabel = new Date(appt.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' });

      div.innerHTML = `
        <div class="appt-time">
          <div class="time">${time}</div>
          <div class="period">${dateLabel}</div>
        </div>
        <div class="appt-info">
          <div class="name">${appt.doctorName}</div>
          <div class="type">${appt.reason}</div>
        </div>
        <span class="badge ${badgeClass}">${appt.type}</span>
      `;
      dashboardContainer.appendChild(div);
    }

    // Append to scheduled video consultations page list
    if (videoApptList && appt.type === 'Video' && appt.status === 'Confirmed') {
      const time = new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateLabel = new Date(appt.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' });

      const div = document.createElement('div');
      div.className = 'appt-card';
      div.innerHTML = `
        <div class="appt-time">
          <div class="time">${time}</div>
          <div class="period">${dateLabel}</div>
        </div>
        <div class="appt-info">
          <div class="name">${appt.doctorName}</div>
          <div class="type">${appt.reason}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="window.joinVideoRoom('${appt.doctorName}')">Join</button>
      `;
      videoApptList.appendChild(div);
    }
  });
}

function renderPatientPrescriptions() {
  const activeList = document.getElementById('p-prescriptions-active-list');
  const dashList = document.getElementById('p-dashboard-prescriptions');
  const histTable = document.getElementById('p-prescriptions-history-table');

  if (activeList) activeList.innerHTML = '';
  if (dashList) dashList.innerHTML = '';
  if (histTable) histTable.innerHTML = '';

  const patId = patientData ? patientData.id : "P-10421";
  const myRx = prescriptionsData.filter(rx => rx.patientId === patId);

  myRx.forEach(rx => {
    if (rx.status === 'Active' || rx.status === 'Refill Soon') {
      const badgeClass = rx.status === 'Active' ? 'badge-green' : 'badge-yellow';
      const borderStyle = rx.status === 'Active' ? 'border-left:3px solid var(--primary-light)' : 'border-left:3px solid var(--warning)';
      const progressPercent = Math.min(100, Math.floor((rx.refillsUsed / rx.refillsTotal) * 100));

      // Page representation
      if (activeList) {
        const item = document.createElement('div');
        item.className = 'card card-sm';
        item.style = borderStyle;
        item.innerHTML = `
          <div class="flex justify-between mb-1"><span class="font-semibold">${rx.medicineName}</span><span class="badge ${badgeClass}">${rx.status}</span></div>
          <div class="text-muted text-sm">${rx.dosage}</div>
          <div class="text-muted text-sm">Duration: ${rx.duration} · ${rx.doctorName}</div>
          <div style="margin-top:.75rem;">
            <div class="flex justify-between text-sm mb-1"><span>Refills left</span><span>${rx.refillsTotal - rx.refillsUsed} of ${rx.refillsTotal}</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${progressPercent}%"></div></div>
          </div>
        `;
        activeList.appendChild(item);
      }

      // Dashboard representation (simple summary)
      if (dashList) {
        const item = document.createElement('div');
        item.style = 'display:flex;justify-content:space-between;align-items:center;padding:.7rem 0;border-bottom:1px solid var(--border)';
        item.innerHTML = `
          <div>
            <div class="text-sm font-semibold">${rx.medicineName}</div>
            <div class="text-muted">${rx.dosage.split('·')[0]} · ${rx.doctorName}</div>
          </div>
          <span class="badge ${badgeClass}">${rx.status}</span>
        `;
        dashList.appendChild(item);
      }
    } else {
      // Completed / Historic Rx
      if (histTable) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><div class="font-semibold">${rx.medicineName}</div><div class="text-muted">${rx.doctorName}</div></td>
          <td>${rx.date}</td>
          <td><span class="badge badge-gray">${rx.status}</span></td>
        `;
        histTable.appendChild(tr);
      }
    }
  });
}

function renderPatientReports() {
  const docTable = document.getElementById('p-documents-table-body');
  const repTable = document.getElementById('p-reports-table-body');

  if (docTable) docTable.innerHTML = '';
  if (repTable) repTable.innerHTML = '';

  const patId = patientData ? patientData.id : "P-10421";
  const myReports = reportsData.filter(r => r.patientId === patId);

  myReports.forEach(rep => {
    const formattedDate = new Date(rep.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const badgeClass = rep.result.includes('Borderline') || rep.result.includes('Low') ? 'badge-yellow' : 'badge-green';

    // Main medical records uploads table
    if (docTable) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="font-semibold">${rep.testName}</td>
        <td><span class="badge badge-blue">Lab Report</span></td>
        <td>${formattedDate}</td>
        <td>${rep.lab}</td>
        <td><button class="btn btn-sm btn-ghost" onclick="window.viewDocument('${rep.testName}')">View</button></td>
      `;
      docTable.appendChild(tr);
    }

    // Reports sub-tab table
    if (repTable) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="font-semibold">${rep.testName}</td>
        <td>${formattedDate}</td>
        <td>${rep.lab}</td>
        <td><span class="badge ${badgeClass}">${rep.result}</span></td>
        <td><button class="btn btn-sm btn-ghost" onclick="window.viewDocument('${rep.testName}')">View</button></td>
      `;
      repTable.appendChild(tr);
    }
  });
}

function renderDoctorsList() {
  const listContainer = document.getElementById('p-doctors-list');
  const bookSelect = document.getElementById('book-appt-doctor-select');

  if (listContainer) listContainer.innerHTML = '';
  if (bookSelect) bookSelect.innerHTML = '';

  doctorsData.forEach(doc => {
    // 1. Select options for booking appointment
    if (bookSelect && doc.status === 'Active') {
      const opt = document.createElement('option');
      opt.value = doc.id;
      opt.textContent = `${doc.name} – ${doc.specialty}`;
      bookSelect.appendChild(opt);
    }

    // 2. Direct card generation on page
    if (listContainer) {
      const initials = doc.name.split(' ').slice(1).map(n => n[0]).join('');
      const statusBadge = doc.availability.includes('Today') || doc.status === 'Active' ? 'badge-green' : 'badge-yellow';
      const statusText = doc.status === 'Active' ? 'Available Today' : 'Tomorrow';
      const borderClass = doc.specialty === 'General Medicine' ? 'avatar-teal' : doc.specialty === 'Cardiology' ? 'avatar-blue' : 'avatar-orange';

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display:flex;gap:1rem;align-items:flex-start;">
          <div class="avatar ${borderClass}" style="width:52px;height:52px;font-size:1rem;">${initials}</div>
          <div style="flex:1;">
            <div class="font-semibold">${doc.name}</div>
            <div class="text-muted mb-1">${doc.specialty} · ${doc.exp} exp.</div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
              <span class="badge badge-teal">${doc.degree}</span>
              <span class="badge ${statusBadge}">${statusText}</span>
              <span>⭐ ${doc.rating}</span>
            </div>
          </div>
        </div>
        <hr class="divider">
        <div class="flex gap-2" style="font-size:.83rem;color:var(--text3);margin-bottom:1rem;">
          <span>📍 ${doc.specialty} Dept</span>
          <span>💰 ₹${doc.fee}/consult</span>
        </div>
        <div style="display:flex;gap:.5rem;">
          <button class="btn btn-primary btn-sm" onclick="window.openBookAppointmentModal('${doc.id}')">Book Appointment</button>
          <button class="btn btn-outline btn-sm" onclick="window.joinVideoRoom('${doc.name}')">Quick Video</button>
        </div>
      `;
      listContainer.appendChild(card);
    }
  });
}

function openBookAppointmentModal(docId) {
  openModal('bookApptModal');
  const select = document.getElementById('book-appt-doctor-select');
  if (select && docId) {
    select.value = docId;
  }
}

async function submitBookAppointment() {
  const doctorId = document.getElementById('book-appt-doctor-select').value;
  const type = document.getElementById('book-appt-type').value.split(' ')[0]; // Video or In-Clinic
  const date = document.getElementById('book-appt-date').value;
  const time = document.getElementById('book-appt-time').value;
  const reason = document.getElementById('book-appt-reason').value;

  if (!date) {
    notify('Please select an appointment date', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId,
        patientId: 'P-10421',
        dateTime: `${date}T${time.includes('AM') ? time.replace(' AM', '') : (parseInt(time.replace(' PM', '')) + 12)}:00:00`,
        type,
        reason
      })
    });

    if (!res.ok) throw new Error('Booking failed');

    closeModal('bookApptModal');
    notify('Appointment booked successfully!', 'success');
    await loadPatientData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function cancelAppointment(id) {
  if (!confirm('Are you sure you want to cancel this appointment?')) return;
  try {
    const res = await fetch(`${API_BASE}/appointments/cancel/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error('Cancellation failed');
    notify('Appointment cancelled', '');
    await loadPatientData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function triggerReportUpload() {
  const testName = prompt("Enter Test Name to upload:", "CBC Blood Test");
  if (!testName) return;

  try {
    const res = await fetch(`${API_BASE}/reports/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testName, patientId: 'P-10421', lab: 'CityPath Lab' })
    });
    if (!res.ok) throw new Error('Upload failed');
    notify('Report uploaded successfully', 'success');
    await loadPatientData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

function downloadRecords() {
  notify('All medical records downloaded as PDF', 'success');
}

async function savePatientProfile() {
  const phone = prompt("Update Phone Number:", patientData.phone);
  const city = prompt("Update City:", patientData.city);
  if (!phone && !city) return;

  try {
    const res = await fetch(`${API_BASE}/patients/P-10421/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, city })
    });
    if (!res.ok) throw new Error('Profile update failed');
    notify('Profile details updated', 'success');
    await loadPatientData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

function viewDocument(name) {
  notify(`Viewing report details: ${name}`, 'success');
}

function filterDoctors() {
  const q = document.getElementById('p-doctors-search').value.toLowerCase();
  const spec = document.getElementById('p-doctors-specialty-filter').value;

  document.querySelectorAll('#p-doctors-list .card').forEach(card => {
    const name = card.querySelector('.font-semibold').textContent.toLowerCase();
    const specialtyText = card.querySelector('.text-muted').textContent;
    const matchQ = name.includes(q) || specialtyText.toLowerCase().includes(q);
    const matchSpec = spec === 'All Specialties' || specialtyText.includes(spec);

    card.style.display = matchQ && matchSpec ? 'block' : 'none';
  });
}

// ── DOCTOR FLOW APIS ──
async function loadDoctorData() {
  try {
    // 1. Fetch appointments
    const resAppt = await fetch(`${API_BASE}/appointments`);
    appointmentsData = await resAppt.json();
    renderDoctorAppointments();

    // 2. Fetch all patients
    const resPat = await fetch(`${API_BASE}/patients`);
    const patientsList = await resPat.json();
    renderDoctorPatients(patientsList);

    // 3. Fetch all prescriptions
    const resRx = await fetch(`${API_BASE}/prescriptions`);
    prescriptionsData = await resRx.json();
    renderDoctorPrescriptions();

    // 4. Fetch reports
    const resRep = await fetch(`${API_BASE}/reports`);
    reportsData = await resRep.json();
    renderDoctorReports();

  } catch (err) {
    console.error("Error loading doctor data", err);
  }
}

function renderDoctorAppointments() {
  const scheduleList = document.getElementById('d-dashboard-schedule');
  const tableBody = document.getElementById('d-appointments-table-body');
  const consultQueue = document.getElementById('d-consultation-queue');

  if (scheduleList) scheduleList.innerHTML = '';
  if (tableBody) tableBody.innerHTML = '';
  if (consultQueue) consultQueue.innerHTML = '';

  let myAppts = appointmentsData.filter(a => a.doctorId === 'D-101');

  // Update nav badge count
  const countBadge = document.getElementById('d-badge-appt-count');
  if (countBadge) countBadge.textContent = myAppts.length;

  myAppts.forEach(appt => {
    const time = new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = new Date(appt.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const badgeClass = appt.type === 'Video' ? 'badge-blue' : 'badge-teal';
    const statusClass = appt.status === 'Completed' ? 'badge-gray' : appt.status === 'Confirmed' ? 'badge-green' : 'badge-yellow';

    // Render Today Schedule on Dashboard
    if (scheduleList) {
      const item = document.createElement('div');
      item.className = 'appt-card';
      let actionEl = `<span class="badge ${statusClass}">${appt.status}</span>`;
      if (appt.status === 'Confirmed' && appt.type === 'Video') {
        actionEl = `<button class="btn btn-primary btn-sm" onclick="window.joinVideoRoom('${appt.patientName}')">Join</button>`;
      }

      item.innerHTML = `
        <div class="appt-time">
          <div class="time">${time}</div>
          <div class="period">Today</div>
        </div>
        <div class="appt-info">
          <div class="name">${appt.patientName}</div>
          <div class="type">${appt.reason}</div>
        </div>
        ${actionEl}
      `;
      scheduleList.appendChild(item);
    }

    // Render Appointments page list
    if (tableBody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="font-semibold">${appt.patientName}</div><div class="text-muted">${appt.patientId}</div></td>
        <td>${formattedDate}</td>
        <td><span class="badge ${badgeClass}">${appt.type}</span></td>
        <td>${appt.reason}</td>
        <td><span class="badge ${statusClass}">${appt.status}</span></td>
        <td>
          ${appt.status === 'Confirmed' && appt.type === 'Video'
          ? `<button class="btn btn-sm btn-primary" onclick="window.joinVideoRoom('${appt.patientName}')">Join</button>`
          : appt.status === 'Confirmed'
            ? `<button class="btn btn-sm btn-ghost" onclick="window.cancelAppointment('${appt.id}')">Cancel</button>`
            : appt.status === 'Completed'
              ? `<button class="btn btn-sm btn-ghost" onclick="window.openPrescriptionModal('${appt.patientId}')">Add Rx</button>`
              : `–`}
        </td>
      `;
      tableBody.appendChild(tr);
    }

    // Render Queue in consultation room
    if (consultQueue && appt.type === 'Video' && appt.status !== 'Completed') {
      const item = document.createElement('div');
      item.className = 'appt-card';
      item.innerHTML = `
        <div class="appt-time">
          <div class="time">${time}</div>
          <div class="period">Queue</div>
        </div>
        <div class="appt-info">
          <div class="name">${appt.patientName}</div>
          <div class="type">${appt.reason}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="window.joinVideoRoom('${appt.patientName}')">Join Call</button>
      `;
      consultQueue.appendChild(item);
    }
  });
}

function renderDoctorPatients(list) {
  const tableBody = document.getElementById('d-patients-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  list.forEach(pat => {
    const avatarInit = pat.name.split(' ').map(n => n[0]).join('');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="flex items-center gap-2">
          <div class="avatar avatar-teal" style="width:32px;height:32px;font-size:.72rem;">${avatarInit}</div>
          <div>
            <div class="font-semibold">${pat.name}</div>
            <div class="text-muted">${pat.id}</div>
          </div>
        </div>
      </td>
      <td>38</td>
      <td><span class="badge badge-yellow">${pat.conditions}</span></td>
      <td>May 10, 2026</td>
      <td>May 23, 2026</td>
      <td><button class="btn btn-sm btn-outline" onclick="window.viewEhrDetails('${pat.id}')">View EHR</button></td>
    `;
    tableBody.appendChild(tr);
  });
}

function renderDoctorPrescriptions() {
  const tableBody = document.getElementById('d-prescriptions-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  prescriptionsData.forEach(rx => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="font-semibold">${rx.patientName}</div></td>
      <td>${rx.medicineName}</td>
      <td>${rx.dosage}</td>
      <td>${rx.duration}</td>
      <td>${rx.date}</td>
      <td><span class="badge badge-green">${rx.status}</span></td>
    `;
    tableBody.appendChild(tr);
  });
}

function renderDoctorReports() {
  const tableBody = document.getElementById('d-reports-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  reportsData.forEach(rep => {
    const pat = patients.find(p => p.id === rep.patientId) || { name: 'Alex Smith' };
    const badgeClass = rep.result.includes('Normal') ? 'badge-green' : 'badge-yellow';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-semibold">${pat.name}</td>
      <td>${rep.testName}</td>
      <td>${rep.date}</td>
      <td><span class="badge ${badgeClass}">${rep.result}</span></td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="window.viewDocument('${rep.testName}')">Review</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function openPrescriptionModal(patientId) {
  openModal('prescModal');
  const select = document.getElementById('presc-patient-select');
  if (select && patientId) {
    select.value = patientId;
  }
}

function addRxRow() {
  const rxList = document.getElementById('rxList');
  if (!rxList) return;

  const row = document.createElement('div');
  row.className = 'form-row flex-rx-row';
  row.style.alignItems = 'end';
  row.innerHTML = `
    <div class="form-group flex-1"><input type="text" class="form-control rx-med-name" placeholder="Medicine name"></div>
    <div class="form-group flex-1"><input type="text" class="form-control rx-med-dose" placeholder="Dosage & frequency"></div>
  `;
  rxList.appendChild(row);
}

async function submitIssuePrescription() {
  const patientId = document.getElementById('presc-patient-select').value;
  const diagnosis = document.getElementById('presc-diagnosis').value;
  const duration = document.getElementById('presc-duration').value;

  const medNames = document.querySelectorAll('.rx-med-name');
  const medDoses = document.querySelectorAll('.rx-med-dose');

  const medicines = [];
  medNames.forEach((el, index) => {
    if (el.value) {
      medicines.push({ name: el.value, dosage: medDoses[index]?.value || '1 tablet daily' });
    }
  });

  if (medicines.length === 0) {
    notify('Please input at least one medicine', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/prescriptions/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, diagnosis, duration, medicines })
    });

    if (!res.ok) throw new Error('Prescription issuance failed');

    closeModal('prescModal');
    notify('Prescription issued and sent to patient', 'success');
    await loadDoctorData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

function proceedToPrescription() {
  notify('Consultation notes saved successfully', 'success');
  openModal('prescModal');
}

function viewEhrDetails(id) {
  notify(`Accessing patient health records: ${id}`, 'success');
}

function filterPatients() {
  const q = document.getElementById('d-patient-search').value.toLowerCase();
  const condition = document.getElementById('d-patient-condition-filter').value;

  document.querySelectorAll('#d-patients-table-body tr').forEach(tr => {
    const name = tr.querySelector('.font-semibold').textContent.toLowerCase();
    const condText = tr.querySelector('.badge').textContent;

    const matchQ = name.includes(q);
    const matchCond = condition === 'All Conditions' || condText.includes(condition);

    tr.style.display = matchQ && matchCond ? 'table-row' : 'none';
  });
}

// ── ADMIN FLOW APIS ──
async function loadAdminData() {
  try {
    const res = await fetch(`${API_BASE}/admin/logs`);
    const data = await res.json();

    // Update stats counters
    const statPat = document.getElementById('a-stat-patients');
    const statDoc = document.getElementById('a-stat-doctors');
    if (statPat) statPat.textContent = data.stats.totalPatients.toLocaleString();
    if (statDoc) statDoc.textContent = data.stats.activeDoctors.toLocaleString();

    // Render logs
    renderAdminLogs(data.logs);

    // Fetch users for list
    const resUsers = await fetch(`${API_BASE}/patients`);
    const patientsList = await resUsers.json();
    const resDocs = await fetch(`${API_BASE}/doctors`);
    doctorsData = await resDocs.json();

    renderAdminUsersList(patientsList, doctorsData);
    renderAdminDoctorsTable(doctorsData);

    // Fetch appointments for admin list
    const resAppt = await fetch(`${API_BASE}/appointments`);
    appointmentsData = await resAppt.json();
    renderAdminAppointments();

  } catch (err) {
    console.error("Error loading admin data", err);
  }
}

function renderAdminLogs(logs) {
  const dbLogs = document.getElementById('a-dashboard-logs');
  const pageLogs = document.getElementById('a-activity-table-body');

  if (dbLogs) dbLogs.innerHTML = '';
  if (pageLogs) pageLogs.innerHTML = '';

  logs.forEach((log, index) => {
    // 1. Dashboard summary (max 4)
    if (dbLogs && index < 4) {
      const item = document.createElement('div');
      item.className = 'tl-item';
      item.innerHTML = `
        <div class="tl-dot"></div>
        <div class="tl-content">
          <div class="tl-title">${log.action}</div>
          <div class="tl-sub">${log.user} · ${log.time}</div>
        </div>
      `;
      dbLogs.appendChild(item);
    }

    // 2. Main page table logs
    if (pageLogs) {
      const badgeClass = log.status === 'Success' ? 'badge-green' : 'badge-red';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${log.time}</td>
        <td class="font-semibold">${log.user}</td>
        <td>${log.action}</td>
        <td>${log.ip}</td>
        <td><span class="badge ${badgeClass}">${log.status}</span></td>
      `;
      pageLogs.appendChild(tr);
    }
  });
}

function renderAdminUsersList(patientsList, docsList) {
  const tableBody = document.getElementById('a-users-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  // Render patients
  patientsList.forEach(pat => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="flex items-center gap-2"><div class="avatar avatar-teal" style="width:32px;height:32px;font-size:.72rem;">AS</div><div class="font-semibold">${pat.name}</div></div></td>
      <td><span class="badge badge-teal">Patient</span></td>
      <td>${pat.email}</td>
      <td>Jan 2026</td>
      <td><span class="badge badge-green">Active</span></td>
      <td>
        <div style="display:flex;gap:.4rem;">
          <button class="btn btn-sm btn-ghost" onclick="window.editUser('${pat.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="window.suspendUser('${pat.id}')">Suspend</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Render doctors
  docsList.forEach(doc => {
    const initials = doc.name.split(' ').slice(1).map(n => n[0]).join('');
    const tr = document.createElement('tr');
    const actionCell = doc.status === 'Pending'
      ? `<button class="btn btn-sm btn-primary" onclick="window.approveDoctor('${doc.id}')">Approve</button>
         <button class="btn btn-sm btn-danger" onclick="window.rejectDoctor('${doc.id}')">Reject</button>`
      : `<button class="btn btn-sm btn-ghost" onclick="window.editUser('${doc.id}')">Edit</button>
         <button class="btn btn-sm btn-danger" onclick="window.suspendUser('${doc.id}')">Suspend</button>`;

    tr.innerHTML = `
      <td><div class="flex items-center gap-2"><div class="avatar avatar-blue" style="width:32px;height:32px;font-size:.72rem;">${initials}</div><div class="font-semibold">${doc.name}</div></div></td>
      <td><span class="badge badge-blue">Doctor</span></td>
      <td>${doc.email}</td>
      <td>Mar 2024</td>
      <td><span class="badge ${doc.status === 'Active' ? 'badge-green' : 'badge-yellow'}">${doc.status}</span></td>
      <td><div style="display:flex;gap:.4rem;">${actionCell}</div></td>
    `;
    tableBody.appendChild(tr);
  });
}

function renderAdminDoctorsTable(docsList) {
  const tableBody = document.getElementById('a-doctors-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  docsList.forEach(doc => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="font-semibold">${doc.name}</div><div class="text-muted">${doc.degree}</div></td>
      <td>${doc.specialty}</td>
      <td>${doc.status === 'Active' ? '147' : '0'}</td>
      <td>${doc.consultationsCount}</td>
      <td>${doc.status === 'Active' ? `⭐ ${doc.rating}` : '–'}</td>
      <td><span class="badge ${doc.status === 'Active' ? 'badge-green' : 'badge-yellow'}">${doc.status}</span></td>
    `;
    tableBody.appendChild(tr);
  });
}

function renderAdminAppointments() {
  const tableBody = document.getElementById('a-appointments-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  appointmentsData.forEach(appt => {
    const formattedDate = new Date(appt.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const badgeClass = appt.type === 'Video' ? 'badge-blue' : 'badge-teal';
    const statusClass = appt.status === 'Completed' ? 'badge-gray' : appt.status === 'Confirmed' ? 'badge-green' : 'badge-yellow';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${appt.patientName}</td>
      <td>${appt.doctorName}</td>
      <td>${formattedDate}</td>
      <td><span class="badge ${badgeClass}">${appt.type}</span></td>
      <td><span class="badge ${statusClass}">${appt.status}</span></td>
    `;
    tableBody.appendChild(tr);
  });
}

async function approveDoctor(id) {
  try {
    const res = await fetch(`${API_BASE}/doctors/approve/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error('Approval failed');
    notify('Doctor credentials approved successfully', 'success');
    await loadAdminData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function rejectDoctor(id) {
  if (!confirm('Are you sure you want to reject this doctor application?')) return;
  try {
    const res = await fetch(`${API_BASE}/doctors/reject/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error('Rejection failed');
    notify('Doctor registration application rejected', '');
    await loadAdminData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function suspendUser(id) {
  if (!confirm('Are you sure you want to suspend this user account?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/users/suspend/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error('Suspension failed');
    notify('User access suspended', 'success');
    await loadAdminData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

function editUser(id) {
  notify(`Accessing configuration profile for: ${id}`, 'success');
}

async function submitAddUser() {
  const firstName = document.getElementById('addUser-first').value;
  const lastName = document.getElementById('addUser-last').value;
  const email = document.getElementById('addUser-email').value;
  const role = document.getElementById('addUser-role').value;
  const phone = document.getElementById('addUser-phone').value;

  if (!firstName || !lastName || !email) {
    notify('Please input name and email address', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/users/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, role, phone })
    });
    if (!res.ok) throw new Error('Add user failed');

    closeModal('addUserModal');
    notify('User added and invitation sent', 'success');
    await loadAdminData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function saveAdminSettings() {
  const platformName = document.getElementById('a-setting-name').value;
  const supportEmail = document.getElementById('a-setting-email').value;
  const defaultDuration = document.getElementById('a-setting-duration').value;
  const maxPatientsPerDay = document.getElementById('a-setting-max-patients').value;

  try {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformName, supportEmail, defaultDuration, maxPatientsPerDay })
    });
    if (!res.ok) throw new Error('Settings update failed');
    notify('Settings saved successfully', 'success');
    await loadAdminData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

function filterAdminUsers() {
  const q = document.getElementById('a-users-search').value.toLowerCase();
  document.querySelectorAll('#a-users-table-body tr').forEach(tr => {
    const name = tr.querySelector('.font-semibold').textContent.toLowerCase();
    const email = tr.cells[2].textContent.toLowerCase();
    tr.style.display = name.includes(q) || email.includes(q) ? 'table-row' : 'none';
  });
}

// ── GLOBAL EXPOSURES FOR ONCLICK HANDLERS ──
window.joinVideoRoom = openVideoCall;
window.cancelAppointment = cancelAppointment;
window.viewDocument = viewDocument;
window.openBookAppointmentModal = openBookAppointmentModal;
window.viewEhrDetails = viewEhrDetails;
window.openPrescriptionModal = openPrescriptionModal;
window.approveDoctor = approveDoctor;
window.rejectDoctor = rejectDoctor;
window.suspendUser = suspendUser;
window.editUser = editUser;
