// MedXpert Core Application JavaScript

// Base API configuration (proxied via Vite server)
const API_BASE = '/api';

function getAvatarImage(profileImage, name, gender) {
  if (profileImage) return profileImage;
  const genderStr = (gender || '').toLowerCase();
  if (genderStr === 'male') {
    return '/default-male.png';
  }
  if (genderStr === 'female') {
    return '/default-female.png';
  }
  if (genderStr === 'other') {
    return '/default-other.png';
  }
  const maleKeywords = ['arun', 'raj', 'ashad', 'saifi', 'patel', 'mehta', 'amit', 'rahul', 'sanjay', 'anil', 'dev', 'vijay', 'vikram', 'abhishek'];
  const femaleKeywords = ['uma', 'neha', 'shreya', 'priya', 'pooja', 'prajapati', 'kapoor', 'joshi', 'anita', 'sunita', 'kiran', 'diana'];
  const nameLower = (name || '').toLowerCase();
  const isFemale = femaleKeywords.some(kw => nameLower.includes(kw));
  if (isFemale) return '/default-female.png';
  const isMale = maleKeywords.some(kw => nameLower.includes(kw));
  if (isMale) return '/default-male.png';
  return '/default-other.png';
}


// Automatically append Authorization header if token is stored in sessionStorage
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  const storedUser = sessionStorage.getItem('medxpert_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user && user.token) {
        options.headers = options.headers || {};
        if (options.headers instanceof Headers) {
          if (!options.headers.has('Authorization')) {
            options.headers.set('Authorization', `Bearer ${user.token}`);
          }
        } else {
          if (!options.headers['Authorization'] && !options.headers['authorization']) {
            options.headers['Authorization'] = `Bearer ${user.token}`;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing stored user for fetch interceptor:', e);
    }
  }
  return originalFetch(url, options);
};

// Application State
let currentRole = '';
let currentUser = null;
let callInterval = null;
let callSeconds = 0;
let doctorsData = [];

function getCurrentUserName() {
  if (currentUser) {
    if (currentUser.name) return currentUser.name;
    if (currentUser.profile && currentUser.profile.name) return currentUser.profile.name;
  }
  return currentRole === 'doctor' ? 'Doctor' : currentRole === 'admin' ? 'Administrator' : 'Patient';
}

function getCurrentUserId() {
  if (currentUser) {
    if (currentUser.id) return currentUser.id;
    if (currentUser.profile && currentUser.profile.id) return currentUser.profile.id;
  }
  return currentRole === 'doctor' ? 'D-101' : 'P-10421';
}
let appointmentsData = [];
let prescriptionsData = [];
let reportsData = [];
let patientData = null;
let patients = [];
let localStream = null;
let screenStream = null;
let peerConnection = null;
let signalingSocket = null;
let currentReplyIndex = 0;
let dashboardPollInterval = null;

let notificationsData = [
  { id: 1, text: "Welcome to MedXpert! Set up your profile to get started.", time: "Just now", read: false, type: "info" }
];

// WebRTC & Socket.io Global State
let socket = null;
let currentRoomId = null;
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
let activeCallPartnerName = '';

function requestVitals() {
  notify('Requesting live health vitals from patient...', '');
  if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
    signalingSocket.send(JSON.stringify({ type: 'request-vitals' }));
  }
}

function shareVitals() {
  shareVitalsWebSocket();
}

function saveCallNotes() {
  notify('Consultation notes saved successfully', 'success');
}

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
  startMeetClock();
  checkStoredSession();
  initGlobalSignaling();
});

function initEventListeners() {
  // Landing login triggers
  document.getElementById('btn-patient-login')?.addEventListener('click', () => openLogin('patient'));
  document.getElementById('btn-doctor-login')?.addEventListener('click', () => openLogin('doctor'));

  // Login controls
  document.getElementById('btn-do-login')?.addEventListener('click', doLogin);
  document.getElementById('btn-close-login')?.addEventListener('click', closeLogin);

  // Registration and Tab controls
  document.getElementById('tab-login-signin')?.addEventListener('click', () => switchLoginTab('signin'));
  document.getElementById('tab-login-signup')?.addEventListener('click', () => switchLoginTab('signup'));
  document.getElementById('signupRole')?.addEventListener('change', toggleSignupRoleFields);
  document.getElementById('btn-do-signup')?.addEventListener('click', doSignUp);

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

  // Patient Topbar Search & Notification
  document.getElementById('p-search-trigger')?.addEventListener('click', openSearchModal);
  document.getElementById('p-notif-bell')?.addEventListener('click', openNotificationsModal);
  document.getElementById('global-search-input')?.addEventListener('input', handleGlobalSearch);
  document.getElementById('btn-clear-notifications')?.addEventListener('click', clearNotifications);

  // Page navigation click handlers
  bindSidebarNavs('patient-nav', 'p');
  bindSidebarNavs('doctor-nav', 'd');
  bindSidebarNavs('admin-nav', 'a');

  // Video call controls
  document.getElementById('btn-end-video-call')?.addEventListener('click', closeVideoCall);
  document.getElementById('btn-p-connect-now')?.addEventListener('click', () => {
    if (currentRole === 'patient') {
      window.joinVideoRoom('A-501');
    } else {
      openVideoCall(activeCallPartnerName || 'Patient', 'A-501');
    }
  });
  document.querySelector('.btn-start-consult')?.addEventListener('click', () => {
    if (currentRole === 'patient') {
      window.joinVideoRoom('A-501');
    } else {
      openVideoCall(activeCallPartnerName || 'Patient', 'A-501');
    }
  });

  // Incoming video call action handlers
  document.getElementById('btn-accept-incoming-call')?.addEventListener('click', () => {
    if (!pendingIncomingCall) return;
    const call = { ...pendingIncomingCall };
    closeIncomingCallModal();

    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
      signalingSocket.send(JSON.stringify({
        type: 'call-accept',
        roomId: call.roomId,
        appointmentId: call.appointmentId,
        patientName: getCurrentUserName()
      }));
    }

    openVideoCall(call.doctorName || 'Doctor', call.roomId || 'A-501');
  });

  document.getElementById('btn-decline-incoming-call')?.addEventListener('click', () => {
    if (pendingIncomingCall && signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
      signalingSocket.send(JSON.stringify({
        type: 'call-decline',
        roomId: pendingIncomingCall.roomId,
        appointmentId: pendingIncomingCall.appointmentId,
        patientName: getCurrentUserName()
      }));
    }
    closeIncomingCallModal();
    notify('Consultation call declined', 'warning');
  });

  // Admin reports PDF export
  document.getElementById('btn-a-export-pdf')?.addEventListener('click', () => window.print());

  // Profile photo upload triggers
  document.getElementById('patient-photo-input')?.addEventListener('change', handlePatientPhotoUpload);
  document.getElementById('doctor-photo-input')?.addEventListener('change', handleDoctorPhotoUpload);

  const SVG_ICONS = {
    micOn: `<svg class="ctrl-svg-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,
    micOff: `<svg class="ctrl-svg-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,
    camOn: `<svg class="ctrl-svg-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`,
    camOff: `<svg class="ctrl-svg-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="m22 8-6 4 6 4V8Z"/><path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/></svg>`
  };

  // Custom video toggles
  document.querySelector('.mic-toggle')?.addEventListener('click', function () {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const isMuted = !audioTrack.enabled;
        this.classList.toggle('muted', isMuted);
        this.innerHTML = isMuted ? SVG_ICONS.micOff : SVG_ICONS.micOn;

        const selfMicStatus = document.getElementById('selfMicStatus');
        if (selfMicStatus) selfMicStatus.textContent = isMuted ? '🔇' : '🎤';

        if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
          signalingSocket.send(JSON.stringify({
            type: 'mic-toggle',
            room: currentRoomId,
            enabled: !isMuted
          }));
        }
        notify(isMuted ? 'Microphone muted' : 'Microphone unmuted', '');
      } else {
        notify('No active microphone found', 'error');
      }
    } else {
      const isMuted = !this.classList.contains('muted');
      this.classList.toggle('muted', isMuted);
      this.innerHTML = isMuted ? SVG_ICONS.micOff : SVG_ICONS.micOn;

      if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
        signalingSocket.send(JSON.stringify({
          type: 'mic-toggle',
          room: currentRoomId,
          enabled: !isMuted
        }));
      }
      notify(isMuted ? 'Microphone muted' : 'Microphone unmuted', '');
    }
  });

  document.querySelector('.camera-toggle')?.addEventListener('click', function () {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const isDisabled = !videoTrack.enabled;
        this.classList.toggle('muted', isDisabled);
        this.innerHTML = isDisabled ? SVG_ICONS.camOff : SVG_ICONS.camOn;

        const localVideo = document.getElementById('localVideo');
        const placeholder = document.getElementById('localVideoPlaceholder');

        if (localVideo) {
          localVideo.style.display = isDisabled ? 'none' : 'block';
        }
        if (placeholder) {
          placeholder.style.display = isDisabled ? 'inline' : 'none';
        }

        // Send camera mute state to partner
        if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
          signalingSocket.send(JSON.stringify({
            type: 'camera-toggle',
            room: currentRoomId,
            enabled: !isDisabled
          }));
        }

        notify(isDisabled ? 'Camera disabled' : 'Camera enabled', '');
      } else {
        notify('No active camera found', 'error');
      }
    } else {
      const isDisabled = !this.classList.contains('muted');
      this.classList.toggle('muted', isDisabled);
      this.innerHTML = isDisabled ? SVG_ICONS.camOff : SVG_ICONS.camOn;

      if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
        signalingSocket.send(JSON.stringify({
          type: 'camera-toggle',
          room: currentRoomId,
          enabled: !isDisabled
        }));
      }
      notify(isDisabled ? 'Camera disabled' : 'Camera enabled', '');
    }
  });

  // Custom video screen share and chat triggers
  document.querySelector('.screen-share-toggle')?.addEventListener('click', function () {
    toggleScreenShare(this);
  });
  document.querySelector('.chat-toggle')?.addEventListener('click', function () {
    toggleVideoChat(this);
  });
  document.getElementById('btn-meet-chat')?.addEventListener('click', function () {
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

  // CC Captions, Hand Raise, Recording triggers
  document.querySelector('.cc-toggle')?.addEventListener('click', function () {
    toggleSpeechCaptions(this);
  });
  document.querySelector('.hand-toggle')?.addEventListener('click', function () {
    toggleHandRaise(this);
  });
  document.getElementById('btn-record-toggle')?.addEventListener('click', toggleRecording);
  document.querySelector('.record-toggle')?.addEventListener('click', toggleRecording);

  // Popover triggers
  document.getElementById('btn-meet-info')?.addEventListener('click', () => toggleMeetPopover('meetInfoPopover'));
  document.querySelector('.info-toggle')?.addEventListener('click', () => toggleMeetPopover('meetInfoPopover'));
  document.getElementById('btn-meet-people')?.addEventListener('click', () => toggleMeetPopover('meetPeoplePopover'));
  document.querySelector('.people-toggle')?.addEventListener('click', () => toggleMeetPopover('meetPeoplePopover'));
  document.getElementById('btn-meet-security')?.addEventListener('click', () => toggleMeetPopover('meetSecurityPopover'));
  document.querySelector('.host-toggle')?.addEventListener('click', () => toggleMeetPopover('meetSecurityPopover'));
  document.getElementById('btn-copy-meet-link')?.addEventListener('click', copyMeetingLink);

  // Telehealth live sync listeners
  document.getElementById('call-note-clinical')?.addEventListener('input', function () {
    const text = this.value;
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
      signalingSocket.send(JSON.stringify({ type: 'note-sync', room: currentRoomId, text }));
    }
  });

  document.getElementById('btn-reaction-toggle')?.addEventListener('click', function (e) {
    e.stopPropagation();
    const bar = document.querySelector('.meet-emoji-reactions-bar');
    if (bar) {
      const isVisible = bar.style.display !== 'none';
      bar.style.display = isVisible ? 'none' : 'flex';
    }
  });

  document.addEventListener('click', (e) => {
    // Close popovers if clicked outside
    if (!e.target.closest('.meet-floating-popover') && !e.target.closest('.meet-util-btn')) {
      const popovers = ['meetInfoPopover', 'meetPeoplePopover', 'meetSecurityPopover'];
      popovers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
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
  document.getElementById('btn-p-profile-save')?.addEventListener('click', openEditProfileModal);
  document.getElementById('btn-edit-p-profile-submit')?.addEventListener('click', submitEditPatientProfile);

  // Doctor features
  document.getElementById('d-availability-toggle')?.addEventListener('click', toggleDoctorOnlineStatus);
  document.getElementById('btn-d-upload-report')?.addEventListener('click', openDoctorUploadReportModal);
  document.getElementById('btn-d-upload-report-submit')?.addEventListener('click', submitDoctorUploadReport);
  document.getElementById('btn-add-rx-row')?.addEventListener('click', addRxRow);
  document.getElementById('btn-d-new-rx')?.addEventListener('click', () => openModal('prescModal'));
  document.getElementById('btn-issue-presc-submit')?.addEventListener('click', submitIssuePrescription);
  document.getElementById('btn-d-save-draft')?.addEventListener('click', () => notify('Draft consultation notes saved', ''));
  document.getElementById('btn-d-proceed-rx')?.addEventListener('click', proceedToPrescription);
  document.getElementById('btn-d-profile-edit')?.addEventListener('click', openEditDoctorProfileModal);
  document.getElementById('btn-edit-d-profile-submit')?.addEventListener('click', submitEditDoctorProfile);
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
  document.getElementById('btn-edit-user-submit')?.addEventListener('click', submitEditUserAdmin);
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

  // Telehealth consultation room action handlers
  document.getElementById('btn-record-toggle')?.addEventListener('click', toggleRecording);
  document.getElementById('btn-reaction-toggle')?.addEventListener('click', function (e) {
    e.stopPropagation();
    const rxBar = document.querySelector('.meet-emoji-reactions-bar');
    if (rxBar) {
      const isHidden = rxBar.style.display === 'none';
      rxBar.style.display = isHidden ? 'flex' : 'none';
      this.classList.toggle('meet-reaction-active', isHidden);
    }
  });

  // CC (Captions) Toggle
  document.querySelector('.cc-toggle')?.addEventListener('click', function () {
    const isActive = this.style.background === 'var(--primary-light)';
    this.style.background = isActive ? '' : 'var(--primary-light)';
    this.style.color = isActive ? 'rgba(255,255,255,0.7)' : '#202124';
    notify(isActive ? 'Captions disabled' : 'Captions enabled', 'success');
  });

  // Hand Raise Toggle
  document.querySelector('.hand-toggle')?.addEventListener('click', function () {
    const isActive = this.style.background === 'rgb(249, 115, 22)';
    this.style.background = isActive ? '' : '#f97316';
    this.style.color = isActive ? 'white' : '#202124';
    notify(isActive ? 'Hand lowered' : 'Hand raised', 'success');
  });

  // Caret Dropdown Buttons for Mic/Camera
  document.querySelectorAll('.meet-caret-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      notify('Audio/Video source options: System Default selected', '');
    });
  });

  // Utilities Buttons (Details, People, Activities, Host controls)
  document.querySelector('.info-toggle')?.addEventListener('click', () => {
    notify('Meeting Details: Code wfm-iagh-aoi | Encryption Active', 'success');
  });
  document.querySelector('.meet-bar-utilities button[title*="People"]')?.addEventListener('click', () => {
    notify(`Participants (2): ${getCurrentUserName()}, ${activeCallPartnerName || (currentRole === 'doctor' ? 'Patient' : 'Doctor')}`, 'success');
  });
  document.querySelector('.meet-bar-utilities button[title*="Activities"]')?.addEventListener('click', () => {
    notify('Activities: Whiteboard and Polls are available', 'success');
  });
  document.querySelector('.host-toggle')?.addEventListener('click', () => {
    notify('Host controls unlocked: Managed by City Medical Center', 'success');
  });

  document.getElementById('btn-request-vitals')?.addEventListener('click', requestVitals);
  document.getElementById('btn-share-vitals')?.addEventListener('click', shareVitals);
  document.getElementById('btn-call-save-notes')?.addEventListener('click', saveCallNotes);
  document.getElementById('btn-call-share-rx')?.addEventListener('click', () => {
    openModal('prescModal');
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
  const panelId = prefix === 'p' ? 'patientPanel' : prefix === 'd' ? 'doctorPanel' : 'adminPanel';
  document.querySelectorAll(`#${panelId} .nav-link`).forEach(link => {
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
let notifyTimer = null;
function notify(msg, type) {
  const n = document.getElementById('notification');
  if (!n) return;

  if (notifyTimer) {
    clearTimeout(notifyTimer);
    notifyTimer = null;
  }

  n.textContent = msg;
  n.className = 'notification' + (type === 'success' ? ' success' : type === 'error' ? ' error' : type === 'warning' ? ' warning' : '');
  n.classList.add('show');

  notifyTimer = setTimeout(() => {
    n.classList.remove('show');
    notifyTimer = null;
  }, 3500);
}

function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  if (id === 'addUserModal') {
    clearAllAddUserErrors();
  } else if (id === 'adminEditUserModal') {
    clearAllEditUserErrors();
  }
}

function clearAllAddUserErrors() {
  const fields = [
    'addUser-first',
    'addUser-last',
    'addUser-email',
    'addUser-phone',
    'addUser-patient-age',
    'addUser-doctor-specialty',
    'addUser-doctor-exp',
    'addUser-doctor-fee',
    'addUser-doctor-hospital'
  ];
  fields.forEach(clearFieldError);
}

function clearAllEditUserErrors() {
  const fields = [
    'editUser-name',
    'editUser-email',
    'editUser-phone',
    'editUser-patient-age',
    'editUser-doctor-specialty',
    'editUser-doctor-exp',
    'editUser-doctor-fee',
    'editUser-doctor-hospital'
  ];
  fields.forEach(clearFieldError);
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

function switchLoginTab(tab) {
  const tabSignin = document.getElementById('tab-login-signin');
  const tabSignup = document.getElementById('tab-login-signup');
  const formSignin = document.getElementById('signInForm');
  const formSignup = document.getElementById('signUpForm');
  const demoHint = document.getElementById('demo-creds-hint');

  if (tab === 'signin') {
    if (tabSignin) {
      tabSignin.classList.add('active');
      tabSignin.style.borderBottom = '2px solid var(--primary)';
      tabSignin.style.color = 'var(--primary)';
    }
    if (tabSignup) {
      tabSignup.classList.remove('active');
      tabSignup.style.borderBottom = '2px solid transparent';
      tabSignup.style.color = 'var(--text3)';
    }
    if (formSignin) formSignin.style.display = 'block';
    if (formSignup) formSignup.style.display = 'none';
    if (demoHint) demoHint.style.display = 'inline';
  } else {
    if (tabSignup) {
      tabSignup.classList.add('active');
      tabSignup.style.borderBottom = '2px solid var(--primary)';
      tabSignup.style.color = 'var(--primary)';
    }
    if (tabSignin) {
      tabSignin.classList.remove('active');
      tabSignin.style.borderBottom = '2px solid transparent';
      tabSignin.style.color = 'var(--text3)';
    }
    if (formSignin) formSignin.style.display = 'none';
    if (formSignup) formSignup.style.display = 'block';
    if (demoHint) demoHint.style.display = 'none';
  }
}

function toggleSignupRoleFields() {
  const role = document.getElementById('signupRole')?.value;
  const patientFields = document.getElementById('signup-patient-fields');
  const doctorFields = document.getElementById('signup-doctor-fields');

  if (role === 'patient') {
    if (patientFields) patientFields.style.display = 'block';
    if (doctorFields) doctorFields.style.display = 'none';
  } else {
    if (patientFields) patientFields.style.display = 'none';
    if (doctorFields) doctorFields.style.display = 'block';
  }
}

async function doSignUp() {
  const name = document.getElementById('signupName')?.value.trim();
  const email = document.getElementById('signupEmail')?.value.trim();
  const password = document.getElementById('signupPassword')?.value;
  const phone = document.getElementById('signupPhone')?.value.trim();
  const role = document.getElementById('signupRole')?.value;

  if (!name || !email || !password) {
    notify('Please fill in Full Name, Email, and Password.', 'error');
    return;
  }

  // Regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    notify('Please enter a valid email address.', 'error');
    return;
  }

  const payload = { name, email, password, phone, role };

  if (role === 'patient') {
    const age = Number(document.getElementById('signupAge')?.value);
    const gender = document.getElementById('signupGender')?.value;
    const bloodType = document.getElementById('signupBlood')?.value;
    const chronicConditions = document.getElementById('signupConditions')?.value.trim();

    if (isNaN(age) || age < 0 || age > 120) {
      notify('Please enter a valid age between 0 and 120.', 'error');
      return;
    }

    payload.age = age;
    payload.gender = gender;
    payload.bloodType = bloodType;
    payload.chronicConditions = chronicConditions;
  } else if (role === 'doctor') {
    const specialty = document.getElementById('signupSpecialty')?.value.trim();
    const exp = document.getElementById('signupExp')?.value.trim();
    const fee = document.getElementById('signupFee')?.value.trim();
    const hospital = document.getElementById('signupHospital')?.value.trim();

    const gender = document.getElementById('signupDocGender')?.value;

    if (!specialty || !exp || !fee || !hospital) {
      notify('Please fill in all Doctor professional fields.', 'error');
      return;
    }

    payload.specialty = specialty;
    payload.exp = exp;
    payload.fee = fee;
    payload.hospital = hospital;
    payload.gender = gender;
  }

  try {
    let res;
    try {
      res = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (networkErr) {
      notify('Cannot connect to server. Make sure the backend is running.', 'error');
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      notify('Server returned an invalid response.', 'error');
      return;
    }

    if (!res.ok) throw new Error(data.message || data.error || 'Server error during registration');

    notify('Account created successfully!', 'success');

    // Automatically log in the user
    currentUser = data.user;
    if (currentUser) {
      currentUser.profile = data.profile || (role === 'patient' ? { id: `P-${Math.floor(Math.random() * 10000)}`, name } : { id: `D-${Math.floor(Math.random() * 100)}`, name });
      currentUser.token = data.token;
    }
    sessionStorage.setItem('medxpert_user', JSON.stringify(currentUser));
    sessionStorage.setItem('medxpert_role', role);
    startDashboardPolling();

    closeLogin();

    // Hide all panel screens
    document.getElementById('landing').style.display = 'none';
    document.getElementById('patientPanel').style.display = 'none';
    document.getElementById('doctorPanel').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'none';

    // Display dashboard
    currentRole = role;
    if (role === 'patient') {
      document.getElementById('patientPanel').style.display = 'flex';
      await loadPatientData();
      showPage('p', 'pDashboard', document.querySelector('#patient-nav [data-page="pDashboard"]'));
    } else if (role === 'doctor') {
      document.getElementById('doctorPanel').style.display = 'flex';
      await loadDoctorData();
      showPage('d', 'dDashboard', document.querySelector('#doctor-nav [data-page="dDashboard"]'));
    }

    notify(`Welcome, ${name}!`, 'success');
  } catch (err) {
    notify(err.message, 'error');
  }
}

// ── APP SCREEN CONTROL ──
function openLogin(role) {
  currentRole = role;
  const titles = { patient: 'Patient Login', doctor: 'Doctor Login', admin: 'Admin Login' };
  const subtitleEl = document.getElementById('loginSubtitle');
  if (subtitleEl) subtitleEl.textContent = titles[role] || 'Login'


  // Set up signup tab visibility and default role selector
  const signupTab = document.getElementById('tab-login-signup');
  if (signupTab) {
    if (role === 'admin') {
      signupTab.style.display = 'none';
    } else {
      signupTab.style.display = 'block';
      const signupRoleSelect = document.getElementById('signupRole');
      if (signupRoleSelect) {
        signupRoleSelect.value = role;
        toggleSignupRoleFields();
      }
    }
  }

  // Reset tabs to Sign In by default and clear inputs
  switchLoginTab('signin');

  // Clear Sign Up fields
  const fields = ['signupName', 'signupEmail', 'signupPassword', 'signupPhone', 'signupAge', 'signupConditions', 'signupSpecialty', 'signupExp', 'signupFee', 'signupHospital'];
  fields.forEach(fId => {
    const el = document.getElementById(fId);
    if (el) {
      if (fId === 'signupAge') el.value = '30';
      else if (fId === 'signupConditions') el.value = 'None';
      else if (fId === 'signupSpecialty') el.value = 'General Medicine';
      else if (fId === 'signupExp') el.value = '5 yrs';
      else if (fId === 'signupFee') el.value = '₹500';
      else if (fId === 'signupHospital') el.value = 'City Medical Center';
      else el.value = '';
    }
  });

  // Clear inputs for clean and secure login state
  const emailInput = document.getElementById('loginEmail');
  const pwdInput = document.getElementById('loginPwd');
  if (emailInput && pwdInput) {
    pwdInput.value = '';
    if (role === 'patient') {
      emailInput.value = 'saifiashad649@gmail.com';
    } else if (role === 'doctor') {
      emailInput.value = 'umaprajapati759@gmail.com';
    } else if (role === 'admin') {
      emailInput.value = 'admin@medxpert.com';
    }
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
    let res;
    try {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: currentRole })
      });
    } catch (networkErr) {
      notify('Cannot connect to server. Make sure the backend is running on port 5000.', 'error');
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      notify('Server returned an invalid response. Make sure the backend is running on port 5000.', 'error');
      return;
    }

    if (!res.ok) throw new Error(data.message || data.error || 'Server error during login');

    currentUser = data.user;
    if (currentUser) {
      currentUser.profile = data.profile;
      currentUser.token = data.token;
    }
    sessionStorage.setItem('medxpert_user', JSON.stringify(currentUser));
    sessionStorage.setItem('medxpert_role', currentRole);
    startDashboardPolling();
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

    notify(data.message || `Welcome back, ${data.user?.name || ''}!`, 'success');
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
  sessionStorage.removeItem('medxpert_user');
  sessionStorage.removeItem('medxpert_role');
  if (dashboardPollInterval) {
    clearInterval(dashboardPollInterval);
    dashboardPollInterval = null;
  }
}

async function checkStoredSession() {
  const storedUser = sessionStorage.getItem('medxpert_user');
  const storedRole = sessionStorage.getItem('medxpert_role');
  if (storedUser && storedRole) {
    try {
      currentUser = JSON.parse(storedUser);
      currentRole = storedRole;

      // Hide all panel screens
      document.getElementById('landing').style.display = 'none';
      document.getElementById('patientPanel').style.display = 'none';
      document.getElementById('doctorPanel').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'none';

      // Display dashboard
      if (currentRole === 'patient') {
        document.getElementById('patientPanel').style.display = 'flex';
        await loadPatientData();
        await showPage('p', 'pDashboard', document.querySelector('#patient-nav [data-page="pDashboard"]'));
      } else if (currentRole === 'doctor') {
        document.getElementById('doctorPanel').style.display = 'flex';
        await loadDoctorData();
        await showPage('d', 'dDashboard', document.querySelector('#doctor-nav [data-page="dDashboard"]'));
      } else {
        document.getElementById('adminPanel').style.display = 'flex';
        await loadAdminData();
        await showPage('a', 'aDashboard', document.querySelector('#admin-nav [data-page="aDashboard"]'));
      }

      notify(`Logged in as ${currentUser?.name || ''}`, 'success');
      startDashboardPolling();
    } catch (e) {
      console.error('Error parsing stored session:', e);
      sessionStorage.removeItem('medxpert_user');
      sessionStorage.removeItem('medxpert_role');
    }
  }
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

function createMockMediaStream() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let angle = 0;
  const intervalId = setInterval(() => {
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 640, 480);

    ctx.strokeStyle = 'rgba(20, 184, 166, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 640; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 480);
      ctx.stroke();
    }
    for (let j = 0; j < 480; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(640, j);
      ctx.stroke();
    }

    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#14b8a6';
    ctx.beginPath();
    for (let x = 0; x < 640; x++) {
      const y = 240 + Math.sin(x * 0.03 + angle) * 40 * Math.sin(x * 0.005);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "DM Sans", sans-serif';
    ctx.fillText('🔴 SIMULATED WEBCAM FEED', 40, 60);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px "DM Sans", sans-serif';
    ctx.fillText('Vitals Sensor: ONLINE', 40, 90);
    ctx.fillText('Location: MedXpert Encrypted Link', 40, 115);

    angle += 0.05;
  }, 40);

  const stream = canvas.captureStream(25);

  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(dest);
    gain.gain.value = 0.001;
    osc.start(0);

    const audioTrack = dest.stream.getAudioTracks()[0];
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }
  } catch (e) {
    console.error("Web Audio mock generation failed:", e);
  }

  const originalStop = stream.getVideoTracks()[0].stop;
  stream.getVideoTracks()[0].stop = function () {
    clearInterval(intervalId);
    originalStop.call(this);
  };

  return stream;
}

// ── WEBRTC & WEBSOCKETS SIGNALING ──
function showReactionBubble(emoji) {
  const reactionsLayer = document.getElementById('videoReactionsLayer');
  if (!reactionsLayer) return;

  const bubble = document.createElement('div');
  bubble.className = 'reaction-bubble';
  bubble.textContent = emoji;

  const startX = Math.random() * 80 + 10; // 10% to 90%
  bubble.style.left = `${startX}%`;
  bubble.style.bottom = '0px';

  reactionsLayer.appendChild(bubble);

  setTimeout(() => {
    bubble.remove();
  }, 2000);
}

function shareVitalsWebSocket() {
  notify('Sharing live health vitals with doctor...', '');

  const bpSystolic = Math.floor(Math.random() * 10) + 115;
  const bpDiastolic = Math.floor(Math.random() * 6) + 75;
  const hr = Math.floor(Math.random() * 8) + 68;
  const spo2 = Math.floor(Math.random() * 3) + 97;

  if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
    signalingSocket.send(JSON.stringify({
      type: 'vitals-data',
      bp: `${bpSystolic}/${bpDiastolic}`,
      hr: `${hr} bpm`,
      spo2: `${spo2}%`
    }));
  }

  setTimeout(() => {
    notify('Vitals shared with doctor successfully', 'success');
  }, 1000);
}

// ── REAL-TIME WEBRTC & AUDIO ANALYSER STATE ──
let localAudioCtx = null;
let localAudioAnalyser = null;
let remoteAudioCtx = null;
let remoteAudioAnalyser = null;
let localSpeakingInterval = null;
let remoteSpeakingInterval = null;
let unreadChatCount = 0;
let pendingAttachmentData = null;
let iceCandidateQueue = [];
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let recTimerInterval = null;
let recSeconds = 0;
let isCaptionsActive = false;
let speechRecognitionInstance = null;
let isHandRaised = false;

function getSignalingUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname || 'localhost';
  // In Vite dev mode (3000 or 5173), WebSocket is served on backend 5000
  const port = (window.location.port === '3000' || window.location.port === '5173') ? '5000' : (window.location.port || '5000');
  return `${protocol}//${hostname}:${port}`;
}

// ── INCOMING VIDEO CALL & SYNTHESIZED RINGTONE CONTROLLER ──
let incomingCallAudioCtx = null;
let incomingCallRingtoneInterval = null;
let pendingIncomingCall = null;

function playIncomingCallRingtone() {
  try {
    if (incomingCallRingtoneInterval) clearInterval(incomingCallRingtoneInterval);
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!incomingCallAudioCtx || incomingCallAudioCtx.state === 'closed') {
      incomingCallAudioCtx = new AudioContextClass();
    }
    if (incomingCallAudioCtx.state === 'suspended') {
      incomingCallAudioCtx.resume().catch(() => { });
    }

    const playChimeNote = (freq, duration, delay) => {
      setTimeout(() => {
        if (!incomingCallAudioCtx || incomingCallAudioCtx.state === 'closed') return;
        try {
          const osc = incomingCallAudioCtx.createOscillator();
          const gain = incomingCallAudioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, incomingCallAudioCtx.currentTime);
          gain.gain.setValueAtTime(0.12, incomingCallAudioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, incomingCallAudioCtx.currentTime + duration);
          osc.connect(gain);
          gain.connect(incomingCallAudioCtx.destination);
          osc.start();
          osc.stop(incomingCallAudioCtx.currentTime + duration);
        } catch (e) { }
      }, delay);
    };

    const playFullChime = () => {
      // Pleasant medical ringtone chime sequence
      playChimeNote(587.33, 0.25, 0);   // D5
      playChimeNote(739.99, 0.25, 180); // F#5
      playChimeNote(880.00, 0.45, 360); // A5
      playChimeNote(1174.66, 0.6, 600); // D6
    };

    playFullChime();
    incomingCallRingtoneInterval = setInterval(playFullChime, 2500);
  } catch (err) {
    console.warn('Ringtone chime error:', err);
  }
}

function stopIncomingCallRingtone() {
  if (incomingCallRingtoneInterval) {
    clearInterval(incomingCallRingtoneInterval);
    incomingCallRingtoneInterval = null;
  }
  if (incomingCallAudioCtx) {
    incomingCallAudioCtx.close().catch(() => { });
    incomingCallAudioCtx = null;
  }
}

function showIncomingCallModal(callData) {
  pendingIncomingCall = callData;
  const modal = document.getElementById('incomingCallModal');
  if (!modal) return;

  const docNameEl = document.getElementById('incomingCallDoctorName');
  const subEl = document.getElementById('incomingCallSubtitle');
  const avatarInitialsEl = document.getElementById('incomingCallAvatarInitials');
  const badgeEl = document.getElementById('incomingCallRoomBadge');

  const doctorName = callData.doctorName || 'Doctor';
  if (docNameEl) docNameEl.textContent = doctorName;
  if (subEl) subEl.textContent = `is calling you for your scheduled video consultation (${callData.roomId || 'Room A-501'})...`;
  if (badgeEl) badgeEl.textContent = `🎥 ${callData.appointmentId || 'Live Video Consult'}`;

  if (avatarInitialsEl) {
    const parts = doctorName.replace('Dr. ', '').trim().split(' ');
    avatarInitialsEl.textContent = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
  }

  modal.style.display = 'flex';
  playIncomingCallRingtone();

  // Push notification alert
  notify(`📞 Incoming Video Call from ${doctorName}! Click "Join Video Call" to connect.`, 'info');
}

function closeIncomingCallModal() {
  stopIncomingCallRingtone();
  const modal = document.getElementById('incomingCallModal');
  if (modal) modal.style.display = 'none';
  pendingIncomingCall = null;
}

function initGlobalSignaling() {
  try {
    if (signalingSocket && (signalingSocket.readyState === WebSocket.OPEN || signalingSocket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const wsUrl = getSignalingUrl();
    console.log("[GlobalSignaling] Initializing persistent WebSocket signaling at:", wsUrl);
    signalingSocket = new WebSocket(wsUrl);

    signalingSocket.onopen = () => {
      console.log("[GlobalSignaling] WebSocket connected successfully");
      const myId = getCurrentUserId();
      const myName = getCurrentUserName();
      signalingSocket.send(JSON.stringify({
        type: 'register',
        role: currentRole || 'patient',
        userId: myId,
        userName: myName
      }));
    };

    signalingSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSignalingMessage(data);
      } catch (err) {
        console.error("Error parsing signaling message:", err);
      }
    };

    signalingSocket.onclose = () => {
      console.log("[GlobalSignaling] Disconnected. Attempting automatic reconnect in 3s...");
      setTimeout(() => {
        if (!signalingSocket || signalingSocket.readyState === WebSocket.CLOSED) {
          initGlobalSignaling();
        }
      }, 3000);
    };

    signalingSocket.onerror = (err) => {
      console.warn("[GlobalSignaling] WebSocket error:", err);
    };
  } catch (err) {
    console.error("Failed to initialize global signaling:", err);
  }
}

function setupLocalAudioAnalyser(stream) {
  try {
    if (!stream || stream.getAudioTracks().length === 0) return;
    if (localAudioCtx) {
      localAudioCtx.close().catch(() => { });
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    localAudioCtx = new AudioContextClass();
    const source = localAudioCtx.createMediaStreamSource(stream);
    localAudioAnalyser = localAudioCtx.createAnalyser();
    localAudioAnalyser.fftSize = 256;
    source.connect(localAudioAnalyser);

    const bufferLength = localAudioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    if (localSpeakingInterval) clearInterval(localSpeakingInterval);
    localSpeakingInterval = setInterval(() => {
      if (!localAudioAnalyser) return;
      localAudioAnalyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      const isSpeaking = avg > 18;
      const localTile = document.getElementById('localVideoTile');
      const selfMicStatus = document.getElementById('selfMicStatus');

      if (localTile) {
        if (isSpeaking) {
          localTile.classList.add('is-speaking');
          if (selfMicStatus) selfMicStatus.textContent = '🗣️';
        } else {
          localTile.classList.remove('is-speaking');
          if (selfMicStatus) selfMicStatus.textContent = '🎤';
        }
      }

      // Relay speaking status to peer
      if (isSpeaking && signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
        signalingSocket.send(JSON.stringify({
          type: 'speaking-state',
          room: currentRoomId,
          role: currentRole,
          isSpeaking: true
        }));
      }
    }, 150);
  } catch (err) {
    console.warn("Local audio analyser setup error:", err);
  }
}

function setupRemoteAudioAnalyser(stream) {
  try {
    if (!stream || stream.getAudioTracks().length === 0) return;
    if (remoteAudioCtx) {
      remoteAudioCtx.close().catch(() => { });
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    remoteAudioCtx = new AudioContextClass();
    const source = remoteAudioCtx.createMediaStreamSource(stream);
    remoteAudioAnalyser = remoteAudioCtx.createAnalyser();
    remoteAudioAnalyser.fftSize = 256;
    source.connect(remoteAudioAnalyser);

    const bufferLength = remoteAudioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    if (remoteSpeakingInterval) clearInterval(remoteSpeakingInterval);
    remoteSpeakingInterval = setInterval(() => {
      if (!remoteAudioAnalyser) return;
      remoteAudioAnalyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      const isSpeaking = avg > 14;
      updateRemoteSpeakingUI(isSpeaking);
    }, 150);
  } catch (err) {
    console.warn("Remote audio analyser setup error:", err);
  }
}

function updateRemoteSpeakingUI(isSpeaking) {
  const mainTile = document.getElementById('mainVideoTile');
  const partnerDot = document.getElementById('partnerSpeakingDot');
  const partnerBars = document.getElementById('partnerAudioBars');

  if (mainTile) {
    if (isSpeaking) {
      mainTile.classList.add('is-speaking');
    } else {
      mainTile.classList.remove('is-speaking');
    }
  }
  if (partnerDot) {
    partnerDot.style.display = isSpeaking ? 'inline-block' : 'none';
  }
  if (partnerBars) {
    partnerBars.style.display = isSpeaking ? 'flex' : 'none';
  }
}

function createPeerConnection() {
  const normRoom = String(currentRoomId || 'a-501').toLowerCase().replace(/^room-/, '').trim();
  console.log("Creating RTCPeerConnection for room:", normRoom);
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  };
  iceCandidateQueue = [];
  peerConnection = new RTCPeerConnection(configuration);

  if (localStream) {
    localStream.getTracks().forEach(track => {
      try {
        track.enabled = true;
        peerConnection.addTrack(track, localStream);
      } catch (e) {
        console.warn("Track addition warning:", e);
      }
    });
  }

  peerConnection.onicecandidate = (event) => {
    if (event.candidate && signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
      signalingSocket.send(JSON.stringify({
        type: 'webrtc-candidate',
        room: normRoom,
        candidate: event.candidate
      }));
    }
  };

  peerConnection.ontrack = (event) => {
    console.log("Remote WebRTC track received:", event.streams);
    const partnerVideo = document.getElementById('partnerVideo');
    const partnerVideoImage = document.getElementById('partnerVideoImage');
    const avatarCenter = document.getElementById('partnerAvatarCenter');
    const pulseRing = document.getElementById('videoPulseRing');
    const partnerEl = document.getElementById('video-partner-name');
    const partnerRolePill = document.getElementById('partnerRolePill');
    const partnerName = activeCallPartnerName || (currentRole === 'doctor' ? 'Patient' : 'Doctor');
    const partnerRole = currentRole === 'doctor' ? 'Patient' : 'Doctor';

    if (partnerEl) {
      partnerEl.textContent = `${partnerName}`;
    }
    if (partnerRolePill) {
      partnerRolePill.textContent = partnerRole;
      partnerRolePill.className = `participant-role-pill ${partnerRole.toLowerCase()}`;
    }
    if (pulseRing) pulseRing.style.display = 'none';
    if (partnerVideoImage) partnerVideoImage.style.display = 'none';

    if (partnerVideo && event.streams && event.streams[0]) {
      partnerVideo.srcObject = event.streams[0];
      partnerVideo.muted = false; // Remote audio must be unmuted to be heard
      partnerVideo.autoplay = true;
      partnerVideo.playsInline = true;
      partnerVideo.style.display = 'block';
      if (avatarCenter) avatarCenter.style.display = 'none';
      partnerVideo.play().catch(err => console.warn("Error playing remote video:", err));

      setupRemoteAudioAnalyser(event.streams[0]);
    }
  };

  peerConnection.onconnectionstatechange = () => {
    console.log(`WebRTC Connection State: ${peerConnection.connectionState}`);
    const qualityBadge = document.getElementById('callQualityBadge');
    if (peerConnection.connectionState === 'connected') {
      notify("⚡ Live WebRTC Call Connected: Two-Way Video & Voice Active", "success");
      if (qualityBadge) qualityBadge.textContent = '⚡ HD 1080p Connected';
    } else if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
      notify("Connection interrupted. Re-negotiating ICE...", "warning");
      if (qualityBadge) qualityBadge.textContent = '⚠️ Reconnecting...';
      try { peerConnection.restartIce(); } catch (e) { }
    }
  };
}

async function drainIceCandidates() {
  if (!peerConnection || !peerConnection.remoteDescription) return;
  while (iceCandidateQueue.length > 0) {
    const candidate = iceCandidateQueue.shift();
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("Error adding buffered ICE candidate:", err);
    }
  }
}

async function initiateCall() {
  if (!peerConnection) {
    createPeerConnection();
  }
  try {
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await peerConnection.setLocalDescription(offer);
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
      signalingSocket.send(JSON.stringify({
        type: 'webrtc-offer',
        room: currentRoomId,
        offer: offer
      }));
    }
  } catch (err) {
    console.error("Failed to create/send offer:", err);
  }
}

async function handleOffer(offer) {
  if (!peerConnection) {
    createPeerConnection();
  }
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    await drainIceCandidates();
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
      signalingSocket.send(JSON.stringify({
        type: 'webrtc-answer',
        room: currentRoomId,
        answer: answer
      }));
    }
  } catch (err) {
    console.error("Failed to handle offer/create answer:", err);
  }
}

async function handleAnswer(answer) {
  if (peerConnection) {
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      await drainIceCandidates();
    } catch (err) {
      console.error("Failed to handle answer:", err);
    }
  }
}

async function handleCandidate(candidate) {
  if (!candidate) return;
  if (peerConnection && peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Failed to handle ICE candidate:", err);
    }
  } else {
    iceCandidateQueue.push(candidate);
  }
}

function handleSignalingMessage(data) {
  switch (data.type) {
    case 'db-sync':
      console.log("[GlobalSignaling] Live Database Sync Event:", data);
      if (currentRole === 'admin') {
        loadAdminData();
        if (data.message) {
          notify(`Live DB Update: ${data.message}`, 'info');
        }
      } else if (currentRole === 'doctor') {
        loadDoctorData();
      } else if (currentRole === 'patient') {
        loadPatientData();
      }
      break;

    case 'peer-joined':
      console.log(`Peer joined: ${data.userName || data.role}`);
      notify(`${data.userName || (data.role === 'doctor' ? 'Doctor' : 'Patient')} joined the consultation`, 'success');
      const partnerEl = document.getElementById('video-partner-name');
      const partnerRolePill = document.getElementById('partnerRolePill');
      const partnerName = data.userName || activeCallPartnerName || (currentRole === 'doctor' ? 'Ashad saifi' : 'Dr. Shreya Joshi');
      const partnerRole = data.role ? (data.role === 'doctor' ? 'Doctor' : 'Patient') : (currentRole === 'doctor' ? 'Patient' : 'Doctor');

      if (partnerEl) partnerEl.textContent = partnerName;
      if (partnerRolePill) {
        partnerRolePill.textContent = partnerRole;
        partnerRolePill.className = `participant-role-pill ${partnerRole.toLowerCase()}`;
      }
      const pulseRing = document.getElementById('videoPulseRing');
      if (pulseRing) pulseRing.style.display = 'none';

      // Initiator creates offer
      initiateCall();
      break;

    case 'peer-left':
      console.log(`Peer left: ${data.role}`);
      const activeCallOv = document.getElementById('videoCallOverlay');
      if (activeCallOv && activeCallOv.style.display !== 'none' && !isClosingCall) {
        closeVideoCall(false, `${data.userName || (data.role === 'doctor' ? 'Doctor' : 'Patient')} disconnected`);
      }
      break;

    case 'webrtc-offer':
    case 'offer':
      handleOffer(data.offer);
      break;

    case 'webrtc-answer':
    case 'answer':
      handleAnswer(data.answer);
      break;

    case 'webrtc-candidate':
    case 'candidate':
      handleCandidate(data.candidate);
      break;

    case 'chat-message':
    case 'chat':
      appendChatMessage(data.sender, data.role || 'other', data.text, 'other', data.time, data.attachment);
      const sidebar = document.getElementById('videoCallSidebar');
      if (!sidebar || sidebar.style.display === 'none') {
        unreadChatCount++;
        const unreadBadge = document.getElementById('chatUnreadBadge');
        if (unreadBadge) {
          unreadBadge.textContent = unreadChatCount;
          unreadBadge.style.display = 'flex';
        }
        notify(`New message from ${data.sender}`, 'success');
      }
      break;

    case 'note-sync':
    case 'advice':
      const patientAdviceBox = document.getElementById('patient-live-advice-box');
      if (patientAdviceBox) {
        const text = data.text || data.clinical || '';
        if (text) {
          patientAdviceBox.innerHTML = `<div style="font-weight:600;margin-bottom:0.4rem;color:#38bdf8;">🩺 Live Doctor's Advice:</div><div style="line-height:1.5;white-space:pre-wrap;">${text}</div>`;
        } else {
          patientAdviceBox.innerHTML = `<span style="color:rgba(255,255,255,0.4);font-style:italic;">No advice recorded yet. The doctor's advice will update here in real-time.</span>`;
        }
      }
      break;

    case 'speaking-state':
      if (data.role !== currentRole) {
        updateRemoteSpeakingUI(data.isSpeaking);
        setTimeout(() => updateRemoteSpeakingUI(false), 800);
      }
      break;

    case 'reaction':
      showFloatingReaction(data.emoji);
      break;

    case 'request-vitals':
      if (currentRole === 'patient') {
        shareVitalsWebSocket();
      }
      break;

    case 'vitals-data':
      if (currentRole === 'doctor') {
        const bpVal = document.getElementById('val-bp');
        const hrVal = document.getElementById('val-hr');
        const spo2Val = document.getElementById('val-spo2');
        if (bpVal) bpVal.textContent = data.bp;
        if (hrVal) hrVal.textContent = data.hr;
        if (spo2Val) spo2Val.textContent = data.spo2;
        notify('Patient live vitals received & updated', 'success');
      }
      break;

    case 'camera-toggle':
      const remoteVideo = document.getElementById('partnerVideo');
      const remoteAvatar = document.getElementById('partnerAvatarCenter');
      if (remoteVideo) {
        remoteVideo.style.display = data.enabled ? 'block' : 'none';
      }
      if (remoteAvatar) {
        remoteAvatar.style.display = data.enabled ? 'none' : 'flex';
      }
      break;

    case 'mic-toggle':
      const remoteMicIndicator = document.getElementById('partnerMicIndicator');
      if (remoteMicIndicator) {
        remoteMicIndicator.style.display = data.enabled ? 'none' : 'flex';
      }
      break;

    case 'hand-raise':
      showRemoteHandRaise(data.sender, data.isRaised);
      break;

    case 'captions':
      showLiveCaption(data.speaker, data.text);
      break;

    case 'incoming-call':
      // If we are patient and not currently in a call, show incoming call popup modal
      const activeCallOverlay = document.getElementById('videoCallOverlay');
      const isAlreadyInCall = activeCallOverlay && activeCallOverlay.style.display !== 'none';
      if (currentRole === 'patient' || !currentRole) {
        if (!isAlreadyInCall) {
          showIncomingCallModal(data);
        }
      }
      break;

    case 'call-status':
      if (data.status === 'declined' && currentRole === 'doctor') {
        notify(`${data.patientName || 'Patient'} declined the consultation call.`, 'warning');
      } else if (data.status === 'accepted' && currentRole === 'doctor') {
        notify(`${data.patientName || 'Patient'} accepted the call! Connecting video & audio...`, 'success');
      }
      break;

    case 'call-ended':
      closeIncomingCallModal();
      const ovEnd = document.getElementById('videoCallOverlay');
      if (ovEnd && ovEnd.style.display !== 'none' && !isClosingCall) {
        closeVideoCall(false, `${data.userName || 'Doctor'} ended the consultation.`);
      }
      break;
  }
}

function createSimulatedStream() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let angle = 0;
  const animInterval = setInterval(() => {
    if (!ctx) return;

    // Background gradient
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw animated radar ripples
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      const radius = ((angle * 20 + i * 50) % 150);
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Glowing center pulse
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 5,
      canvas.width / 2, canvas.height / 2, 80 + Math.sin(angle) * 20
    );
    gradient.addColorStop(0, 'rgba(14, 165, 233, 0.6)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 80 + Math.sin(angle) * 20, 0, Math.PI * 2);
    ctx.fill();

    // Text indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MedXpert Telehealth Stream Active', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Real-time audio & video bridge active', canvas.width / 2, canvas.height / 2 + 25);
    ctx.fillText('Camera & Mic ready for consultation', canvas.width / 2, canvas.height / 2 + 50);

    angle += 0.05;
  }, 50);

  const stream = canvas.captureStream(25);

  // Add synthetic audio track via Web Audio API
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const dest = audioCtx.createMediaStreamDestination();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.value = 0.0001; // subtle audible carrier for WebRTC RTP packet flow
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        stream.addTrack(audioTrack);
      }
    }
  } catch (aErr) {
    console.warn("Synthetic audio track creation error:", aErr);
  }

  const track = stream.getVideoTracks()[0];
  if (track) {
    track.enabled = true;
    const originalStop = track.stop;
    track.stop = function () {
      clearInterval(animInterval);
      if (originalStop) originalStop.call(track);
    };
  }

  return stream;
}

async function getResilientUserMedia() {
  console.log(`[MediaAccess] Requesting camera & microphone access for role: ${currentRole}`);
  notify("Requesting Camera & Microphone access...", "info");

  // 1. Direct hardware request: dual track (video + audio) with echo cancellation
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    console.log("[MediaAccess] Hardware Camera and Microphone access granted successfully.");
    stream.getVideoTracks().forEach(t => t.enabled = true);
    stream.getAudioTracks().forEach(t => t.enabled = true);
    notify("✅ Camera & Microphone connected", "success");
    return stream;
  } catch (err1) {
    console.warn("HD Dual track getUserMedia failed, trying standard video + audio...", err1);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getVideoTracks().forEach(t => t.enabled = true);
      stream.getAudioTracks().forEach(t => t.enabled = true);
      notify("✅ Camera & Microphone connected", "success");
      return stream;
    } catch (err2) {
      console.warn("Standard dual media failed, trying video only...", err2);
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoStream.getVideoTracks().forEach(t => t.enabled = true);
        const simStream = createSimulatedStream();
        const simAudio = simStream.getAudioTracks()[0];
        if (simAudio) {
          simAudio.enabled = true;
          videoStream.addTrack(simAudio);
        }
        notify("📷 Camera connected", "info");
        return videoStream;
      } catch (err3) {
        console.warn("Video only failed, trying microphone audio only...", err3);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          const simStream = createSimulatedStream();
          const audioTrack = audioStream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = true;
            simStream.addTrack(audioTrack);
          }
          notify("🎤 Microphone connected", "info");
          return simStream;
        } catch (err4) {
          console.warn("Hardware devices unavailable or blocked. Generating simulated telehealth media...", err4);
          notify("Running in simulated telehealth stream mode.", "warning");
          return createSimulatedStream();
        }
      }
    }
  }
}

// Global helper to test/grant camera and mic permissions at any time
window.testMediaPermissions = async function () {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    notify("✅ Camera and Microphone access granted & verified!", "success");
    // Stop tracks immediately after testing
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch (err) {
    console.warn("Test permissions error:", err);
    notify(`Media permission error: ${err.message || 'Please allow camera and mic access in your browser settings.'}`, "error");
    return false;
  }
};

// ── VIDEO ROOM CONTROLLER ──
async function openVideoCall(partnerName = 'Doctor', roomId = 'A-501') {
  const overlay = document.getElementById('videoCallOverlay');
  if (!overlay) return;

  currentRoomId = roomId;
  activeCallPartnerName = partnerName;
  unreadChatCount = 0;

  const timer = document.getElementById('callTimer');
  const partnerEl = document.getElementById('video-partner-name');
  const partnerRolePill = document.getElementById('partnerRolePill');
  const pulseRing = document.getElementById('videoPulseRing');
  const partnerVideo = document.getElementById('partnerVideo');
  const partnerVideoImage = document.getElementById('partnerVideoImage');
  const partnerMicIndicator = document.getElementById('partnerMicIndicator');
  const unreadBadge = document.getElementById('chatUnreadBadge');
  const meetCodeLabel = document.getElementById('meetCodeLabel');
  const selfNameBadge = document.getElementById('selfNameBadge');

  if (meetCodeLabel) meetCodeLabel.textContent = `room-${roomId.toLowerCase()}`;
  if (unreadBadge) unreadBadge.style.display = 'none';

  const myName = getCurrentUserName();
  if (selfNameBadge) selfNameBadge.textContent = `${myName} (You)`;

  if (partnerVideo) {
    partnerVideo.style.display = 'none';
    partnerVideo.srcObject = null;
  }
  if (partnerVideoImage) partnerVideoImage.style.display = 'none';
  if (partnerMicIndicator) partnerMicIndicator.style.display = 'none';

  const partnerRole = currentRole === 'doctor' ? 'Patient' : 'Doctor';
  if (partnerEl) {
    partnerEl.textContent = `${partnerName} (Connecting...)`;
  }
  if (partnerRolePill) {
    partnerRolePill.textContent = partnerRole;
    partnerRolePill.className = `participant-role-pill ${partnerRole.toLowerCase()}`;
  }

  // Set self avatar (top right preview)
  const selfAvatarCircle = document.querySelector('.meet-self-avatar-circle');
  if (selfAvatarCircle) {
    const selfProfile = currentUser && currentUser.profile ? currentUser.profile : null;
    if (selfProfile && selfProfile.profileImage) {
      selfAvatarCircle.textContent = '';
      selfAvatarCircle.style.backgroundImage = `url("${selfProfile.profileImage}")`;
      selfAvatarCircle.style.backgroundSize = 'cover';
      selfAvatarCircle.style.backgroundPosition = 'center';
    } else {
      const nameParts = myName.split(' ');
      const selfInitials = (nameParts.length > 1
        ? nameParts.slice(0, 2).map(n => n[0]).join('')
        : nameParts[0].substring(0, 2)).toUpperCase();
      selfAvatarCircle.textContent = selfInitials;
      selfAvatarCircle.style.backgroundImage = 'none';
    }
  }

  // Set partner avatar (center tile)
  const partnerAvatarCenter = document.getElementById('partnerAvatarCenter');
  let partnerPhoto = '';
  let partnerInitials = partnerName.substring(0, 2).toUpperCase();
  if (currentRole === 'doctor') {
    const patientObj = patients.find(p => p.name.toLowerCase().includes(partnerName.toLowerCase()) || partnerName.toLowerCase().includes(p.name.toLowerCase()));
    if (patientObj) {
      partnerPhoto = patientObj.profileImage || '';
      const nameParts = patientObj.name.split(' ');
      partnerInitials = (nameParts.length > 1 ? nameParts.slice(0, 2).map(n => n[0]).join('') : nameParts[0].substring(0, 2)).toUpperCase();
    }
  } else if (currentRole === 'patient') {
    const doctorObj = doctorsData.find(d => d.name.toLowerCase().includes(partnerName.toLowerCase()) || partnerName.toLowerCase().includes(d.name.toLowerCase()));
    if (doctorObj) {
      partnerPhoto = doctorObj.profileImage || '';
      const nameParts = doctorObj.name.split(' ');
      partnerInitials = (nameParts.length > 1 ? nameParts.slice(1).map(n => n[0]).join('') : nameParts[0].substring(0, 2)).toUpperCase();
    }
  }

  if (partnerAvatarCenter) {
    partnerAvatarCenter.style.display = 'flex';
    if (partnerPhoto) {
      partnerAvatarCenter.innerHTML = `
        <div class="meet-avatar-circle" style="background-image: url('${partnerPhoto}'); background-size: cover; background-position: center; border: 3px solid rgba(255,255,255,0.25); width: 140px; height: 140px; border-radius: 50%; box-shadow: var(--shadow-lg);"></div>
      `;
    } else {
      partnerAvatarCenter.innerHTML = `
        <div class="meet-avatar-circle" style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 700; border: 3px solid rgba(255,255,255,0.25); width: 140px; height: 140px; border-radius: 50%; font-family: 'Outfit', sans-serif; box-shadow: var(--shadow-lg);">
          ${partnerInitials}
        </div>
      `;
    }
  }

  // Set partner doctor details dynamically on ehr-patient-view sidebar
  const callEhrDocName = document.getElementById('call-ehr-doctor-name');
  const callEhrDocMeta = document.getElementById('call-ehr-doctor-meta');
  if (currentRole === 'patient') {
    const doctorObj = doctorsData.find(d => d.name.toLowerCase().includes(partnerName.toLowerCase()) || partnerName.toLowerCase().includes(d.name.toLowerCase()));
    if (doctorObj) {
      if (callEhrDocName) callEhrDocName.textContent = doctorObj.name;
      if (callEhrDocMeta) callEhrDocMeta.textContent = `${doctorObj.specialty || 'General Medicine'} · License ${doctorObj.license || 'MCI-2014-08821'}`;
    } else {
      if (callEhrDocName) callEhrDocName.textContent = partnerName;
      if (callEhrDocMeta) callEhrDocMeta.textContent = 'General Medicine';
    }
  }

  // 1. Access user's camera and microphone
  try {
    const stream = await getResilientUserMedia();
    localStream = stream;

    const localVideo = document.getElementById('localVideo');
    const placeholder = document.getElementById('localVideoPlaceholder');
    const localVideoTile = document.getElementById('localVideoTile');

    if (localVideoTile) localVideoTile.style.display = 'flex';
    if (localVideo) {
      localVideo.srcObject = stream;
      localVideo.muted = true; // Avoid feedback echo for local preview
      localVideo.style.display = 'block';
      localVideo.play().catch(e => console.warn("Local preview play error:", e));
    }
    if (placeholder) placeholder.style.display = 'none';

    // Ensure both video and audio tracks are active
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = true);
      localStream.getAudioTracks().forEach(t => t.enabled = true);
    }

    // Start local audio volume meter
    setupLocalAudioAnalyser(stream);

    // Reset control buttons visually
    const camBtn = document.querySelector('.camera-toggle');
    const micBtn = document.querySelector('.mic-toggle');
    if (camBtn) {
      camBtn.classList.remove('muted');
      camBtn.innerHTML = `<svg class="ctrl-svg-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`;
    }
    if (micBtn) {
      micBtn.classList.remove('muted');
      micBtn.innerHTML = `<svg class="ctrl-svg-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;
    }
  } catch (err) {
    console.warn("Camera/microphone access error:", err);
    notify("Could not access camera/microphone", "error");
  }

  // 2. Initialize WebRTC Peer Connection
  createPeerConnection();

  // 3. Connect/Join room on WebSocket signaling socket
  try {
    const wsUrl = getSignalingUrl();
    console.log("Connecting to MedXpert WebRTC signaling at:", wsUrl);
    if (!signalingSocket || signalingSocket.readyState !== WebSocket.OPEN) {
      signalingSocket = new WebSocket(wsUrl);
      signalingSocket.onopen = () => {
        console.log("WebSocket signaling connected to room:", currentRoomId);
        registerAndJoinRoom();
      };
      signalingSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleSignalingMessage(data);
        } catch (err) {
          console.error("Error parsing signaling message:", err);
        }
      };
      signalingSocket.onclose = () => {
        console.log("WebSocket signaling closed. Re-initializing global listener...");
        setTimeout(initGlobalSignaling, 2000);
      };
      signalingSocket.onerror = (err) => {
        console.error("WebSocket signaling error:", err);
      };
    } else {
      registerAndJoinRoom();
    }

    function registerAndJoinRoom() {
      const myId = currentUser && currentUser.profile ? currentUser.profile.id : (currentRole === 'doctor' ? 'D-101' : 'P-10421');
      signalingSocket.send(JSON.stringify({
        type: 'join',
        role: currentRole,
        room: currentRoomId,
        userName: myName,
        userId: myId
      }));

      // If Doctor is initiating the call, send call invite to notify the patient
      if (currentRole === 'doctor') {
        const patObj = patients.find(p => p.name.toLowerCase().includes(partnerName.toLowerCase()));
        signalingSocket.send(JSON.stringify({
          type: 'call-invite',
          doctorId: myId,
          doctorName: myName,
          patientId: patObj ? patObj.id : 'P-10421',
          patientName: partnerName,
          roomId: currentRoomId,
          appointmentId: currentRoomId
        }));
        notify(`Calling ${partnerName}... Call invitation sent.`, 'info');
      }
    }
  } catch (err) {
    console.error("Failed to establish WebSocket signaling:", err);
    if (partnerEl) partnerEl.textContent = `${partnerName} · Connecting...`;
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

  if (pulseRing) pulseRing.style.display = 'block';

  // Toggle call sidebar
  const videoCallSidebar = document.getElementById('videoCallSidebar');
  if (videoCallSidebar) videoCallSidebar.style.display = 'flex';
  switchCallTab('chat');

  const drView = document.getElementById('ehr-doctor-view');
  const patView = document.getElementById('ehr-patient-view');
  if (currentRole === 'doctor') {
    if (drView) drView.style.display = 'flex';
    if (patView) patView.style.display = 'none';
  } else {
    if (drView) drView.style.display = 'none';
    if (patView) patView.style.display = 'flex';
  }

  // Reset chat state
  const chatMessages = document.getElementById('videoChatMessages');
  if (chatMessages) {
    chatMessages.innerHTML = `
      <div class="chat-msg system">
        <span class="text">🔒 End-to-end encrypted telehealth consultation. Real-time audio, video, & chat active.</span>
      </div>
    `;
  }

  // Clear live sync advice text box and inputs
  const callComplaintInput = document.getElementById('call-note-complaint');
  const callClinicalInput = document.getElementById('call-note-clinical');
  if (callComplaintInput) callComplaintInput.value = '';
  if (callClinicalInput) callClinicalInput.value = '';
  const patientAdviceBox = document.getElementById('patient-live-advice-box');
  if (patientAdviceBox) {
    patientAdviceBox.innerHTML = `<span style="color:rgba(255,255,255,0.4);font-style:italic;">No advice recorded yet. The doctor's advice will update here in real-time.</span>`;
  }

  // Setup in-call file attachment input handler
  const fileInput = document.getElementById('inCallFileInput');
  if (fileInput) {
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        pendingAttachmentData = {
          name: file.name,
          type: file.type,
          dataUrl: event.target.result
        };
        notify(`Attached: ${file.name}. Type a message and send.`, 'info');
        const input = document.getElementById('videoChatInput');
        if (input && !input.value) {
          input.value = `Attached document: ${file.name}`;
          input.focus();
        }
      };
      reader.readAsDataURL(file);
    };
  }

  // Setup Share Rx button in call
  const btnShareRx = document.getElementById('btn-call-share-rx');
  if (btnShareRx) {
    btnShareRx.onclick = () => {
      const complaint = document.getElementById('call-note-complaint')?.value || 'General Consultation';
      const notes = document.getElementById('call-note-clinical')?.value || 'Consultation completed. Rest and hydration advised.';
      const rxMsg = `📋 PRESCRIPTION & CLINICAL ADVICE\nChief Complaint: ${complaint}\nClinical Advice: ${notes}\nPrescribed by: ${getCurrentUserName()}`;
      sendDirectVideoMessage(rxMsg);
      notify('Prescription shared directly to consultation chat', 'success');
    };
  }

  // Setup Save Notes button in call
  const btnSaveNotes = document.getElementById('btn-call-save-notes');
  if (btnSaveNotes) {
    btnSaveNotes.onclick = () => {
      const notes = document.getElementById('call-note-clinical')?.value || '';
      if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
        signalingSocket.send(JSON.stringify({
          type: 'note-sync',
          room: currentRoomId,
          text: notes
        }));
      }
      notify('Advice saved and synchronized with patient', 'success');
    };
  }
}

let isClosingCall = false;
function closeVideoCall(broadcast = true, customMsg = null) {
  const overlay = document.getElementById('videoCallOverlay');
  if (!overlay || overlay.style.display === 'none') return;
  if (isClosingCall) return;
  isClosingCall = true;

  overlay.style.display = 'none';

  clearInterval(callInterval);
  if (localSpeakingInterval) {
    clearInterval(localSpeakingInterval);
    localSpeakingInterval = null;
  }
  if (remoteSpeakingInterval) {
    clearInterval(remoteSpeakingInterval);
    remoteSpeakingInterval = null;
  }
  if (localAudioCtx) {
    localAudioCtx.close().catch(() => { });
    localAudioCtx = null;
  }
  if (remoteAudioCtx) {
    remoteAudioCtx.close().catch(() => { });
    remoteAudioCtx = null;
  }

  const timer = document.getElementById('callTimer');
  const durationText = timer ? timer.textContent : '00:00';

  // Show clean single notification without flicker
  if (customMsg) {
    notify(customMsg, 'info');
  } else {
    notify(`Consultation ended. Duration: ${durationText}`, 'success');
  }

  // Stop recording if active without extra alert
  if (isRecording) {
    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      clearInterval(recTimerInterval);
      isRecording = false;
    } catch (e) { }
  }

  // Stop screen sharing if active
  if (screenStream) {
    stopScreenShare();
  }

  // Stop speech recognition if active
  if (speechRecognitionInstance) {
    speechRecognitionInstance.stop();
    speechRecognitionInstance = null;
  }
  isCaptionsActive = false;
  const captionsBanner = document.getElementById('liveCaptionsBanner');
  if (captionsBanner) captionsBanner.style.display = 'none';

  // Reset hand raise
  isHandRaised = false;
  const handBanner = document.getElementById('handRaisedBanner');
  if (handBanner) handBanner.style.display = 'none';

  // Broadcast call-ended to peer ONLY if we are the initiator of call end
  if (broadcast && signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
    signalingSocket.send(JSON.stringify({
      type: 'call-ended',
      roomId: currentRoomId,
      appointmentId: currentRoomId,
      role: currentRole,
      userName: getCurrentUserName()
    }));
  }

  // Stop all camera and microphone tracks
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  const localVideoTile = document.getElementById('localVideoTile');
  if (localVideoTile) localVideoTile.style.display = 'none';

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('partnerVideo');
  const placeholder = document.getElementById('localVideoPlaceholder');

  if (localVideo) {
    localVideo.srcObject = null;
    localVideo.style.display = 'none';
  }
  if (remoteVideo) {
    remoteVideo.srcObject = null;
    remoteVideo.style.display = 'none';
  }
  if (placeholder) placeholder.style.display = 'inline';

  const sidebar = document.getElementById('videoCallSidebar');
  if (sidebar) sidebar.style.display = 'none';

  // Close WebRTC peer connection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  // Re-register global signaling socket for standby notifications
  initGlobalSignaling();

  setTimeout(() => {
    isClosingCall = false;
  }, 1000);

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

      if (screenVideo) {
        screenVideo.srcObject = stream;
        screenVideo.style.display = 'block';
      }
      if (pulseRing) pulseRing.style.display = 'none';

      // WebRTC: Replace camera video track with screen-share video track
      const videoTrack = stream.getVideoTracks()[0];
      if (peerConnection) {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        }
      }

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
  if (screenVideo) {
    screenVideo.srcObject = null;
    screenVideo.style.display = 'none';
  }

  // Revert back to Camera video track in Peer Connection
  if (peerConnection && localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      const senders = peerConnection.getSenders();
      const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
      if (videoSender) {
        videoSender.replaceTrack(videoTrack);
      }
    }
  }
}

// ── RECORDING CONTROLLER ──
function toggleRecording() {
  const recBadge = document.getElementById('recIndicatorBadge');
  const recTimer = document.getElementById('recTimer');
  const recBtn = document.getElementById('btn-record-toggle') || document.querySelector('.record-toggle');

  if (isRecording) {
    // Stop recording
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    isRecording = false;
    if (recTimerInterval) {
      clearInterval(recTimerInterval);
      recTimerInterval = null;
    }
    if (recBadge) recBadge.style.display = 'none';
    if (recBtn) {
      recBtn.style.background = '';
      recBtn.style.color = '';
      recBtn.title = 'Start Recording';
    }
    notify('Consultation recording saved and downloading...', 'success');
  } else {
    // Start recording
    try {
      recordedChunks = [];
      const streamToRecord = localStream || (document.getElementById('localVideo')?.srcObject);
      if (!streamToRecord) {
        notify('No active media stream found to record', 'error');
        return;
      }

      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        delete options.mimeType;
      }

      mediaRecorder = new MediaRecorder(streamToRecord, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (recordedChunks.length === 0) return;
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `MedXpert_Consultation_${currentRoomId}_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      };

      mediaRecorder.start(1000); // 1s slices
      isRecording = true;
      recSeconds = 0;
      if (recBadge) recBadge.style.display = 'flex';
      if (recTimer) recTimer.textContent = '00:00';
      if (recBtn) {
        recBtn.style.background = '#ef4444';
        recBtn.style.color = 'white';
        recBtn.title = 'Stop Recording';
      }

      recTimerInterval = setInterval(() => {
        recSeconds++;
        const m = String(Math.floor(recSeconds / 60)).padStart(2, '0');
        const s = String(recSeconds % 60).padStart(2, '0');
        if (recTimer) recTimer.textContent = `${m}:${s}`;
      }, 1000);

      notify('Consultation recording started', 'info');
    } catch (err) {
      console.error('Error starting media recording:', err);
      notify('Recording not supported on this device/stream', 'error');
    }
  }
}

// ── SPEECH CAPTIONS (CC) ──
function toggleSpeechCaptions(btn) {
  isCaptionsActive = !isCaptionsActive;
  const banner = document.getElementById('liveCaptionsBanner');
  const ccBtn = btn || document.querySelector('.cc-toggle');

  if (isCaptionsActive) {
    if (ccBtn) {
      ccBtn.style.background = '#38bdf8';
      ccBtn.style.color = '#0f172a';
    }
    if (banner) {
      banner.style.display = 'flex';
      const speakerEl = document.getElementById('captionSpeaker');
      const textEl = document.getElementById('captionText');
      if (speakerEl) speakerEl.textContent = `${currentUser?.name || 'You'}:`;
      if (textEl) textEl.textContent = 'Listening for live voice...';
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        speechRecognitionInstance = new SpeechRec();
        speechRecognitionInstance.continuous = true;
        speechRecognitionInstance.interimResults = true;
        speechRecognitionInstance.lang = 'en-US';

        speechRecognitionInstance.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            const speakerName = getCurrentUserName();
            showLiveCaption(speakerName, transcript);
            if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
              signalingSocket.send(JSON.stringify({
                type: 'captions',
                room: currentRoomId,
                speaker: speakerName,
                text: transcript
              }));
            }
          }
        };

        speechRecognitionInstance.onerror = (e) => console.warn('Speech recognition error:', e);
        speechRecognitionInstance.onend = () => {
          if (isCaptionsActive && speechRecognitionInstance) {
            try { speechRecognitionInstance.start(); } catch (e) { }
          }
        };

        speechRecognitionInstance.start();
      } catch (err) {
        console.warn('Speech recognition error:', err);
      }
    } else {
      showLiveCaption(currentUser?.name || 'You', 'Real-time WebRTC audio transcription active.');
    }
    notify('Live Subtitles / Closed Captions enabled', 'info');
  } else {
    if (ccBtn) {
      ccBtn.style.background = '';
      ccBtn.style.color = '';
    }
    if (banner) banner.style.display = 'none';
    if (speechRecognitionInstance) {
      speechRecognitionInstance.stop();
      speechRecognitionInstance = null;
    }
    notify('Closed captions disabled', '');
  }
}

function showLiveCaption(speaker, text) {
  const banner = document.getElementById('liveCaptionsBanner');
  const speakerEl = document.getElementById('captionSpeaker');
  const textEl = document.getElementById('captionText');

  if (banner) banner.style.display = 'flex';
  if (speakerEl) speakerEl.textContent = `${speaker}:`;
  if (textEl) textEl.textContent = text;
}

// ── HAND RAISE CONTROLLER ──
function toggleHandRaise(btn) {
  isHandRaised = !isHandRaised;
  const handBtn = btn || document.querySelector('.hand-toggle');
  const handBanner = document.getElementById('handRaisedBanner');
  const myName = getCurrentUserName();

  if (isHandRaised) {
    if (handBtn) {
      handBtn.style.background = '#eab308';
      handBtn.style.color = '#1e293b';
    }
    if (handBanner) {
      handBanner.style.display = 'flex';
      const textEl = document.getElementById('handRaisedText');
      if (textEl) textEl.textContent = 'You raised your hand';
    }
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
      signalingSocket.send(JSON.stringify({
        type: 'hand-raise',
        room: currentRoomId,
        sender: myName,
        isRaised: true
      }));
    }
    notify('You raised your hand', 'info');
  } else {
    if (handBtn) {
      handBtn.style.background = '';
      handBtn.style.color = '';
    }
    if (handBanner) handBanner.style.display = 'none';
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
      signalingSocket.send(JSON.stringify({
        type: 'hand-raise',
        room: currentRoomId,
        sender: myName,
        isRaised: false
      }));
    }
  }
}

function showRemoteHandRaise(name, isRaised) {
  const handBanner = document.getElementById('handRaisedBanner');
  if (isRaised) {
    if (handBanner) {
      handBanner.style.display = 'flex';
      const textEl = document.getElementById('handRaisedText');
      if (textEl) textEl.textContent = `${name} raised hand`;
    }
    notify(`✋ ${name} raised hand in consultation`, 'info');
  } else {
    if (handBanner && !isHandRaised) {
      handBanner.style.display = 'none';
    }
  }
}

// ── MEETING POPOVERS (INFO, PEOPLE, SECURITY) ──
function toggleMeetPopover(popoverId) {
  const popovers = ['meetInfoPopover', 'meetPeoplePopover', 'meetSecurityPopover'];
  popovers.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === popoverId) {
      const isVisible = el.style.display === 'block' || el.style.display === 'flex';
      el.style.display = isVisible ? 'none' : 'block';
    } else {
      el.style.display = 'none';
    }
  });

  // Populate dynamic details
  if (popoverId === 'meetInfoPopover') {
    const roomCodeEl = document.getElementById('popoverRoomCode');
    const consultIdEl = document.getElementById('popoverConsultId');
    if (roomCodeEl) roomCodeEl.textContent = `room-${(currentRoomId || 'a-501').toLowerCase()}`;
    if (consultIdEl) consultIdEl.textContent = currentRoomId || 'A-501';
  } else if (popoverId === 'meetPeoplePopover') {
    const pSelfName = document.getElementById('p-self-name');
    const pSelfRole = document.getElementById('p-self-role');
    const pPartnerName = document.getElementById('p-partner-name');
    const pPartnerRole = document.getElementById('p-partner-role');
    const myName = getCurrentUserName();

    if (pSelfName) pSelfName.textContent = `${myName} (You)`;
    if (pSelfRole) pSelfRole.textContent = `${currentRole === 'doctor' ? 'Doctor' : 'Patient'} · Host`;
    if (pPartnerName) pPartnerName.textContent = activeCallPartnerName || (currentRole === 'doctor' ? 'Patient' : 'Doctor');
    if (pPartnerRole) pPartnerRole.textContent = `${currentRole === 'doctor' ? 'Patient' : 'Doctor'} · Remote`;
  }
}

function copyMeetingLink() {
  const roomLink = `${window.location.origin}/medxpert.html?room=${currentRoomId || 'A-501'}`;
  navigator.clipboard.writeText(roomLink).then(() => {
    notify('Consultation meeting link copied to clipboard', 'success');
  }).catch(() => {
    notify(`Room code: ${currentRoomId}`, 'info');
  });
}

// ── IN-CALL CHAT & EHR DRAWER CONTROLS ──
function updateCallEhrView() {
  const doctorView = document.getElementById('ehr-doctor-view');
  const patientView = document.getElementById('ehr-patient-view');
  if (currentRole === 'doctor') {
    if (doctorView) doctorView.style.display = 'flex';
    if (patientView) patientView.style.display = 'none';
  } else if (currentRole === 'patient') {
    if (doctorView) doctorView.style.display = 'none';
    if (patientView) patientView.style.display = 'flex';
  }
}

function switchCallTab(tab) {
  const chatBtn = document.getElementById('tab-btn-chat');
  const ehrBtn = document.getElementById('tab-btn-ehr');
  const chatTab = document.getElementById('call-tab-chat');
  const ehrTab = document.getElementById('call-tab-ehr');

  if (tab === 'chat') {
    chatBtn?.classList.add('active');
    ehrBtn?.classList.remove('active');
    if (chatTab) chatTab.style.display = 'flex';
    if (ehrTab) ehrTab.style.display = 'none';
  } else if (tab === 'ehr') {
    ehrBtn?.classList.add('active');
    chatBtn?.classList.remove('active');
    if (chatTab) chatTab.style.display = 'none';
    if (ehrTab) ehrTab.style.display = 'flex';
    updateCallEhrView();
  }
}

function toggleVideoChat(btn) {
  const panel = document.getElementById('videoCallSidebar');
  if (!panel) return;

  const isOpen = panel.style.display === 'flex';
  panel.style.display = isOpen ? 'none' : 'flex';
  if (btn) btn.style.background = isOpen ? '' : '#14b8a6';

  if (!isOpen) {
    // Reset unread count
    unreadChatCount = 0;
    const unreadBadge = document.getElementById('chatUnreadBadge');
    if (unreadBadge) unreadBadge.style.display = 'none';

    const input = document.getElementById('videoChatInput');
    if (input) input.focus();
    const messages = document.getElementById('videoChatMessages');
    if (messages) messages.scrollTop = messages.scrollHeight;
    updateCallEhrView();
  }
}

function appendChatMessage(sender, role, text, type, timeStr = null, attachment = null) {
  const container = document.getElementById('videoChatMessages');
  if (!container) return;

  const time = timeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgEl = document.createElement('div');
  msgEl.className = `chat-msg ${type}`;

  if (type !== 'system') {
    const metaEl = document.createElement('div');
    metaEl.className = 'msg-meta';

    const roleBadge = document.createElement('span');
    const roleClass = (role || 'user').toLowerCase();
    roleBadge.className = `badge-role ${roleClass}`;
    roleBadge.textContent = roleClass === 'doctor' ? 'Doctor' : 'Patient';

    const senderEl = document.createElement('span');
    senderEl.className = 'sender';
    senderEl.textContent = sender;

    const timeEl = document.createElement('span');
    timeEl.className = 'time-stamp';
    timeEl.textContent = time;

    metaEl.appendChild(roleBadge);
    metaEl.appendChild(senderEl);
    metaEl.appendChild(timeEl);
    msgEl.appendChild(metaEl);
  }

  const textEl = document.createElement('span');
  textEl.className = 'text';
  textEl.textContent = text;
  msgEl.appendChild(textEl);

  // If message includes an image/document attachment
  if (attachment && attachment.dataUrl) {
    if (attachment.type && attachment.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = attachment.dataUrl;
      img.className = 'chat-attachment-img';
      img.alt = attachment.name || 'Attachment';
      img.onclick = () => window.open(attachment.dataUrl, '_blank');
      msgEl.appendChild(img);
    } else {
      const link = document.createElement('a');
      link.href = attachment.dataUrl;
      link.download = attachment.name || 'document';
      link.className = 'btn btn-outline btn-sm mt-1';
      link.style.color = '#38bdf8';
      link.style.borderColor = 'rgba(56,189,248,0.4)';
      link.textContent = `📥 Download ${attachment.name || 'File'}`;
      msgEl.appendChild(link);
    }
  }

  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

function sendVideoChatMessage() {
  const input = document.getElementById('videoChatInput');
  if (!input) return;

  const text = input.value.trim();
  if (!text && !pendingAttachmentData) return;

  const myName = getCurrentUserName();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  appendChatMessage(myName, currentRole, text || 'Attached file', 'self', time, pendingAttachmentData);
  input.value = '';

  // Send the chat message via native WebSocket
  if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
    signalingSocket.send(JSON.stringify({
      type: 'chat-message',
      room: currentRoomId,
      sender: myName,
      role: currentRole,
      text: text || 'Attached file',
      attachment: pendingAttachmentData,
      time: time
    }));
  }

  pendingAttachmentData = null;
}

function sendDirectVideoMessage(text) {
  const myName = getCurrentUserName();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  appendChatMessage(myName, currentRole, text, 'self', time);

  if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
    signalingSocket.send(JSON.stringify({
      type: 'chat-message',
      room: currentRoomId,
      sender: myName,
      role: currentRole,
      text: text,
      time: time
    }));
  }
}

window.sendQuickChatMessage = function (text) {
  sendDirectVideoMessage(text);
};

// Sidebar Tab switching inside active Video call
window.switchCallTab = function (tabName) {
  const chatTab = document.getElementById('call-tab-chat');
  const ehrTab = document.getElementById('call-tab-ehr');
  const btnChat = document.getElementById('tab-btn-chat');
  const btnEhr = document.getElementById('tab-btn-ehr');

  if (tabName === 'chat') {
    if (chatTab) chatTab.style.display = 'flex';
    if (ehrTab) ehrTab.style.display = 'none';
    if (btnChat) btnChat.classList.add('active');
    if (btnEhr) btnEhr.classList.remove('active');
  } else {
    if (chatTab) chatTab.style.display = 'none';
    if (ehrTab) ehrTab.style.display = 'flex';
    if (btnChat) btnChat.classList.remove('active');
    if (btnEhr) btnEhr.classList.add('active');
    updateCallEhrView();
  }
};

// Dynamic Reaction floating emoji animations
window.sendReaction = function (emoji, event) {
  if (event) event.stopPropagation();

  if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN && currentRoomId) {
    signalingSocket.send(JSON.stringify({ type: 'reaction', room: currentRoomId, emoji }));
  }

  showFloatingReaction(emoji);
};

function showFloatingReaction(emoji) {
  const container = document.getElementById('videoReactionsLayer');
  if (!container) return;

  const reaction = document.createElement('div');
  reaction.textContent = emoji;
  reaction.className = 'floating-emoji';

  const randX = Math.random() * 80 + 10;
  reaction.style.left = `${randX}%`;

  container.appendChild(reaction);

  setTimeout(() => {
    reaction.remove();
  }, 3000);
}

// ── PATIENT FLOW APIS ──
async function safeJson(res) {
  try { return await res.json(); } catch (e) { return null; }
}

async function loadPatientData() {
  try {
    // 1. Load profile data
    const patId = currentUser && currentUser.profile ? currentUser.profile.id : 'P-10421';
    const resPat = await fetch(`${API_BASE}/patients/${patId}`);
    const pat = await safeJson(resPat);
    if (pat && !pat.error) patientData = pat;

    // 2. Load appointments
    const resAppt = await fetch(`${API_BASE}/appointments`);
    const appts = await safeJson(resAppt);
    if (Array.isArray(appts)) appointmentsData = appts;
    renderPatientAppointments();

    // 3. Load prescriptions
    const resRx = await fetch(`${API_BASE}/prescriptions`);
    const rxs = await safeJson(resRx);
    if (Array.isArray(rxs)) prescriptionsData = rxs;
    renderPatientPrescriptions();

    // 4. Load reports
    const resRep = await fetch(`${API_BASE}/reports`);
    const reps = await safeJson(resRep);
    if (Array.isArray(reps)) reportsData = reps;
    renderPatientReports();

    // 5. Load doctors for lists
    const resDocs = await fetch(`${API_BASE}/doctors`);
    const docs = await safeJson(resDocs);
    if (Array.isArray(docs)) doctorsData = docs;
    renderDoctorsList();

    // 6. Load notifications from MongoDB
    const resNotif = await fetch(`${API_BASE}/notifications?userId=${patId}`);
    const notifs = await safeJson(resNotif);
    if (Array.isArray(notifs)) {
      notificationsData = notifs;
    }

    // Update UI profile and dashboard stats
    updatePatientProfileUI();
    updateNotificationsBadge();
  } catch (err) {
    console.error("Error loading patient data", err);
  }
}

function updatePatientProfileUI() {
  if (!patientData) return;

  const activeRx = prescriptionsData.filter(rx => rx.patientId === patientData.id && rx.status === 'Active').length;
  const upcomingAppts = appointmentsData.filter(a => a.patientId === patientData.id && a.status === 'Confirmed').length;
  const totalPatientAppts = appointmentsData.filter(a => a.patientId === patientData.id).length;
  const uniqueDocs = new Set(appointmentsData.filter(a => a.patientId === patientData.id).map(a => a.doctorId)).size;

  const statRxEl = document.getElementById('p-stat-prescriptions');
  const statApptEl = document.getElementById('p-stat-upcoming');
  const statRepEl = document.getElementById('p-stat-lab-reports');
  const statDocEl = document.getElementById('p-stat-doctors');
  const badgeApptEl = document.getElementById('p-badge-appt-count');

  if (statRxEl) statRxEl.textContent = activeRx;
  if (statApptEl) statApptEl.textContent = upcomingAppts;
  if (statRepEl) statRepEl.textContent = reportsData.filter(r => r.patientId === patientData.id).length;
  if (statDocEl) statDocEl.textContent = uniqueDocs;
  if (badgeApptEl) badgeApptEl.textContent = totalPatientAppts;

  // Render dynamic health timeline
  const timelineContainer = document.getElementById('p-timeline-container');
  if (timelineContainer) {
    timelineContainer.innerHTML = '';
    const events = [];

    // Appointments
    appointmentsData.filter(a => a.patientId === patientData.id).forEach(a => {
      events.push({
        title: `${a.type} with ${a.doctorName}`,
        sub: `${a.reason} · ${new Date(a.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
        date: new Date(a.dateTime)
      });
    });

    // Prescriptions
    prescriptionsData.filter(rx => rx.patientId === patientData.id).forEach(rx => {
      events.push({
        title: `Prescription issued`,
        sub: `${rx.medicines && rx.medicines[0] ? rx.medicines[0].name : 'Medication'} · ${new Date(rx.createdAt || rx.date || new Date()).toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
        date: new Date(rx.createdAt || rx.date || new Date())
      });
    });

    // Lab Reports
    reportsData.filter(r => r.patientId === patientData.id).forEach(r => {
      events.push({
        title: `Lab report uploaded`,
        sub: `${r.testName || 'Medical Document'} · ${new Date(r.createdAt || r.date || new Date()).toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
        date: new Date(r.createdAt || r.date || new Date())
      });
    });

    events.sort((a, b) => b.date - a.date);

    if (events.length === 0) {
      timelineContainer.innerHTML = '<div class="text-muted text-sm text-center py-4">No health history events recorded yet.</div>';
    } else {
      events.slice(0, 4).forEach(e => {
        const item = document.createElement('div');
        item.className = 'tl-item';
        item.innerHTML = `
          <div class="tl-dot"></div>
          <div class="tl-content">
            <div class="tl-title">${e.title}</div>
            <div class="tl-sub">${e.sub}</div>
          </div>
        `;
        timelineContainer.appendChild(item);
      });
    }
  }

  // Profile displays
  const profName = document.getElementById('p-profile-name');
  const profId = document.getElementById('p-profile-id');
  const profAvatar = document.getElementById('p-profile-avatar-img');
  if (profName) profName.textContent = patientData.name;
  if (profId) profId.textContent = `Patient ID: ${patientData.id}`;

  const nameParts = patientData.name.split(' ');
  const initials = (nameParts.length > 1
    ? nameParts.slice(0, 2).map(n => n[0]).join('')
    : nameParts[0].substring(0, 2)).toUpperCase();

  const resolvedAvatar = getAvatarImage(patientData.profileImage, patientData.name, patientData.gender);

  if (profAvatar) {
    if (resolvedAvatar) {
      profAvatar.textContent = '';
      profAvatar.style.backgroundImage = `url("${resolvedAvatar}")`;
      profAvatar.style.backgroundSize = 'cover';
      profAvatar.style.backgroundPosition = 'center';
    } else {
      profAvatar.textContent = initials;
      profAvatar.style.backgroundImage = 'none';
    }
  }

  // Update sidebar profile card
  const sideName = document.getElementById('p-user-display-name');
  const sideId = document.getElementById('p-user-display-id');
  const sideAvatar = document.getElementById('p-user-display-avatar');

  if (sideName) sideName.textContent = patientData.name;
  if (sideId) sideId.textContent = `Patient ID: ${patientData.id}`;
  if (sideAvatar) {
    if (resolvedAvatar) {
      sideAvatar.textContent = '';
      sideAvatar.style.backgroundImage = `url("${resolvedAvatar}")`;
      sideAvatar.style.backgroundSize = 'cover';
      sideAvatar.style.backgroundPosition = 'center';
    } else {
      sideAvatar.textContent = initials;
      sideAvatar.style.backgroundImage = 'none';
    }
  }

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
    let bmiStr = 'N/A';
    if (patientData.weight && patientData.height) {
      const h = parseFloat(patientData.height) / 100;
      const w = parseFloat(patientData.weight);
      if (h > 0 && w > 0) {
        const bmiVal = (w / (h * h)).toFixed(1);
        let category = 'Normal';
        if (bmiVal < 18.5) category = 'Underweight';
        else if (bmiVal >= 25 && bmiVal < 30) category = 'Overweight';
        else if (bmiVal >= 30) category = 'Obese';
        bmiStr = `${bmiVal} – ${category}`;
      }
    }

    ehrContainer.innerHTML = `
      <div class="flex justify-between"><span class="text-muted">Blood Type</span><span class="font-semibold">${patientData.bloodType}</span></div>
      <div class="flex justify-between"><span class="text-muted">Height</span><span class="font-semibold">${patientData.height}</span></div>
      <div class="flex justify-between"><span class="text-muted">Weight</span><span class="font-semibold">${patientData.weight}</span></div>
      <div class="flex justify-between"><span class="text-muted">BMI</span><span class="font-semibold">${bmiStr}</span></div>
      <div class="flex justify-between"><span class="text-muted">Allergies</span><span class="font-semibold">${patientData.allergies}</span></div>
      <div class="flex justify-between"><span class="text-muted">Chronic Conditions</span><span class="font-semibold">${patientData.conditions}</span></div>
    `;
  }
}

function renderPatientAppointments() {
  const tableBody = document.getElementById('p-appointments-table-body');
  const pastTableBody = document.getElementById('p-past-appointments-table-body');
  const dashboardContainer = document.getElementById('p-dashboard-appts');
  const videoApptList = document.getElementById('p-video-appts-list');

  if (tableBody) tableBody.innerHTML = '';
  if (pastTableBody) pastTableBody.innerHTML = '';
  if (dashboardContainer) dashboardContainer.innerHTML = '';
  if (videoApptList) videoApptList.innerHTML = '';

  const patId = patientData ? patientData.id : (currentUser && currentUser.profile ? currentUser.profile.id : "P-10421");
  const myAppts = appointmentsData.filter(a => a.patientId === patId);

  myAppts.forEach(appt => {
    const formattedDate = new Date(appt.dateTime).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const badgeClass = appt.type === 'Video' ? 'badge-blue' : 'badge-teal';
    const statusBadge = appt.status === 'Confirmed' ? 'badge-green' : appt.status === 'Cancelled' ? 'badge-red' : appt.status === 'Pending' ? 'badge-yellow' : 'badge-gray';

    // Append to appointments page table
    if (appt.status === 'Completed' || appt.status === 'Cancelled') {
      if (pastTableBody) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div class="font-semibold">${appt.doctorName}</div>
          </td>
          <td>${formattedDate}</td>
          <td><span class="badge ${badgeClass}">${appt.type}</span></td>
          <td>${appt.reason || 'Regular checkup'}</td>
        `;
        pastTableBody.appendChild(tr);
      }
    } else {
      if (tableBody) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><div class="font-semibold">${appt.doctorName}</div></td>
          <td>${formattedDate}</td>
          <td><span class="badge ${badgeClass}">${appt.type}</span></td>
          <td><span class="badge ${statusBadge}">${appt.status}</span></td>
          <td>
            <div style="display:flex;gap:0.5rem;align-items:center;">
              ${appt.status === 'Confirmed' && appt.type === 'Video'
            ? `<button class="btn btn-sm btn-primary" onclick="window.joinVideoRoom('${appt.id}', '${appt.doctorName}')">Join Call</button>`
            : ''}
              ${appt.status === 'Confirmed' || appt.status === 'Pending'
            ? `<button class="btn btn-sm btn-outline" onclick="window.openRescheduleModal('${appt.id}')">Reschedule</button>
                 <button class="btn btn-sm btn-ghost" onclick="window.cancelAppointment('${appt.id}')">Cancel</button>`
            : `–`}
            </div>
          </td>
        `;
        tableBody.appendChild(tr);
      }
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
        <button class="btn btn-primary btn-sm" onclick="window.joinVideoRoom('${appt.id}', '${appt.doctorName}')">Join</button>
      `;
      videoApptList.appendChild(div);
    }
  });

  // Add empty states if no data
  if (tableBody && tableBody.children.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem 0;">No upcoming appointments found</td></tr>';
  }
  if (pastTableBody && pastTableBody.children.length === 0) {
    pastTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding: 1.5rem 0;">No past appointments found</td></tr>';
  }
}

function renderPatientPrescriptions() {
  const activeList = document.getElementById('p-prescriptions-active-list');
  const dashList = document.getElementById('p-dashboard-prescriptions');
  const histTable = document.getElementById('p-prescriptions-history-table');

  if (activeList) activeList.innerHTML = '';
  if (dashList) dashList.innerHTML = '';
  if (histTable) histTable.innerHTML = '';

  const patId = patientData ? patientData.id : (currentUser && currentUser.profile ? currentUser.profile.id : "P-10421");
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
          <div style="margin-top:.75rem; display:flex; justify-content:flex-end;">
            <a href="/api/prescriptions/${rx.id}/download" class="btn btn-sm btn-ghost" download style="color:var(--primary-light); display:flex; align-items:center; gap:0.25rem;">
              <span>📥</span> Download Signed PDF
            </a>
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
        const badgeClass = rx.status === 'Completed' ? 'badge-green' : rx.status === 'Expired' ? 'badge-red' : 'badge-gray';
        const formattedDate = new Date(rx.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        tr.innerHTML = `
          <td><div class="font-semibold">${rx.medicineName}</div><div class="text-muted">${rx.doctorName}</div></td>
          <td>${formattedDate}</td>
          <td><span class="badge ${badgeClass}">${rx.status}</span></td>
          <td style="text-align:right;">
            <a href="/api/prescriptions/${rx.id}/download" class="btn btn-sm btn-ghost" download style="color:var(--primary-light); display:inline-flex; align-items:center; gap:0.25rem;">
              <span>📥</span> PDF
            </a>
          </td>
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

  const patId = patientData ? patientData.id : (currentUser && currentUser.profile ? currentUser.profile.id : "P-10421");
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
        <td><button class="btn btn-sm btn-ghost" onclick="window.viewDocument('${rep.id}')">View</button></td>
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
        <td><button class="btn btn-sm btn-ghost" onclick="window.viewDocument('${rep.id}')">View</button></td>
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
      const nameParts = (doc.name || 'Doctor').split(' ');
      const initials = (nameParts.length > 1
        ? nameParts.slice(1).map(n => n[0]).join('')
        : nameParts[0].substring(0, 2) || 'Dr').toUpperCase();

      const availabilityStr = doc.availability || (doc.status === 'Active' ? 'Today' : 'Tomorrow');
      const isOffline = availabilityStr === 'Offline';
      const statusBadge = isOffline ? 'badge-red' : (availabilityStr.includes('Today') || doc.status === 'Active' ? 'badge-green' : 'badge-yellow');
      const statusText = isOffline ? 'Offline' : (doc.status === 'Active' ? 'Available Today' : 'Tomorrow');

      const specialtyStr = doc.specialty || 'General Medicine';
      const borderClass = specialtyStr === 'General Medicine' ? 'avatar-teal' : specialtyStr === 'Cardiology' ? 'avatar-blue' : 'avatar-orange';
      const degreeStr = doc.degree || 'MBBS, MD';
      const expStr = doc.exp || '5 yrs';
      const ratingVal = doc.rating || 5.0;
      const feeVal = doc.fee || '500';

      const resolvedAvatar = getAvatarImage(doc.profileImage, doc.name, doc.gender);
      const avatarStyle = resolvedAvatar
        ? `background-image: url(${resolvedAvatar}); background-size: cover; background-position: center;`
        : '';
      const avatarText = resolvedAvatar ? '' : initials;

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display:flex;gap:1rem;align-items:flex-start;">
          <div class="avatar ${borderClass}" style="width:52px;height:52px;font-size:1rem; ${avatarStyle}">${avatarText}</div>
          <div style="flex:1;">
            <div class="font-semibold">${doc.name || 'Unknown Doctor'}</div>
            <div class="text-muted mb-1">${specialtyStr} · ${expStr} exp.</div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
              <span class="badge badge-teal">${degreeStr}</span>
              <span class="badge ${statusBadge}">${statusText}</span>
              <span>⭐ ${ratingVal}</span>
            </div>
          </div>
        </div>
        <hr class="divider">
        <div class="flex gap-2" style="font-size:.83rem;color:var(--text3);margin-bottom:1rem;">
          <span>📍 ${specialtyStr} Dept</span>
          <span>💰 ₹${feeVal}/consult</span>
        </div>
        <div style="display:flex;gap:.5rem;">
          <button class="btn btn-primary btn-sm" onclick="window.openBookAppointmentModal('${doc.id}')">Book Appointment</button>
          <button class="btn btn-outline btn-sm" onclick="window.viewDoctorProfile('${doc.id}')">View Profile</button>
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

  const doc = doctorsData.find(d => d.id === doctorId);
  if (doc && doc.availability === 'Offline') {
    const warningDiv = document.getElementById('book-appt-offline-warning');
    if (warningDiv) {
      warningDiv.style.display = 'block';
      const otherDocs = doctorsData.filter(d => d.specialty === doc.specialty && d.id !== doc.id && d.availability !== 'Offline' && d.status === 'Active');
      let suggestionsHTML = `⚠️ <strong>${doc.name}</strong> is currently Offline / Unavailable. You cannot book an appointment with them right now.`;
      if (otherDocs.length > 0) {
        suggestionsHTML += `<div style="margin-top: 0.75rem; font-weight: 600; color: #0f172a;">Suggested available doctors in ${doc.specialty}:</div><div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">`;
        otherDocs.forEach(od => {
          suggestionsHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid var(--border); padding: 0.5rem; border-radius: var(--radius-sm);">
              <div>
                <span style="font-weight: 600; color: #0f172a;">${od.name}</span>
                <span style="font-size: 0.75rem; color: #64748b; margin-left: 0.5rem;">Exp: ${od.exp} · Fee: ${od.fee}</span>
              </div>
              <button class="btn btn-sm btn-primary" style="padding: 2px 8px; font-size: 0.75rem;" onclick="window.selectAlternativeDoctor('${od.id}')">Book instead</button>
            </div>
          `;
        });
        suggestionsHTML += `</div>`;
      } else {
        suggestionsHTML += `<br><span style="font-size: 0.8rem; opacity: 0.8;">No other active doctors found in the same specialty department.</span>`;
      }
      warningDiv.innerHTML = suggestionsHTML;
    }
    notify(`${doc.name} is currently offline`, 'error');
    return;
  }

  try {
    // Parse time string (e.g. "10:30 AM" or "14:00") into a proper 24h HH:MM string
    let timeStr = time || '10:00';
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const [timePart, period] = timeStr.trim().split(' ');
      let [h, m] = timePart.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      timeStr = `${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
    }
    const dateTime = date ? `${date}T${timeStr}:00` : new Date().toISOString();

    const res = await fetch(`${API_BASE}/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId,
        patientId: currentUser && currentUser.profile ? currentUser.profile.id : 'P-10421',
        dateTime,
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
    const appt = appointmentsData.find(a => String(a.id) === String(id));
    const docName = appt ? appt.doctorName : 'Doctor';

    const res = await fetch(`${API_BASE}/appointments/cancel/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error('Cancellation failed');

    notify('Appointment cancelled', '');

    if (currentRole === 'patient') {
      await loadPatientData();
      if (document.getElementById('p-appointments-calendar-container').style.display === 'block') {
        window.renderCalendar('p');
      }
    } else if (currentRole === 'doctor') {
      await loadDoctorData();
      if (document.getElementById('d-appointments-calendar-container').style.display === 'block') {
        window.renderCalendar('d');
      }
    } else {
      await loadAdminData();
      if (document.getElementById('a-appointments-calendar-container').style.display === 'block') {
        window.renderCalendar('a');
      }
    }
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
      body: JSON.stringify({ testName, patientId: currentUser && currentUser.profile ? currentUser.profile.id : 'P-10421', lab: 'CityPath Lab' })
    });
    if (!res.ok) throw new Error('Upload failed');
    notify('Report uploaded successfully', 'success');
    await loadPatientData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function downloadRecords() {
  const patId = patientData ? patientData.id : (currentUser && currentUser.profile ? currentUser.profile.id : "P-10421");
  notify('Generating comprehensive medical records PDF...', 'info');
  try {
    const res = await fetch(`${API_BASE}/reports/download-all/${patId}`);
    if (!res.ok) throw new Error('Failed to generate PDF');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health_records_${patId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    notify('All medical records downloaded as PDF', 'success');
  } catch (err) {
    notify(err.message, 'error');
  }
}

function viewDocument(idOrName) {
  const rep = reportsData.find(r => r.id === idOrName) || reportsData.find(r => r.testName === idOrName);
  if (!rep) {
    notify('Lab report not found.', 'error');
    return;
  }

  const titleEl = document.getElementById('viewReportTitle');
  const bodyEl = document.getElementById('viewReportBody');
  if (!titleEl || !bodyEl) return;

  titleEl.textContent = `🧪 Report Details: ${rep.testName}`;

  // Compile panel metrics based on the type of report
  let metricsHTML = '';
  const testNameLower = rep.testName.toLowerCase();

  if (testNameLower.includes('blood count') || testNameLower.includes('cbc') || testNameLower.includes('blood test')) {
    metricsHTML = `
      <div class="flex justify-between py-2 border-b border-[var(--border)]">
        <span class="font-semibold">Hemoglobin</span>
        <span>14.2 g/dL <span class="badge badge-green ml-2" style="font-size:0.7rem;">Normal</span></span>
      </div>
      <div class="flex justify-between py-2 border-b border-[var(--border)]">
        <span class="font-semibold">White Blood Cells (WBC)</span>
        <span>6.5 x10³/µL <span class="badge badge-green ml-2" style="font-size:0.7rem;">Normal</span></span>
      </div>
      <div class="flex justify-between py-2 border-b border-[var(--border)]">
        <span class="font-semibold">Red Blood Cells (RBC)</span>
        <span>4.8 x10⁶/µL <span class="badge badge-green ml-2" style="font-size:0.7rem;">Normal</span></span>
      </div>
      <div class="flex justify-between py-2">
        <span class="font-semibold">Platelets</span>
        <span>250 x10³/µL <span class="badge badge-green ml-2" style="font-size:0.7rem;">Normal</span></span>
      </div>
    `;
  } else if (testNameLower.includes('hba1c')) {
    metricsHTML = `
      <div class="flex justify-between py-2 border-b border-[var(--border)]">
        <span class="font-semibold">Hemoglobin A1c</span>
        <span>${rep.result} <span class="badge ${rep.result.includes('Borderline') || rep.result.includes('High') ? 'badge-yellow' : 'badge-green'} ml-2" style="font-size:0.7rem;">${rep.status}</span></span>
      </div>
      <div class="flex justify-between py-2">
        <span class="font-semibold">Estimated Average Glucose (eAG)</span>
        <span>148 mg/dL <span class="badge badge-yellow ml-2" style="font-size:0.7rem;">Elevated</span></span>
      </div>
    `;
  } else if (testNameLower.includes('lipid') || testNameLower.includes('cholesterol')) {
    metricsHTML = `
      <div class="flex justify-between py-2 border-b border-[var(--border)]">
        <span class="font-semibold">Total Cholesterol</span>
        <span>185 mg/dL <span class="badge badge-green ml-2" style="font-size:0.7rem;">Normal</span></span>
      </div>
      <div class="flex justify-between py-2 border-b border-[var(--border)]">
        <span class="font-semibold">HDL Cholesterol</span>
        <span>52 mg/dL <span class="badge badge-green ml-2" style="font-size:0.7rem;">Normal</span></span>
      </div>
      <div class="flex justify-between py-2 border-b border-[var(--border)]">
        <span class="font-semibold">LDL Cholesterol</span>
        <span>105 mg/dL <span class="badge badge-yellow ml-2" style="font-size:0.7rem;">Borderline</span></span>
      </div>
      <div class="flex justify-between py-2">
        <span class="font-semibold">Triglycerides</span>
        <span>140 mg/dL <span class="badge badge-green ml-2" style="font-size:0.7rem;">Normal</span></span>
      </div>
    `;
  } else if (testNameLower.includes('thyroid') || testNameLower.includes('tsh')) {
    metricsHTML = `
      <div class="flex justify-between py-2 border-b border-[var(--border)]">
        <span class="font-semibold">TSH</span>
        <span>2.1 mIU/L <span class="badge badge-green ml-2" style="font-size:0.7rem;">Normal</span></span>
      </div>
      <div class="flex justify-between py-2">
        <span class="font-semibold">Free T4</span>
        <span>1.2 ng/dL <span class="badge badge-green ml-2" style="font-size:0.7rem;">Normal</span></span>
      </div>
    `;
  } else if (testNameLower.includes('creatinine')) {
    metricsHTML = `
      <div class="flex justify-between py-2 border-b border-[var(--border)]">
        <span class="font-semibold">Serum Creatinine</span>
        <span>1.8 mg/dL <span class="badge badge-red ml-2" style="font-size:0.7rem;">High</span></span>
      </div>
      <div class="flex justify-between py-2">
        <span class="font-semibold">eGFR</span>
        <span>45 mL/min/1.73m² <span class="badge badge-red ml-2" style="font-size:0.7rem;">Decreased</span></span>
      </div>
    `;
  } else if (testNameLower.includes('pulmonary') || testNameLower.includes('lung')) {
    metricsHTML = `
      <div class="flex justify-between py-2 border-b border-[var(--border)]">
        <span class="font-semibold">FEV1</span>
        <span>72% predicted <span class="badge badge-yellow ml-2" style="font-size:0.7rem;">Mild Obstructive</span></span>
      </div>
      <div class="flex justify-between py-2 border-b border-[var(--border)]">
        <span class="font-semibold">FVC</span>
        <span>85% predicted <span class="badge badge-green ml-2" style="font-size:0.7rem;">Normal</span></span>
      </div>
      <div class="flex justify-between py-2">
        <span class="font-semibold">FEV1/FVC Ratio</span>
        <span>68% <span class="badge badge-yellow ml-2" style="font-size:0.7rem;">Mild Obstructive</span></span>
      </div>
    `;
  } else {
    metricsHTML = `
      <div class="flex justify-between py-2">
        <span class="font-semibold">Diagnostic Result</span>
        <span>${rep.result || 'Normal'}</span>
      </div>
    `;
  }

  const badgeClass = rep.status === 'Action Required' ? 'badge-yellow' : 'badge-green';

  let pdfBtnHTML = '';
  if (rep.pdfData) {
    pdfBtnHTML = `
      <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed var(--border); text-align: center;">
        <button class="btn btn-primary" onclick="window.downloadReportPdf('${rep.id}')" style="display: inline-flex; align-items: center; gap: 0.5rem; margin: 0 auto;">
          📄 Download Attached PDF
        </button>
      </div>
    `;
  }

  bodyEl.innerHTML = `
    <div style="font-family: 'DM Sans', sans-serif; padding: 1.5rem; color: var(--text);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; background: var(--bg); padding: 1rem; border-radius: var(--radius); border: 1px solid var(--border);">
        <div>
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text3); font-weight:600; margin-bottom:0.25rem;">Report ID</div>
          <div style="font-weight: 700; color: var(--text);">${rep.id}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text3); font-weight:600; margin-bottom:0.25rem;">Date & Lab</div>
          <div style="font-weight: 600; color: var(--text);">${new Date(rep.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          <div style="font-size: 0.85rem; color: var(--text2);">${rep.lab}</div>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <div style="font-size: 0.9rem; font-weight: 700; color: var(--text); margin-bottom: 0.5rem; border-bottom: 2px solid var(--primary); padding-bottom: 0.25rem; display: inline-block;">Diagnostic Summary</div>
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem;">
          <span style="font-size: 1.1rem; font-weight: 700; color: ${rep.status === 'Action Required' ? '#ef4444' : '#10b981'};">${rep.result}</span>
          <span class="badge ${badgeClass}" style="text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px;">${rep.status}</span>
        </div>
      </div>

      <div>
        <div style="font-size: 0.9rem; font-weight: 700; color: var(--text); margin-bottom: 0.5rem; border-bottom: 2px solid var(--primary); padding-bottom: 0.25rem; display: inline-block;">Test Panel Measurements</div>
        <div style="display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.5rem;">
          ${metricsHTML}
        </div>
      </div>
      ${pdfBtnHTML}
    </div>
  `;

  openModal('viewReportModal');
}

function setFieldError(fieldId, errorMsg) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('is-invalid');

  let errorEl = field.parentNode.querySelector('.invalid-feedback');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'invalid-feedback';
    field.parentNode.appendChild(errorEl);
  }
  errorEl.textContent = errorMsg;
  errorEl.style.display = 'block';
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove('is-invalid');
  const errorEl = field.parentNode.querySelector('.invalid-feedback');
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

function clearAllPatientProfileErrors() {
  const fields = [
    'edit-p-phone',
    'edit-p-dob',
    'edit-p-city',
    'edit-p-emerg-name',
    'edit-p-emerg-relation',
    'edit-p-emerg-phone'
  ];
  fields.forEach(clearFieldError);
}

function openEditProfileModal() {
  if (!patientData) return;
  clearAllPatientProfileErrors();
  document.getElementById('edit-p-phone').value = patientData.phone || '';
  document.getElementById('edit-p-dob').value = patientData.dob || '';
  document.getElementById('edit-p-blood').value = patientData.bloodType || 'O+';
  document.getElementById('edit-p-city').value = patientData.city || '';
  document.getElementById('edit-p-emerg-name').value = patientData.emergencyContact?.name || '';
  document.getElementById('edit-p-emerg-relation').value = patientData.emergencyContact?.relation || '';
  document.getElementById('edit-p-emerg-phone').value = patientData.emergencyContact?.phone || '';
  openModal('editProfileModal');
}

async function submitEditPatientProfile() {
  const phone = document.getElementById('edit-p-phone').value.trim();
  const dob = document.getElementById('edit-p-dob').value;
  const bloodType = document.getElementById('edit-p-blood').value;
  const city = document.getElementById('edit-p-city').value.trim();
  const emergName = document.getElementById('edit-p-emerg-name').value.trim();
  const emergRelation = document.getElementById('edit-p-emerg-relation').value.trim();
  const emergPhone = document.getElementById('edit-p-emerg-phone').value.trim();

  clearAllPatientProfileErrors();

  let isValid = true;
  const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
  const letterRegex = /^[a-zA-Z\s\-\.]+$/;
  const relationRegex = /^[a-zA-Z\s]+$/;

  // Phone Validation
  if (!phone) {
    setFieldError('edit-p-phone', 'Phone number is required');
    isValid = false;
  } else if (!phoneRegex.test(phone)) {
    setFieldError('edit-p-phone', 'Please enter a valid 10-digit phone number');
    isValid = false;
  }

  // DOB Validation
  if (!dob) {
    setFieldError('edit-p-dob', 'Date of birth is required');
    isValid = false;
  } else {
    const dobDate = new Date(dob);
    const today = new Date();
    if (isNaN(dobDate.getTime())) {
      setFieldError('edit-p-dob', 'Please enter a valid date of birth');
      isValid = false;
    } else if (dobDate >= today) {
      setFieldError('edit-p-dob', 'Date of birth must be in the past');
      isValid = false;
    } else {
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120);
      if (dobDate < minDate) {
        setFieldError('edit-p-dob', 'Please enter a valid date of birth');
        isValid = false;
      }
    }
  }

  // City Validation
  if (!city) {
    setFieldError('edit-p-city', 'City is required');
    isValid = false;
  } else if (!letterRegex.test(city)) {
    setFieldError('edit-p-city', 'City name must contain only letters');
    isValid = false;
  }

  // Emergency Contact Name
  if (!emergName) {
    setFieldError('edit-p-emerg-name', 'Emergency contact name is required');
    isValid = false;
  } else if (!letterRegex.test(emergName)) {
    setFieldError('edit-p-emerg-name', 'Name must contain only letters');
    isValid = false;
  }

  // Emergency Contact Relation
  if (!emergRelation) {
    setFieldError('edit-p-emerg-relation', 'Relation is required');
    isValid = false;
  } else if (!relationRegex.test(emergRelation)) {
    setFieldError('edit-p-emerg-relation', 'Relation must contain only letters');
    isValid = false;
  }

  // Emergency Contact Phone
  if (!emergPhone) {
    setFieldError('edit-p-emerg-phone', 'Emergency phone is required');
    isValid = false;
  } else if (!phoneRegex.test(emergPhone)) {
    setFieldError('edit-p-emerg-phone', 'Please enter a valid 10-digit phone number');
    isValid = false;
  } else if (emergPhone === phone) {
    setFieldError('edit-p-emerg-phone', 'Emergency contact phone must be different from your phone number');
    isValid = false;
  }

  if (!isValid) {
    notify('Please correct the errors in the form', 'error');
    return;
  }

  const bodyData = {
    phone,
    dob,
    bloodType,
    city,
    emergencyContact: {
      name: emergName,
      relation: emergRelation,
      phone: emergPhone
    }
  };

  try {
    const patId = currentUser && currentUser.profile ? currentUser.profile.id : 'P-10421';
    const res = await fetch(`${API_BASE}/patients/${patId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });
    if (!res.ok) throw new Error('Profile update failed');
    notify('Profile details updated successfully', 'success');
    closeModal('editProfileModal');
    await loadPatientData();
  } catch (err) {
    notify(err.message, 'error');
  }
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

function updateDoctorProfileUI() {
  const profile = currentUser && currentUser.profile ? currentUser.profile : null;
  if (!profile) return;

  const nameParts = (profile.name || 'Doctor').split(' ');
  const initials = (nameParts.length > 1
    ? nameParts.slice(1).map(n => n[0]).join('')
    : nameParts[0].substring(0, 2) || 'Dr').toUpperCase();

  const avatarEl = document.getElementById('d-profile-avatar-img');
  const nameEl = document.getElementById('d-profile-name');
  const degreeSpecialtyEl = document.getElementById('d-profile-degree-specialty');
  const licenseEl = document.getElementById('d-profile-license');
  const expEl = document.getElementById('d-profile-exp');
  const hospitalEl = document.getElementById('d-profile-hospital');
  const feeEl = document.getElementById('d-profile-fee');
  const availabilityEl = document.getElementById('d-profile-availability');

  const resolvedAvatar = getAvatarImage(profile.profileImage, profile.name, profile.gender);

  if (avatarEl) {
    if (resolvedAvatar) {
      avatarEl.textContent = '';
      avatarEl.style.backgroundImage = `url("${resolvedAvatar}")`;
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.style.backgroundPosition = 'center';
    } else {
      avatarEl.textContent = initials;
      avatarEl.style.backgroundImage = 'none';
    }
  }
  if (nameEl) nameEl.textContent = profile.name || '';
  if (degreeSpecialtyEl) degreeSpecialtyEl.textContent = `${profile.degree || 'MBBS, MD'} – ${profile.specialty || 'General Medicine'}`;
  if (licenseEl) licenseEl.textContent = profile.license || '';
  if (expEl) expEl.textContent = profile.exp || '';
  if (hospitalEl) hospitalEl.textContent = profile.hospital || '';
  if (feeEl) feeEl.textContent = `₹${profile.fee || ''}`.replace('₹₹', '₹');
  if (availabilityEl) availabilityEl.textContent = profile.availability || 'Available Today';

  // Update Topbar Status Toggle Button
  const toggleBtn = document.getElementById('d-availability-toggle');
  if (toggleBtn) {
    const isOffline = profile.availability === 'Offline';
    toggleBtn.textContent = isOffline ? '🔴 Status: Offline' : '🟢 Status: Online';
    if (isOffline) {
      toggleBtn.style.borderColor = '#ef4444';
      toggleBtn.style.color = '#ef4444';
      toggleBtn.style.background = 'rgba(239, 68, 68, 0.05)';
    } else {
      toggleBtn.style.borderColor = '#10b981';
      toggleBtn.style.color = '#10b981';
      toggleBtn.style.background = 'rgba(16, 185, 129, 0.05)';
    }
  }

  // Update sidebar profile card
  const sideName = document.getElementById('d-user-display-name');
  const sideRole = document.getElementById('d-user-display-role');
  const sideAvatar = document.getElementById('d-user-display-avatar');

  if (sideName) sideName.textContent = profile.name || '';
  if (sideRole) sideRole.textContent = profile.specialty || 'General Medicine';
  if (sideAvatar) {
    if (resolvedAvatar) {
      sideAvatar.textContent = '';
      sideAvatar.style.backgroundImage = `url("${resolvedAvatar}")`;
      sideAvatar.style.backgroundSize = 'cover';
      sideAvatar.style.backgroundPosition = 'center';
    } else {
      sideAvatar.textContent = initials;
      sideAvatar.style.backgroundImage = 'none';
    }
  }
}

function openEditDoctorProfileModal() {
  const profile = currentUser && currentUser.profile ? currentUser.profile : null;
  if (!profile) return;

  document.getElementById('edit-d-name').value = profile.name || '';
  document.getElementById('edit-d-specialty').value = profile.specialty || '';
  document.getElementById('edit-d-degree').value = profile.degree || '';
  document.getElementById('edit-d-exp').value = profile.exp || '';
  document.getElementById('edit-d-fee').value = profile.fee || '';
  document.getElementById('edit-d-license').value = profile.license || '';
  document.getElementById('edit-d-hospital').value = profile.hospital || '';
  document.getElementById('edit-d-availability').value = profile.availability || '';

  openModal('editDoctorProfileModal');
}

async function submitEditDoctorProfile() {
  const name = document.getElementById('edit-d-name').value;
  const specialty = document.getElementById('edit-d-specialty').value;
  const degree = document.getElementById('edit-d-degree').value;
  const exp = document.getElementById('edit-d-exp').value;
  const fee = document.getElementById('edit-d-fee').value;
  const license = document.getElementById('edit-d-license').value;
  const hospital = document.getElementById('edit-d-hospital').value;
  const availability = document.getElementById('edit-d-availability').value;

  const bodyData = {
    name,
    specialty,
    degree,
    exp,
    fee,
    license,
    hospital,
    availability
  };

  try {
    const docId = currentUser && currentUser.profile ? currentUser.profile.id : 'D-101';
    const res = await fetch(`${API_BASE}/doctors/${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });
    if (!res.ok) throw new Error('Doctor profile update failed');
    notify('Doctor profile updated successfully', 'success');
    closeModal('editDoctorProfileModal');
    await loadDoctorData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

// ── DOCTOR FLOW APIS ──
async function loadDoctorData() {
  try {
    // 0. Load logged-in doctor's profile details
    const docId = currentUser && currentUser.profile ? currentUser.profile.id : 'D-101';
    const resDoc = await fetch(`${API_BASE}/doctors/${docId}`);
    const docData = await safeJson(resDoc);
    if (docData && !docData.error) {
      currentUser.profile = docData;
      updateDoctorProfileUI();
    }

    // 1. Fetch appointments
    const resAppt = await fetch(`${API_BASE}/appointments`);
    const appts = await safeJson(resAppt);
    if (Array.isArray(appts)) appointmentsData = appts;
    renderDoctorAppointments();

    // 2. Fetch all patients
    const resPat = await fetch(`${API_BASE}/patients`);
    const patientsList = await safeJson(resPat);
    const validPatients = Array.isArray(patientsList) ? patientsList : [];
    patients = validPatients;
    renderDoctorPatients(validPatients);

    // Populate patient select dropdowns in Doctor dashboard
    const notesSelect = document.getElementById('d-notes-patient-select');
    if (notesSelect) {
      notesSelect.innerHTML = validPatients.map(p => `<option value="${p.id}">${p.name} – ${p.id}</option>`).join('');
    }
    const prescSelect = document.getElementById('presc-patient-select');
    if (prescSelect) {
      prescSelect.innerHTML = validPatients.map(p => `<option value="${p.id}">${p.name} – ${p.id}</option>`).join('');
    }
    const reportSelect = document.getElementById('d-upload-report-patient');
    if (reportSelect) {
      reportSelect.innerHTML = validPatients.map(p => `<option value="${p.id}">${p.name} – ${p.id}</option>`).join('');
    }

    // 3. Fetch all prescriptions
    const resRx = await fetch(`${API_BASE}/prescriptions`);
    const rxs = await safeJson(resRx);
    if (Array.isArray(rxs)) prescriptionsData = rxs;
    renderDoctorPrescriptions();

    // 4. Fetch reports
    const resRep = await fetch(`${API_BASE}/reports`);
    const reps = await safeJson(resRep);
    if (Array.isArray(reps)) reportsData = reps;
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

  const docId = currentUser && currentUser.profile ? currentUser.profile.id : 'D-101';
  let myAppts = appointmentsData.filter(a => a.doctorId === docId);

  // Update nav badge count
  const countBadge = document.getElementById('d-badge-appt-count');
  if (countBadge) countBadge.textContent = myAppts.length;

  // Update doctor dashboard stat counters dynamically
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = myAppts.filter(a => a.date === todayStr);
  const todayPatients = new Set(todayAppts.map(a => a.patientId)).size;
  const pendingApptsCount = myAppts.filter(a => a.status === 'Pending').length;
  const activePatientsCount = new Set(myAppts.map(a => a.patientId)).size;
  const ratingVal = (currentUser && currentUser.profile && currentUser.profile.rating) || 5.0;

  const statTodayPatients = document.getElementById('d-stat-today-patients');
  const statPendingAppts = document.getElementById('d-stat-pending-appts');
  const statActivePatients = document.getElementById('d-stat-active-patients');
  const statRating = document.getElementById('d-stat-rating');

  if (statTodayPatients) statTodayPatients.textContent = todayPatients;
  if (statPendingAppts) statPendingAppts.textContent = pendingApptsCount;
  if (statActivePatients) statActivePatients.textContent = activePatientsCount;
  if (statRating) statRating.textContent = ratingVal.toFixed(1);

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
        actionEl = `<button class="btn btn-primary btn-sm" onclick="window.joinVideoRoom('${appt.id}', '${appt.patientName}')">Join</button>`;
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
      let actions = '';
      if (appt.status === 'Pending') {
        actions = `
          <button class="btn btn-sm btn-primary" onclick="window.acceptAppointment('${appt.id}')">Accept</button>
          <button class="btn btn-sm btn-danger" onclick="window.rejectAppointment('${appt.id}')">Reject</button>
        `;
      } else if (appt.status === 'Confirmed') {
        if (appt.type === 'Video') {
          actions += `<button class="btn btn-sm btn-primary" onclick="window.joinVideoRoom('${appt.id}', '${appt.patientName}')">Join Call</button> `;
        }
        actions += `
          <button class="btn btn-sm btn-outline" onclick="window.openRescheduleModal('${appt.id}')">Reschedule</button>
          <button class="btn btn-sm btn-ghost" onclick="window.cancelAppointment('${appt.id}')">Cancel</button>
        `;
      } else if (appt.status === 'Completed') {
        actions = `<button class="btn btn-sm btn-ghost" onclick="window.openPrescriptionModal('${appt.patientId}')">Add Rx</button>`;
      } else {
        actions = '–';
      }

      tr.innerHTML = `
        <td><div class="font-semibold">${appt.patientName}</div><div class="text-muted">${appt.patientId}</div></td>
        <td>${formattedDate}</td>
        <td><span class="badge ${badgeClass}">${appt.type}</span></td>
        <td>${appt.reason}</td>
        <td><span class="badge ${statusClass}">${appt.status}</span></td>
        <td>
          <div style="display:flex;gap:0.5rem;align-items:center;">
            ${actions}
          </div>
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
        <button class="btn btn-primary btn-sm" onclick="window.joinVideoRoom('${appt.id}', '${appt.patientName}')">Join Call</button>
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

    // Find last and next appointment dates
    const myAppts = appointmentsData.filter(a => a.patientId === pat.id);
    const completedAppts = myAppts.filter(a => a.status === 'Completed' || new Date(a.dateTime) < new Date());
    const upcomingAppts = myAppts.filter(a => a.status === 'Confirmed' && new Date(a.dateTime) >= new Date());

    completedAppts.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    upcomingAppts.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    const lastVisit = completedAppts.length > 0
      ? new Date(completedAppts[0].dateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      : 'None';
    const nextVisit = upcomingAppts.length > 0
      ? new Date(upcomingAppts[0].dateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      : 'None';

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
      <td>${pat.age || '38'}</td>
      <td><span class="badge badge-yellow">${pat.chronicConditions || pat.conditions || 'None'}</span></td>
      <td>${lastVisit}</td>
      <td>${nextVisit}</td>
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
      <td style="text-align:right;">
        <a href="/api/prescriptions/${rx.id}/download" class="btn btn-sm btn-ghost" download style="color:var(--primary-light);">
          📥 PDF
        </a>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function renderDoctorReports() {
  const tableBody = document.getElementById('d-reports-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  reportsData.forEach(rep => {
    const pat = patients.find(p => p.id === rep.patientId) || { name: 'Ashad saifi' };
    const badgeClass = rep.result.includes('Normal') ? 'badge-green' : 'badge-yellow';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-semibold">${pat.name}</td>
      <td>${rep.testName}</td>
      <td>${rep.date}</td>
      <td>${rep.lab || 'CityPath Lab'}</td>
      <td><span class="badge ${badgeClass}">${rep.result}</span></td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="window.viewDocument('${rep.id}')">Review</button>
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
  const patientId = document.getElementById('d-notes-patient-select')?.value;
  notify('Consultation notes saved successfully', 'success');
  openPrescriptionModal(patientId);
}

function viewEhrDetails(id) {
  notify(`Accessing patient health records: ${id}`, 'success');
}

function viewDoctorProfile(docId) {
  const doc = doctorsData.find(d => d.id === docId);
  if (!doc) { notify('Doctor profile not found', 'error'); return; }

  const specialtyStr = doc.specialty || 'General Medicine';
  const borderClass = specialtyStr === 'General Medicine' ? 'avatar-teal' : specialtyStr === 'Cardiology' ? 'avatar-blue' : 'avatar-orange';
  const degreeStr = doc.degree || 'MBBS, MD';
  const expStr = doc.exp || '5 yrs';
  const ratingVal = doc.rating || 5.0;
  const feeVal = doc.fee || '500';
  const hospitalStr = doc.hospital || 'City Medical Center';
  const licenseStr = doc.license || 'MCI-PENDING';
  const availabilityStr = doc.availability || 'Available Today';
  const consultationsCount = doc.consultationsCount || 0;

  const nameParts = (doc.name || 'Doctor').split(' ');
  const initials = (nameParts.length > 1
    ? nameParts.slice(1).map(n => n[0]).join('')
    : nameParts[0].substring(0, 2) || 'Dr').toUpperCase();

  const availabilityStrLower = availabilityStr.toLowerCase();
  const statusBadge = availabilityStrLower.includes('today') || doc.status === 'Active' ? 'badge-green' : 'badge-yellow';
  const statusText = availabilityStrLower.includes('today') || doc.status === 'Active' ? 'Available Today' : 'Tomorrow';

  const resolvedAvatar = getAvatarImage(doc.profileImage, doc.name, doc.gender);
  const avatarStyle = resolvedAvatar
    ? `background-image: url(${resolvedAvatar}); background-size: cover; background-position: center;`
    : '';
  const avatarText = resolvedAvatar ? '' : initials;

  const detailsContainer = document.getElementById('doc-profile-details-content');
  if (detailsContainer) {
    detailsContainer.innerHTML = `
      <div style="text-align:center; padding:0.5rem 0 1rem;">
        <div class="avatar ${borderClass}" style="width:72px;height:72px;font-size:1.5rem;margin:0 auto 0.75rem; font-weight:700; display:flex; align-items:center; justify-content:center; ${avatarStyle}">${avatarText}</div>
        <h4 style="font-size:1.3rem; font-weight:700; margin-bottom: 0.25rem; color:var(--text);">${doc.name}</h4>
        <div class="text-muted" style="font-weight: 500; font-size: 0.9rem; margin-bottom: 0.5rem;">${specialtyStr}</div>
        <div style="display: flex; gap: 0.4rem; justify-content: center; align-items: center;">
          <span class="badge badge-teal">${degreeStr}</span>
          <span class="badge ${statusBadge}">${statusText}</span>
          <span style="font-size:0.88rem; font-weight:600; color:var(--text2); display:flex; align-items:center; gap:2px;">⭐ ${ratingVal}</span>
        </div>
      </div>
      <hr class="divider" style="margin: 0.75rem 0 1rem; border-color:var(--border);">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.88rem; color:var(--text2);">
        <div>
          <div style="font-weight:600; color:var(--text3); margin-bottom: 0.2rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Affiliated Hospital</div>
          <div style="font-size:0.92rem; font-weight:500; color:var(--text);">🏢 ${hospitalStr}</div>
        </div>
        <div>
          <div style="font-weight:600; color:var(--text3); margin-bottom: 0.2rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Consultation Fee</div>
          <div style="font-size:0.92rem; font-weight:600; color:var(--primary);">💰 ₹${feeVal} / consult</div>
        </div>
        <div>
          <div style="font-weight:600; color:var(--text3); margin-bottom: 0.2rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Experience</div>
          <div style="font-size:0.92rem; font-weight:500; color:var(--text);">⏱️ ${expStr} of Practice</div>
        </div>
        <div>
          <div style="font-weight:600; color:var(--text3); margin-bottom: 0.2rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">License Number</div>
          <div style="font-size:0.92rem; font-family: monospace; font-weight:500; color:var(--text);">📋 ${licenseStr}</div>
        </div>
        <div>
          <div style="font-weight:600; color:var(--text3); margin-bottom: 0.2rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Availability Schedule</div>
          <div style="font-size:0.92rem; font-weight:500; color:var(--text);">📅 ${availabilityStr}</div>
        </div>
        <div>
          <div style="font-weight:600; color:var(--text3); margin-bottom: 0.2rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Total Consultations</div>
          <div style="font-size:0.92rem; font-weight:500; color:var(--text);">✅ ${consultationsCount} Completed</div>
        </div>
      </div>
      <hr class="divider" style="margin: 1rem 0 1rem; border-color:var(--border);">
      <div>
        <div style="font-weight:600; color:var(--text3); margin-bottom: 0.4rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Clinical Profile & Bio</div>
        <p style="font-size:0.85rem; color:var(--text2); line-height: 1.5; margin: 0;">
          Dr. ${nameParts[nameParts.length - 1]} is a certified specialist in ${specialtyStr} at ${hospitalStr} with over ${expStr} of clinical experience. Dedicated to providing patient-centered care, offering expert consultations, and designing personalized medical treatment plans for optimal health outcomes.
        </p>
      </div>
    `;
  }

  // Setup Book Appointment button trigger
  const bookBtn = document.getElementById('btn-doc-profile-book');
  if (bookBtn) {
    // Clear old event listener to prevent duplicate triggers
    const newBookBtn = bookBtn.cloneNode(true);
    bookBtn.parentNode.replaceChild(newBookBtn, bookBtn);
    newBookBtn.addEventListener('click', () => {
      closeModal('viewDocProfileModal');
      openBookAppointmentModal(docId);
    });
  }

  openModal('viewDocProfileModal');
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
    const data = await safeJson(res);
    if (!data) throw new Error('Admin logs endpoint unavailable');

    // Update stats counters
    const sideName = document.getElementById('a-user-display-name');
    const sideAvatar = document.getElementById('a-user-display-avatar');
    if (currentUser) {
      if (sideName) sideName.textContent = currentUser.name || 'Admin';
      if (sideAvatar) {
        const nameParts = (currentUser.name || 'Admin').split(' ');
        const initials = (nameParts.length > 1
          ? nameParts.slice(0, 2).map(n => n[0]).join('')
          : nameParts[0].substring(0, 2)).toUpperCase();
        sideAvatar.textContent = initials;
      }
    }

    const statPat = document.getElementById('a-stat-patients');
    const statDoc = document.getElementById('a-stat-doctors');
    if (statPat && data.stats) statPat.textContent = data.stats.totalPatients.toLocaleString();
    if (statDoc && data.stats) statDoc.textContent = data.stats.activeDoctors.toLocaleString();

    // Render logs
    if (Array.isArray(data.logs)) renderAdminLogs(data.logs);

    // Fetch users for list
    const resUsers = await fetch(`${API_BASE}/patients`);
    const patientsList = await safeJson(resUsers);
    const validPatients = Array.isArray(patientsList) ? patientsList : [];
    patients = validPatients;

    const resDocs = await fetch(`${API_BASE}/doctors`);
    const docsList = await safeJson(resDocs);
    const validDocs = Array.isArray(docsList) ? docsList : [];
    doctorsData = validDocs;

    renderAdminUsersList(validPatients, validDocs);
    renderAdminDoctorsTable(validDocs);

    // Fetch appointments for admin list
    const resAppt = await fetch(`${API_BASE}/appointments`);
    const appts = await safeJson(resAppt);
    if (Array.isArray(appts)) appointmentsData = appts;
    renderAdminAppointments();

    // Render reports & analytics
    renderAdminReports();

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

function renderAdminReports() {
  const statsContainer = document.getElementById('a-reports-stats');
  const doctorsContainer = document.getElementById('a-reports-top-doctors');

  if (statsContainer) {
    const totalAppointments = appointmentsData.length;
    let totalRevenue = 0;
    appointmentsData.forEach(appt => {
      const doc = doctorsData.find(d => d.id === appt.doctorId || d.name === appt.doctorName);
      if (doc && doc.fee) {
        const feeVal = parseInt(doc.fee.replace(/[^\d]/g, '')) || 0;
        totalRevenue += feeVal;
      } else {
        totalRevenue += 500;
      }
    });

    const formattedRevenue = '₹' + totalRevenue.toLocaleString('en-IN');

    statsContainer.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
        <span style="font-weight:500;color:#64748b;">Total Consultations</span>
        <span style="font-weight:600;font-size:1.1rem;color:#0f172a;">${totalAppointments} Calls</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-top:0.75rem;">
        <span style="font-weight:500;color:#64748b;">Estimated Revenue</span>
        <span style="font-weight:600;font-size:1.1rem;color:#10b981;">${formattedRevenue}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-top:0.75rem;">
        <span style="font-weight:500;color:#64748b;">Avg. Consultation Rating</span>
        <span style="font-weight:600;font-size:1.1rem;color:#eab308;">★ 4.85 / 5.0</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-top:0.75rem;">
        <span style="font-weight:500;color:#64748b;">Completion Rate</span>
        <span style="font-weight:600;font-size:1.1rem;color:#3b82f6;">94.2%</span>
      </div>
    `;
  }

  if (doctorsContainer) {
    const topDoctors = [...doctorsData]
      .sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return (b.consultationsCount || 0) - (a.consultationsCount || 0);
      })
      .slice(0, 4);

    doctorsContainer.innerHTML = topDoctors.map(doc => {
      const initials = doc.name.split(' ').slice(1).map(n => n[0]).join('');
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:0.75rem;">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div class="avatar avatar-blue" style="width:36px;height:36px;font-size:0.75rem;">${initials}</div>
            <div>
              <div style="font-weight:600;color:#1e293b;">${doc.name}</div>
              <div style="font-size:0.75rem;color:#64748b;">${doc.specialty} · ${doc.hospital || 'MedXpert Clinic'}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:600;color:#eab308;font-size:0.9rem;">★ ${doc.rating}</div>
            <div style="font-size:0.7rem;color:#94a3b8;">${doc.consultationsCount || 0} consults</div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function renderAdminUsersList(patientsList, docsList) {
  const tableBody = document.getElementById('a-users-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  // Render patients
  patientsList.forEach(pat => {
    const initials = pat.name.split(' ').map(n => n[0]).join('');
    const tr = document.createElement('tr');
    const ageGender = (pat.age ? `${pat.age}y` : '') + (pat.gender ? ` · ${pat.gender}` : '');
    const phoneVal = pat.phone || '–';
    tr.innerHTML = `
      <td>
        <div class="flex items-center gap-2">
          <div class="avatar avatar-teal" style="width:34px;height:34px;font-size:.75rem;">${initials}</div>
          <div>
            <div class="font-semibold text-slate-800">${pat.name}</div>
            <div style="font-size:0.72rem;color:#64748b;">ID: ${pat.id}${ageGender ? ` · ${ageGender}` : ''}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-teal">Patient</span></td>
      <td>
        <div>${pat.email}</div>
        <div style="font-size:0.72rem;color:#94a3b8;">${phoneVal}</div>
      </td>
      <td>${pat.city || 'Delhi, IN'}</td>
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
    const initials = doc.name.split(' ').slice(1).map(n => n[0]).join('') || doc.name.substring(0, 2).toUpperCase();
    const tr = document.createElement('tr');
    const actionCell = doc.status === 'Pending'
      ? `<button class="btn btn-sm btn-primary" onclick="window.approveDoctor('${doc.id}')">Approve</button>
         <button class="btn btn-sm btn-danger" onclick="window.rejectDoctor('${doc.id}')">Reject</button>`
      : `<button class="btn btn-sm btn-ghost" onclick="window.editUser('${doc.id}')">Edit</button>
         <button class="btn btn-sm btn-danger" onclick="window.suspendUser('${doc.id}')">Suspend</button>`;

    tr.innerHTML = `
      <td>
        <div class="flex items-center gap-2">
          <div class="avatar avatar-blue" style="width:34px;height:34px;font-size:.75rem;">${initials}</div>
          <div>
            <div class="font-semibold text-slate-800">${doc.name}</div>
            <div style="font-size:0.72rem;color:#64748b;">ID: ${doc.id} · ${doc.specialty}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-blue">Doctor</span></td>
      <td>
        <div>${doc.email}</div>
        <div style="font-size:0.72rem;color:#94a3b8;">${doc.phone || '–'}</div>
      </td>
      <td>${doc.hospital || 'City Medical Center'}</td>
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
    const degreeVal = doc.degree || 'MBBS, MD';
    const consultationsVal = doc.consultationsCount || 0;
    tr.innerHTML = `
      <td><div class="font-semibold">${doc.name}</div><div class="text-muted">${degreeVal}</div></td>
      <td>${doc.specialty}</td>
      <td>${doc.status === 'Active' ? '147' : '0'}</td>
      <td>${consultationsVal}</td>
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
  if (!confirm('Are you sure you want to remove this user account?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/users/suspend/${id}`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Removal failed');
    }
    notify('User account removed from server successfully', 'success');
    await loadAdminData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

function editUser(id) {
  const isPatient = id.startsWith("P-");
  const isDoctor = id.startsWith("D-");

  let userObj = null;
  if (isPatient) {
    userObj = patients.find(p => p.id === id);
  } else if (isDoctor) {
    userObj = doctorsData.find(d => d.id === id);
  }

  if (!userObj) {
    notify('User details not found', 'error');
    return;
  }

  // Populate modal
  document.getElementById('editUser-id').value = id;
  document.getElementById('editUser-name').value = userObj.name || '';
  document.getElementById('editUser-email').value = userObj.email || '';
  document.getElementById('editUser-phone').value = userObj.phone || '';

  const patientFields = document.getElementById('editUser-patient-fields');
  const doctorFields = document.getElementById('editUser-doctor-fields');

  if (isPatient) {
    if (patientFields) patientFields.style.display = 'block';
    if (doctorFields) doctorFields.style.display = 'none';

    document.getElementById('editUser-patient-age').value = userObj.age || '';
    document.getElementById('editUser-patient-blood').value = userObj.bloodType || 'O+';
    document.getElementById('editUser-patient-conditions').value = userObj.conditions || userObj.chronicConditions || '';
  } else if (isDoctor) {
    if (patientFields) patientFields.style.display = 'none';
    if (doctorFields) doctorFields.style.display = 'block';

    document.getElementById('editUser-doctor-specialty').value = userObj.specialty || '';
    document.getElementById('editUser-doctor-exp').value = userObj.exp || '';
    document.getElementById('editUser-doctor-fee').value = userObj.fee || '';
    document.getElementById('editUser-doctor-hospital').value = userObj.hospital || '';
  }

  openModal('adminEditUserModal');
}

async function submitEditUserAdmin() {
  const id = document.getElementById('editUser-id').value;
  const name = document.getElementById('editUser-name').value.trim();
  const email = document.getElementById('editUser-email').value.trim();
  const phone = document.getElementById('editUser-phone').value.trim();

  const isPatient = id.startsWith("P-");
  const isDoctor = id.startsWith("D-");

  clearAllEditUserErrors();

  let isValid = true;
  const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
  const letterRegex = /^[a-zA-Z\s\-\.]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Basic validations
  if (!name) {
    setFieldError('editUser-name', 'Full name is required');
    isValid = false;
  } else if (!letterRegex.test(name)) {
    setFieldError('editUser-name', 'Name must contain only letters');
    isValid = false;
  }

  if (!email) {
    setFieldError('editUser-email', 'Email address is required');
    isValid = false;
  } else if (!emailRegex.test(email)) {
    setFieldError('editUser-email', 'Please enter a valid email address');
    isValid = false;
  }

  if (!phone) {
    setFieldError('editUser-phone', 'Phone number is required');
    isValid = false;
  } else if (!phoneRegex.test(phone)) {
    setFieldError('editUser-phone', 'Please enter a valid 10-digit phone number');
    isValid = false;
  }

  const bodyData = { name, email, phone };

  if (isPatient) {
    const age = document.getElementById('editUser-patient-age').value.trim();
    const bloodType = document.getElementById('editUser-patient-blood').value;
    const conditions = document.getElementById('editUser-patient-conditions').value.trim();

    if (!age) {
      setFieldError('editUser-patient-age', 'Age is required');
      isValid = false;
    } else {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
        setFieldError('editUser-patient-age', 'Please enter a valid age (0-120)');
        isValid = false;
      }
    }

    bodyData.age = age;
    bodyData.bloodType = bloodType;
    bodyData.conditions = conditions;
  } else if (isDoctor) {
    const specialty = document.getElementById('editUser-doctor-specialty').value.trim();
    const exp = document.getElementById('editUser-doctor-exp').value.trim();
    const fee = document.getElementById('editUser-doctor-fee').value.trim();
    const hospital = document.getElementById('editUser-doctor-hospital').value.trim();

    if (!specialty) {
      setFieldError('editUser-doctor-specialty', 'Specialty is required');
      isValid = false;
    } else if (!letterRegex.test(specialty)) {
      setFieldError('editUser-doctor-specialty', 'Specialty must contain only letters');
      isValid = false;
    }

    if (!exp) {
      setFieldError('editUser-doctor-exp', 'Experience is required');
      isValid = false;
    }

    if (!fee) {
      setFieldError('editUser-doctor-fee', 'Consultation fee is required');
      isValid = false;
    }

    if (!hospital) {
      setFieldError('editUser-doctor-hospital', 'Hospital name is required');
      isValid = false;
    }

    bodyData.specialty = specialty;
    bodyData.exp = exp;
    bodyData.fee = fee;
    bodyData.hospital = hospital;
  }

  if (!isValid) {
    notify('Please correct the errors in the form', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/users/edit/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to update user');
    }

    closeModal('adminEditUserModal');
    notify('User account updated successfully', 'success');
    await loadAdminData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

function toggleAddUserRoleFields(role) {
  const patientFields = document.getElementById('addUser-patient-fields');
  const doctorFields = document.getElementById('addUser-doctor-fields');
  if (patientFields && doctorFields) {
    if (role === 'Patient') {
      patientFields.style.display = 'block';
      doctorFields.style.display = 'none';
    } else if (role === 'Doctor') {
      patientFields.style.display = 'none';
      doctorFields.style.display = 'block';
    } else {
      patientFields.style.display = 'none';
      patientFields.style.display = 'none';
    }
  }
}
window.toggleAddUserRoleFields = toggleAddUserRoleFields;

async function submitAddUser() {
  const firstName = document.getElementById('addUser-first').value.trim();
  const lastName = document.getElementById('addUser-last').value.trim();
  const email = document.getElementById('addUser-email').value.trim();
  const role = document.getElementById('addUser-role').value;
  const phone = document.getElementById('addUser-phone').value.trim();

  // Retrieve patient fields
  const age = document.getElementById('addUser-patient-age').value.trim();
  const bloodType = document.getElementById('addUser-patient-blood').value;
  const chronicConditions = document.getElementById('addUser-patient-conditions').value.trim();

  // Retrieve doctor fields
  const specialty = document.getElementById('addUser-doctor-specialty').value.trim();
  const exp = document.getElementById('addUser-doctor-exp').value.trim();
  const fee = document.getElementById('addUser-doctor-fee').value.trim();
  const hospital = document.getElementById('addUser-doctor-hospital').value.trim();

  clearAllAddUserErrors();

  let isValid = true;
  const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
  const letterRegex = /^[a-zA-Z\s\-\.]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Basic validations
  if (!firstName) {
    setFieldError('addUser-first', 'First name is required');
    isValid = false;
  } else if (!letterRegex.test(firstName)) {
    setFieldError('addUser-first', 'First name must contain only letters');
    isValid = false;
  }

  if (!lastName) {
    setFieldError('addUser-last', 'Last name is required');
    isValid = false;
  } else if (!letterRegex.test(lastName)) {
    setFieldError('addUser-last', 'Last name must contain only letters');
    isValid = false;
  }

  if (!email) {
    setFieldError('addUser-email', 'Email address is required');
    isValid = false;
  } else if (!emailRegex.test(email)) {
    setFieldError('addUser-email', 'Please enter a valid email address');
    isValid = false;
  }

  if (!phone) {
    setFieldError('addUser-phone', 'Phone number is required');
    isValid = false;
  } else if (!phoneRegex.test(phone)) {
    setFieldError('addUser-phone', 'Please enter a valid 10-digit phone number');
    isValid = false;
  }

  const bodyData = { firstName, lastName, email, role, phone };

  if (role === 'Patient') {
    if (!age) {
      setFieldError('addUser-patient-age', 'Age is required');
      isValid = false;
    } else {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
        setFieldError('addUser-patient-age', 'Please enter a valid age (0-120)');
        isValid = false;
      }
    }
    bodyData.age = age;
    bodyData.bloodType = bloodType;
    bodyData.chronicConditions = chronicConditions;
  } else if (role === 'Doctor') {
    if (!specialty) {
      setFieldError('addUser-doctor-specialty', 'Specialty is required');
      isValid = false;
    } else if (!letterRegex.test(specialty)) {
      setFieldError('addUser-doctor-specialty', 'Specialty must contain only letters');
      isValid = false;
    }

    if (!exp) {
      setFieldError('addUser-doctor-exp', 'Experience is required');
      isValid = false;
    }

    if (!fee) {
      setFieldError('addUser-doctor-fee', 'Consultation fee is required');
      isValid = false;
    }

    if (!hospital) {
      setFieldError('addUser-doctor-hospital', 'Hospital name is required');
      isValid = false;
    }

    bodyData.specialty = specialty;
    bodyData.exp = exp;
    bodyData.fee = fee;
    bodyData.hospital = hospital;
  }

  if (!isValid) {
    notify('Please correct the errors in the form', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/users/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Add user failed');
    }

    closeModal('addUserModal');
    notify('User added successfully!', 'success');

    // Clear form
    document.getElementById('addUser-first').value = '';
    document.getElementById('addUser-last').value = '';
    document.getElementById('addUser-email').value = '';
    document.getElementById('addUser-phone').value = '';
    document.getElementById('addUser-patient-age').value = '30';
    document.getElementById('addUser-patient-blood').value = 'O+';
    document.getElementById('addUser-patient-conditions').value = 'None';
    document.getElementById('addUser-doctor-specialty').value = 'General Medicine';
    document.getElementById('addUser-doctor-exp').value = '5 yrs';
    document.getElementById('addUser-doctor-fee').value = '₹500';
    document.getElementById('addUser-doctor-hospital').value = 'City Medical Center';

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

async function joinVideoRoom(appointmentId, partnerName) {
  // Normalize parameters if only one argument is provided
  if (!partnerName && appointmentId) {
    if (appointmentId.startsWith('A-') || appointmentId.startsWith('room-') || appointmentId.startsWith('apt-')) {
      const appt = appointmentsData.find(a => a.id === appointmentId);
      partnerName = currentRole === 'doctor' ? (appt?.patientName || 'Patient') : (appt?.doctorName || 'Doctor');
    } else {
      partnerName = appointmentId;
      appointmentId = null;
    }
  }

  // Resolve appointmentId if not passed
  if (!appointmentId) {
    const myProfileId = currentUser?.profile?.id;
    const activeAppt = appointmentsData.find(a =>
      a.status === 'Confirmed' &&
      a.type === 'Video' &&
      (a.patientId === myProfileId || a.doctorId === myProfileId || (partnerName && (a.doctorName.includes(partnerName) || a.patientName.includes(partnerName))))
    );
    if (activeAppt) {
      appointmentId = activeAppt.id;
      if (!partnerName) {
        partnerName = currentRole === 'doctor' ? activeAppt.patientName : activeAppt.doctorName;
      }
    } else {
      appointmentId = 'A-501'; // Default consultation room
      if (!partnerName) {
        partnerName = currentRole === 'doctor' ? 'Patient' : 'Doctor';
      }
    }
  }

  const userId = getCurrentUserId();

  // Client-side scheduled time check for patient to prevent calling before appointment time
  if (currentRole === 'patient') {
    const matchedAppt = appointmentsData.find(a => a.id === appointmentId);
    if (matchedAppt) {
      let scheduledDate = null;
      if (matchedAppt.dateTime) {
        scheduledDate = new Date(matchedAppt.dateTime);
      } else if (matchedAppt.date && matchedAppt.time) {
        scheduledDate = new Date(`${matchedAppt.date} ${matchedAppt.time}`);
      }

      if (scheduledDate && !isNaN(scheduledDate.getTime())) {
        const diffMinutes = (scheduledDate.getTime() - Date.now()) / (1000 * 60);
        if (diffMinutes > 15) {
          // Check if doctor has already initiated room via API
          try {
            const res = await fetch(`${API_BASE}/appointments/verify-room`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ appointmentId, userId, role: currentRole })
            });
            const vData = await res.json();
            if (!res.ok) {
              const formattedTime = scheduledDate.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
              notify(`⏰ Consultation not open yet! Your appointment with ${partnerName || matchedAppt.doctorName} is scheduled for ${formattedTime}. Patients cannot start the call before scheduled time. Please wait for your slot or wait for the doctor to initiate the call.`, 'warning');
              return;
            }
          } catch (vErr) {
            console.warn("Slot verification check error:", vErr);
          }
        }
      }
    }
  }

  // Call the Backend verification slot lock
  try {
    const res = await fetch(`${API_BASE}/appointments/verify-room`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, userId, role: currentRole })
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Consultation room is locked: slot not active yet.', 'error');
      return;
    }
    notify(data.message || 'Consultation session verified', 'success');
  } catch (err) {
    console.error("Verification failed:", err);
    if (currentRole === 'patient') {
      notify("Could not verify consultation slot. Please wait for doctor to call.", "warning");
      return;
    }
  }

  // Verification succeeded! Now open the video consultation room
  openVideoCall(partnerName, appointmentId);
}

async function toggleDoctorOnlineStatus() {
  const profile = currentUser && currentUser.profile ? currentUser.profile : null;
  if (!profile) return;

  const currentAvailability = profile.availability || 'Available Today';
  const newAvailability = currentAvailability === 'Offline' ? 'Available Today' : 'Offline';

  try {
    const res = await fetch(`${API_BASE}/doctors/${profile.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability: newAvailability })
    });

    if (!res.ok) throw new Error('Failed to update status');

    const data = await safeJson(res);
    if (data && data.doctor) {
      currentUser.profile = data.doctor;
      updateDoctorProfileUI();
      notify(`Status updated to: ${newAvailability === 'Offline' ? 'Offline' : 'Online'}`, 'success');
    }
  } catch (err) {
    notify(err.message, 'error');
  }
}

function openDoctorUploadReportModal() {
  openModal('doctorUploadReportModal');
}

async function submitDoctorUploadReport() {
  const patientId = document.getElementById('d-upload-report-patient').value;
  const testName = document.getElementById('d-upload-report-name').value;
  const lab = document.getElementById('d-upload-report-lab').value;
  const result = document.getElementById('d-upload-report-result').value;
  const status = document.getElementById('d-upload-report-status').value;
  const fileInput = document.getElementById('d-upload-report-file');

  if (!testName) {
    notify('Please enter a test name', 'error');
    return;
  }

  const upload = async (pdfData = "", pdfName = "") => {
    try {
      const res = await fetch(`${API_BASE}/reports/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, testName, lab, result, status, pdfData, pdfName })
      });

      if (!res.ok) throw new Error('Upload failed');

      closeModal('doctorUploadReportModal');
      notify('Report uploaded successfully', 'success');

      // Reset inputs
      document.getElementById('d-upload-report-name').value = '';
      document.getElementById('d-upload-report-result').value = '';
      if (fileInput) fileInput.value = '';

      await loadDoctorData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async function () {
      await upload(reader.result, file.name);
    };
    reader.readAsDataURL(file);
  } else {
    await upload();
  }
}

window.selectAlternativeDoctor = function (id) {
  const select = document.getElementById('book-appt-doctor-select');
  if (select) {
    select.value = id;
    const warningDiv = document.getElementById('book-appt-offline-warning');
    if (warningDiv) {
      warningDiv.style.display = 'none';
      warningDiv.innerHTML = '';
    }
    window.loadAvailableBookingSlots();
  }
};

window.downloadReportPdf = function (id) {
  const rep = reportsData.find(r => r.id === id);
  if (!rep || !rep.pdfData) return;
  const link = document.createElement('a');
  link.href = rep.pdfData;
  link.download = rep.pdfName || `${rep.testName}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// ── GLOBAL EXPOSURES FOR ONCLICK HANDLERS ──
window.joinVideoRoom = joinVideoRoom;
window.cancelAppointment = cancelAppointment;
window.viewDocument = viewDocument;
window.openBookAppointmentModal = openBookAppointmentModal;
window.viewEhrDetails = viewEhrDetails;
window.openPrescriptionModal = openPrescriptionModal;
window.approveDoctor = approveDoctor;
window.rejectDoctor = rejectDoctor;
window.suspendUser = suspendUser;
window.editUser = editUser;
window.submitEditUserAdmin = submitEditUserAdmin;
window.switchCallTab = switchCallTab;
window.sendReaction = sendReaction;
window.viewDoctorProfile = viewDoctorProfile;
function startMeetClock() {
  const clockEl = document.getElementById('meetClock');
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hrs}:${mins}`;
  };

  updateClock();
  setInterval(updateClock, 30000); // update clock every 30 seconds
}

// ── PATIENT PORTAL UTILITY FUNCTIONS ──
function openSearchModal() {
  const input = document.getElementById('global-search-input');
  if (input) {
    input.value = '';
  }
  const results = document.getElementById('global-search-results');
  if (results) {
    results.innerHTML = '<div class="text-muted text-center" style="padding: 2rem 0; text-align: center; color: var(--text3);">Type to search doctors, appointments, prescriptions...</div>';
  }
  openModal('pSearchModal');
  setTimeout(() => input?.focus(), 100);
}

async function openNotificationsModal() {
  renderNotificationsList();
  openModal('pNotifModal');

  // Mark all notifications as read in database
  const patId = patientData ? patientData.id : (currentUser && currentUser.profile ? currentUser.profile.id : null);
  if (patId) {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all?userId=${patId}`, {
        method: 'PUT'
      });
      if (res.ok) {
        notificationsData.forEach(n => n.read = true);
        updateNotificationsBadge();
      }
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  }
}

async function clearNotifications() {
  const patId = patientData ? patientData.id : (currentUser && currentUser.profile ? currentUser.profile.id : null);
  if (patId) {
    try {
      const res = await fetch(`${API_BASE}/notifications/clear?userId=${patId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        notificationsData = [];
        updateNotificationsBadge();
        renderNotificationsList();
        notify('Notifications cleared successfully', 'success');
      }
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  } else {
    notificationsData = [];
    updateNotificationsBadge();
    renderNotificationsList();
  }
}

function updateNotificationsBadge() {
  const badge = document.getElementById('p-notif-badge');
  if (badge) {
    const unreadCount = notificationsData.filter(n => !n.read).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}

function renderNotificationsList() {
  const container = document.getElementById('notifications-list');
  if (!container) return;
  container.innerHTML = '';

  if (notificationsData.length === 0) {
    container.innerHTML = '<div class="text-muted text-center" style="padding: 2rem 0; text-align: center; color: var(--text3);">No notifications</div>';
    return;
  }

  notificationsData.forEach(notif => {
    const div = document.createElement('div');
    div.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
    div.style.cssText = `
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      background: ${notif.read ? 'var(--surface2)' : 'rgba(14, 165, 233, 0.15)'};
      border-left: 3px solid ${notif.read ? 'transparent' : 'var(--primary-light)'};
      cursor: ${notif.page ? 'pointer' : 'default'};
      margin-bottom: 0.5rem;
      transition: all 0.2s;
    `;

    div.innerHTML = `
      <div style="font-size: 0.88rem; font-weight: ${notif.read ? 'normal' : '500'}; color: var(--text);">
        ${notif.text}
      </div>
      <div style="font-size: 0.75rem; color: var(--text3); margin-top: 0.25rem;">
        ${notif.time}
      </div>
    `;

    if (notif.page) {
      div.addEventListener('click', () => {
        notif.read = true;
        updateNotificationsBadge();
        closeModal('pNotifModal');
        showPage('p', notif.page, document.querySelector(`#patient-nav [data-page="${notif.page}"]`));
      });
    } else {
      div.addEventListener('click', () => {
        notif.read = true;
        updateNotificationsBadge();
        renderNotificationsList();
      });
    }

    container.appendChild(div);
  });
}

function handleGlobalSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  const resultsContainer = document.getElementById('global-search-results');
  if (!resultsContainer) return;

  if (!query) {
    resultsContainer.innerHTML = '<div class="text-muted text-center" style="padding: 2rem 0; text-align: center; color: var(--text3);">Type to search...</div>';
    return;
  }

  const patId = patientData ? patientData.id : 'P-10421';

  const matchedDocs = doctorsData.filter(d =>
    d.name.toLowerCase().includes(query) ||
    (d.specialty && d.specialty.toLowerCase().includes(query)) ||
    (d.hospital && d.hospital.toLowerCase().includes(query))
  );

  const matchedAppts = appointmentsData.filter(a =>
    a.patientId === patId &&
    (a.doctorName.toLowerCase().includes(query) ||
      a.reason.toLowerCase().includes(query) ||
      a.status.toLowerCase().includes(query))
  );

  const matchedRx = prescriptionsData.filter(r =>
    r.patientId === patId &&
    (r.medicineName.toLowerCase().includes(query) ||
      r.doctorName.toLowerCase().includes(query) ||
      r.status.toLowerCase().includes(query))
  );

  const matchedReports = reportsData.filter(rep =>
    rep.patientId === patId &&
    (rep.testName.toLowerCase().includes(query) ||
      rep.lab.toLowerCase().includes(query) ||
      rep.status.toLowerCase().includes(query))
  );

  const totalMatches = matchedDocs.length + matchedAppts.length + matchedRx.length + matchedReports.length;

  if (totalMatches === 0) {
    resultsContainer.innerHTML = '<div class="text-muted text-center" style="padding: 2rem 0; text-align: center; color: var(--text3);">No matching results found</div>';
    return;
  }

  resultsContainer.innerHTML = '';

  // Doctors
  if (matchedDocs.length > 0) {
    const category = document.createElement('div');
    category.style.cssText = 'padding: 0.5rem 1rem; background: var(--surface2); font-weight: bold; font-size: 0.8rem; text-transform: uppercase; color: var(--primary-light); margin-top: 0.5rem; border-radius: var(--radius-sm);';
    category.textContent = 'Doctors';
    resultsContainer.appendChild(category);

    matchedDocs.forEach(doc => {
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);';
      item.innerHTML = `
        <div>
          <div class="font-semibold" style="color: var(--text);">${doc.name}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${doc.specialty} • ${doc.hospital}</div>
        </div>
        <button class="btn btn-sm btn-primary" onclick="closeModal('pSearchModal'); window.openBookAppointmentModal('${doc.id}')">Book</button>
      `;
      resultsContainer.appendChild(item);
    });
  }

  // Appointments
  if (matchedAppts.length > 0) {
    const category = document.createElement('div');
    category.style.cssText = 'padding: 0.5rem 1rem; background: var(--surface2); font-weight: bold; font-size: 0.8rem; text-transform: uppercase; color: var(--primary-light); margin-top: 0.5rem; border-radius: var(--radius-sm);';
    category.textContent = 'Appointments';
    resultsContainer.appendChild(category);

    matchedAppts.forEach(appt => {
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);';
      const formattedDate = new Date(appt.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      item.innerHTML = `
        <div>
          <div class="font-semibold" style="color: var(--text);">${appt.doctorName}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${formattedDate} • ${appt.reason} (${appt.type})</div>
        </div>
        <span class="badge ${appt.status === 'Confirmed' ? 'badge-green' : appt.status === 'Cancelled' ? 'badge-red' : 'badge-gray'}">${appt.status}</span>
      `;
      resultsContainer.appendChild(item);
    });
  }

  // Prescriptions
  if (matchedRx.length > 0) {
    const category = document.createElement('div');
    category.style.cssText = 'padding: 0.5rem 1rem; background: var(--surface2); font-weight: bold; font-size: 0.8rem; text-transform: uppercase; color: var(--primary-light); margin-top: 0.5rem; border-radius: var(--radius-sm);';
    category.textContent = 'Prescriptions';
    resultsContainer.appendChild(category);

    matchedRx.forEach(rx => {
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);';
      item.innerHTML = `
        <div>
          <div class="font-semibold" style="color: var(--text);">${rx.medicineName}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${rx.dosage} • By ${rx.doctorName}</div>
        </div>
        <span class="badge ${rx.status === 'Active' ? 'badge-green' : 'badge-yellow'}">${rx.status}</span>
      `;
      resultsContainer.appendChild(item);
    });
  }

  // Lab Reports
  if (matchedReports.length > 0) {
    const category = document.createElement('div');
    category.style.cssText = 'padding: 0.5rem 1rem; background: var(--surface2); font-weight: bold; font-size: 0.8rem; text-transform: uppercase; color: var(--primary-light); margin-top: 0.5rem; border-radius: var(--radius-sm);';
    category.textContent = 'Lab Reports';
    resultsContainer.appendChild(category);

    matchedReports.forEach(rep => {
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);';
      item.innerHTML = `
        <div>
          <div class="font-semibold" style="color: var(--text);">${rep.testName}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${rep.date} • ${rep.lab}</div>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="closeModal('pSearchModal'); window.viewDocument('${rep.id}')">View</button>
      `;
      resultsContainer.appendChild(item);
    });
  }
}

// Global Exposures
window.openSearchModal = openSearchModal;
window.openNotificationsModal = openNotificationsModal;
window.closeModal = closeModal;
window.openModal = openModal;

// ── CALENDAR & SLOTS CLIENT LOGIC ──
let currentCalendarMonth = new Date().getMonth(); // 0-11
let currentCalendarYear = new Date().getFullYear();
let activeCalendarDay = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

window.switchAppointmentView = function (prefix, view) {
  const tableBtn = document.getElementById(`btn-${prefix}-view-table`);
  const calendarBtn = document.getElementById(`btn-${prefix}-view-calendar`);
  const tableContainer = document.getElementById(`${prefix}-appointments-table-container`);
  const calendarContainer = document.getElementById(`${prefix}-appointments-calendar-container`);

  if (view === 'table') {
    tableBtn?.classList.add('active');
    calendarBtn?.classList.remove('active');
    if (tableContainer) tableContainer.style.display = 'block';
    if (calendarContainer) calendarContainer.style.display = 'none';
  } else {
    calendarBtn?.classList.add('active');
    tableBtn?.classList.remove('active');
    if (tableContainer) tableContainer.style.display = 'none';
    if (calendarContainer) calendarContainer.style.display = 'block';

    // Default selected date to today when opening calendar
    activeCalendarDay = new Date().toISOString().split('T')[0];
    window.renderCalendar(prefix);
  }
};

window.renderCalendar = function (prefix) {
  const wrapperId = `${prefix}-calendar-wrapper`;
  const container = document.getElementById(wrapperId);
  if (!container) return;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Filter appointments for this panel
  let prefixAppointments = [];
  if (prefix === 'p') {
    const patId = patientData ? patientData.id : (currentUser && currentUser.profile ? currentUser.profile.id : "P-10421");
    prefixAppointments = appointmentsData.filter(a => a.patientId === patId && a.status !== 'Cancelled');
  } else if (prefix === 'd') {
    const docId = currentUser && currentUser.profile ? currentUser.profile.id : 'D-101';
    prefixAppointments = appointmentsData.filter(a => a.doctorId === docId && a.status !== 'Cancelled');
  } else {
    prefixAppointments = appointmentsData.filter(a => a.status !== 'Cancelled');
  }

  // Get first day of the month and number of days
  const firstDayIndex = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const numDays = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();

  // Previous month days count to render empty spaces or offsets
  const prevMonthNumDays = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();

  let html = `
    <div class="calendar-header">
      <h4>${monthNames[currentCalendarMonth]} ${currentCalendarYear}</h4>
      <div class="calendar-header-actions">
        <button class="btn btn-sm btn-ghost" onclick="window.navigateCalendar('${prefix}', -1)">◀</button>
        <button class="btn btn-sm btn-ghost" onclick="window.navigateCalendar('${prefix}', 0)">Today</button>
        <button class="btn btn-sm btn-ghost" onclick="window.navigateCalendar('${prefix}', 1)">▶</button>
      </div>
    </div>
    <div class="calendar-grid">
      <div class="calendar-day-header">Sun</div>
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
  `;

  // Render empty leading days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    html += `<div class="calendar-day empty"><span class="day-num">${prevMonthNumDays - i}</span></div>`;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Render current month days
  for (let day = 1; day <= numDays; day++) {
    const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Find appointments on this day
    const dayAppts = prefixAppointments.filter(a => a.date === dateStr);

    let dotsHtml = '';
    if (dayAppts.length > 0) {
      dotsHtml = '<div class="appt-indicators">';
      dayAppts.forEach(a => {
        const dotClass = a.type === 'Video' ? 'video' : 'in-clinic';
        dotsHtml += `<span class="appt-dot ${dotClass}" title="${a.time} - ${prefix === 'p' ? a.doctorName : a.patientName}"></span>`;
      });
      dotsHtml += '</div>';
    }

    const isToday = dateStr === todayStr ? 'today' : '';
    const isActive = dateStr === activeCalendarDay ? 'active' : '';

    html += `
      <div class="calendar-day ${isToday} ${isActive}" onclick="window.selectCalendarDay('${prefix}', '${dateStr}')">
        <span class="day-num">${day}</span>
        ${dotsHtml}
      </div>
    `;
  }

  // Render trailing empty days of next month to fill grid row
  const totalCells = firstDayIndex + numDays;
  const nextMonthEmptyDays = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= nextMonthEmptyDays; i++) {
    html += `<div class="calendar-day empty"><span class="day-num">${i}</span></div>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  // Render the selected day's appointments in the details list
  window.renderSelectedDayAppointments(prefix);
};

window.navigateCalendar = function (prefix, direction) {
  if (direction === 0) {
    currentCalendarMonth = new Date().getMonth();
    currentCalendarYear = new Date().getFullYear();
    activeCalendarDay = new Date().toISOString().split('T')[0];
  } else {
    currentCalendarMonth += direction;
    if (currentCalendarMonth < 0) {
      currentCalendarMonth = 11;
      currentCalendarYear -= 1;
    } else if (currentCalendarMonth > 11) {
      currentCalendarMonth = 0;
      currentCalendarYear += 1;
    }
  }
  window.renderCalendar(prefix);
};

window.selectCalendarDay = function (prefix, dateStr) {
  activeCalendarDay = dateStr;

  // Rerender grid to update active highlights
  window.renderCalendar(prefix);
};

window.renderSelectedDayAppointments = function (prefix) {
  const label = document.getElementById(`${prefix}-calendar-selected-date-label`);
  const listContainer = document.getElementById(`${prefix}-calendar-day-appointments`);
  if (!listContainer) return;

  if (!activeCalendarDay) {
    listContainer.innerHTML = '<div class="text-muted text-center" style="padding: 2rem 0;">Click on a calendar day to view schedule</div>';
    return;
  }

  const formattedDate = new Date(activeCalendarDay).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  if (label) label.textContent = `Schedule for ${formattedDate}`;

  // Filter appointments for this panel on selected day
  let dayAppts = [];
  if (prefix === 'p') {
    const patId = patientData ? patientData.id : (currentUser && currentUser.profile ? currentUser.profile.id : "P-10421");
    dayAppts = appointmentsData.filter(a => a.patientId === patId && a.date === activeCalendarDay && a.status !== 'Cancelled');
  } else if (prefix === 'd') {
    const docId = currentUser && currentUser.profile ? currentUser.profile.id : 'D-101';
    dayAppts = appointmentsData.filter(a => a.doctorId === docId && a.date === activeCalendarDay && a.status !== 'Cancelled');
  } else {
    dayAppts = appointmentsData.filter(a => a.date === activeCalendarDay && a.status !== 'Cancelled');
  }

  if (dayAppts.length === 0) {
    listContainer.innerHTML = '<div class="text-muted text-center" style="padding: 2rem 0;">No appointments scheduled for this day.</div>';
    return;
  }

  listContainer.innerHTML = '';
  dayAppts.forEach(appt => {
    const badgeClass = appt.type === 'Video' ? 'badge-blue' : 'badge-teal';
    const statusBadge = appt.status === 'Confirmed' ? 'badge-green' : appt.status === 'Pending' ? 'badge-yellow' : 'badge-gray';
    const otherPartyName = prefix === 'p' ? appt.doctorName : appt.patientName;
    const roleLabel = prefix === 'p' ? 'Doctor' : 'Patient';

    let actionButtons = '';
    if (appt.status === 'Confirmed' && appt.type === 'Video') {
      actionButtons += `<button class="btn btn-sm btn-primary" onclick="window.joinVideoRoom('${appt.id}', '${otherPartyName}')">Join Call</button> `;
    }
    if (appt.status === 'Pending' && prefix === 'd') {
      actionButtons += `
        <button class="btn btn-sm btn-primary" onclick="window.acceptAppointment('${appt.id}')">Accept</button>
        <button class="btn btn-sm btn-danger" onclick="window.rejectAppointment('${appt.id}')">Reject</button>
      `;
    }
    if (appt.status === 'Confirmed' || appt.status === 'Pending') {
      actionButtons += `
        <button class="btn btn-sm btn-outline" onclick="window.openRescheduleModal('${appt.id}')">Reschedule</button>
        <button class="btn btn-sm btn-ghost" onclick="window.cancelAppointment('${appt.id}')">Cancel</button>
      `;
    }

    const item = document.createElement('div');
    item.className = 'calendar-appt-list-item';
    item.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--text);">${appt.time}</div>
          <div class="text-muted text-sm" style="margin-top: 0.15rem;">${roleLabel}: <span class="font-semibold" style="color: var(--text2);">${otherPartyName}</span></div>
          <div class="text-muted text-xs" style="margin-top: 0.15rem;">Reason: ${appt.reason || 'General Consult'}</div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap: 0.25rem;">
          <span class="badge ${badgeClass}">${appt.type}</span>
          <span class="badge ${statusBadge}">${appt.status}</span>
        </div>
      </div>
      ${actionButtons ? `<div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:0.25rem;">${actionButtons}</div>` : ''}
    `;
    listContainer.appendChild(item);
  });
};

window.loadAvailableBookingSlots = async function () {
  const doctorId = document.getElementById('book-appt-doctor-select')?.value;
  const date = document.getElementById('book-appt-date')?.value;
  const timeSelect = document.getElementById('book-appt-time');

  const warningDiv = document.getElementById('book-appt-offline-warning');
  if (warningDiv) {
    warningDiv.style.display = 'none';
    warningDiv.innerHTML = '';
  }

  if (!timeSelect) return;

  if (!doctorId || !date) {
    timeSelect.innerHTML = '<option value="">Select doctor & date first...</option>';
    return;
  }

  try {
    timeSelect.innerHTML = '<option value="">Loading available slots...</option>';
    const res = await fetch(`/api/appointments/available-slots?doctorId=${doctorId}&date=${date}`);
    const data = await res.json();

    if (data.success && Array.isArray(data.slots)) {
      if (data.slots.length === 0) {
        timeSelect.innerHTML = '<option value="">No slots available for this date</option>';
      } else {
        timeSelect.innerHTML = data.slots.map(slot => `<option value="${slot}">${slot}</option>`).join('');
      }
    } else {
      timeSelect.innerHTML = '<option value="">Error loading slots</option>';
    }
  } catch (error) {
    console.error("Error fetching slots", error);
    timeSelect.innerHTML = '<option value="">Error loading slots</option>';
  }
};

window.openRescheduleModal = async function (id) {
  const appt = appointmentsData.find(a => String(a.id) === String(id));
  if (!appt) {
    notify('Appointment details not found', 'error');
    return;
  }

  document.getElementById('reschedule-appt-id').value = id;
  document.getElementById('reschedule-appt-doctor-id').value = appt.doctorId;
  document.getElementById('reschedule-appt-doctor-name').value = appt.doctorName;
  document.getElementById('reschedule-appt-date').value = appt.date;

  document.getElementById('reschedule-appt-time').innerHTML = '<option value="">Loading available slots...</option>';
  openModal('rescheduleApptModal');

  await window.loadAvailableRescheduleSlots();

  const timeSelect = document.getElementById('reschedule-appt-time');
  if (timeSelect) {
    let exists = false;
    for (let option of timeSelect.options) {
      if (option.value === appt.time) {
        exists = true;
        break;
      }
    }
    if (!exists && appt.time) {
      const opt = document.createElement('option');
      opt.value = appt.time;
      opt.textContent = `${appt.time} (Current)`;
      timeSelect.appendChild(opt);
    }
    timeSelect.value = appt.time;
  }
};

window.loadAvailableRescheduleSlots = async function () {
  const doctorId = document.getElementById('reschedule-appt-doctor-id')?.value;
  const date = document.getElementById('reschedule-appt-date')?.value;
  const timeSelect = document.getElementById('reschedule-appt-time');

  if (!timeSelect) return;

  if (!doctorId || !date) {
    timeSelect.innerHTML = '<option value="">Select date first...</option>';
    return;
  }

  try {
    const res = await fetch(`/api/appointments/available-slots?doctorId=${doctorId}&date=${date}`);
    const data = await res.json();

    if (data.success && Array.isArray(data.slots)) {
      if (data.slots.length === 0) {
        timeSelect.innerHTML = '<option value="">No slots available for this date</option>';
      } else {
        timeSelect.innerHTML = data.slots.map(slot => `<option value="${slot}">${slot}</option>`).join('');
      }
    } else {
      timeSelect.innerHTML = '<option value="">Error loading slots</option>';
    }
  } catch (error) {
    console.error("Error fetching slots", error);
    timeSelect.innerHTML = '<option value="">Error loading slots</option>';
  }
};

window.submitRescheduleAppointment = async function () {
  const id = document.getElementById('reschedule-appt-id').value;
  const date = document.getElementById('reschedule-appt-date').value;
  const time = document.getElementById('reschedule-appt-time').value;

  if (!date || !time) {
    notify('Please select a date and an available slot', 'error');
    return;
  }

  try {
    let timeStr = time;
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const [timePart, period] = timeStr.trim().split(' ');
      let [h, m] = timePart.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      timeStr = `${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
    }
    const dateTime = `${date}T${timeStr}:00`;

    const res = await fetch(`/api/appointments/reschedule/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateTime,
        rescheduledBy: currentRole
      })
    });

    if (!res.ok) throw new Error('Reschedule failed');

    closeModal('rescheduleApptModal');
    notify('Appointment rescheduled successfully!', 'success');

    if (currentRole === 'patient') {
      await loadPatientData();
      if (document.getElementById('p-appointments-calendar-container').style.display === 'block') {
        window.renderCalendar('p');
      }
    } else if (currentRole === 'doctor') {
      await loadDoctorData();
      if (document.getElementById('d-appointments-calendar-container').style.display === 'block') {
        window.renderCalendar('d');
      }
    } else {
      await loadAdminData();
      if (document.getElementById('a-appointments-calendar-container').style.display === 'block') {
        window.renderCalendar('a');
      }
    }
  } catch (err) {
    notify(err.message, 'error');
  }
};

window.acceptAppointment = async function (id) {
  try {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Confirmed' })
    });

    if (!res.ok) throw new Error('Failed to accept appointment');

    notify('Appointment confirmed successfully!', 'success');

    await loadDoctorData();
    if (document.getElementById('d-appointments-calendar-container').style.display === 'block') {
      window.renderCalendar('d');
    }
  } catch (err) {
    notify(err.message, 'error');
  }
};

window.rejectAppointment = async function (id) {
  if (!confirm('Are you sure you want to reject this appointment?')) return;
  try {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Cancelled' })
    });

    if (!res.ok) throw new Error('Failed to reject appointment');

    notify('Appointment rejected/cancelled successfully', '');

    await loadDoctorData();
    if (document.getElementById('d-appointments-calendar-container').style.display === 'block') {
      window.renderCalendar('d');
    }
  } catch (err) {
    notify(err.message, 'error');
  }
};

function startDashboardPolling() {
  if (dashboardPollInterval) clearInterval(dashboardPollInterval);
  dashboardPollInterval = setInterval(async () => {
    try {
      if (currentUser && currentRole === 'admin') {
        // Real-time live polling for Admin Dashboard
        await loadAdminData();
      } else if (currentUser && currentRole === 'patient') {
        const patId = patientData ? patientData.id : (currentUser.profile ? currentUser.profile.id : null);
        if (patId) {
          const res = await fetch(`${API_BASE}/notifications?userId=${patId}`);
          const notifs = await safeJson(res);
          if (Array.isArray(notifs)) {
            const oldIds = notificationsData.map(n => n._id || n.id);
            const newUnread = notifs.filter(n => !n.read && !oldIds.includes(n._id || n.id));
            if (newUnread.length > 0) {
              newUnread.forEach(n => {
                notify(n.text, 'success');
              });
            }
            notificationsData = notifs;
            updateNotificationsBadge();
            renderNotificationsList();
          }

          const resAppt = await fetch(`${API_BASE}/appointments`);
          const appts = await safeJson(resAppt);
          if (Array.isArray(appts)) {
            appointmentsData = appts;
            renderPatientAppointments();
          }
        }
      } else if (currentUser && currentRole === 'doctor') {
        const docId = currentUser.profile ? currentUser.profile.id : null;
        if (docId) {
          const resAppt = await fetch(`${API_BASE}/appointments`);
          const appts = await safeJson(resAppt);
          if (Array.isArray(appts)) {
            const oldApptsCount = appointmentsData.filter(a => a.doctorId === docId).length;
            const newAppts = appts.filter(a => a.doctorId === docId);
            if (newAppts.length > oldApptsCount) {
              notify('You have received a new appointment booking!', 'success');
            }
            appointmentsData = appts;
            renderDoctorAppointments();
          }
        }
      }
    } catch (err) {
      console.error("Dashboard polling error:", err);
    }
  }, 3000);
}

async function handlePatientPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    notify('Please select an image file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (event) {
    const base64Data = event.target.result;
    try {
      const patId = currentUser && currentUser.profile ? currentUser.profile.id : 'P-10421';
      const res = await fetch(`${API_BASE}/patients/${patId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: base64Data })
      });
      if (!res.ok) throw new Error('Photo upload failed');
      notify('Profile photo updated successfully', 'success');

      // Reload details
      await loadPatientData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };
  reader.readAsDataURL(file);
}

async function handleDoctorPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    notify('Please select an image file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (event) {
    const base64Data = event.target.result;
    try {
      const docId = currentUser && currentUser.profile ? currentUser.profile.id : 'D-101';
      const res = await fetch(`${API_BASE}/doctors/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: base64Data })
      });
      if (!res.ok) throw new Error('Photo upload failed');
      notify('Profile photo updated successfully', 'success');

      // Reload details
      await loadDoctorData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };
  reader.readAsDataURL(file);
}
