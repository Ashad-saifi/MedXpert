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
let patients = [];
let localStream = null;
let screenStream = null;
let peerConnection = null;
let signalingSocket = null;
let currentReplyIndex = 0;
let isRecording = false;
let recordInterval = null;
let recordSeconds = 0;
let activeCallPartnerName = '';

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

  // Admin reports PDF export
  document.getElementById('btn-a-export-pdf')?.addEventListener('click', () => window.print());

  // Custom video toggles
  document.querySelector('.mic-toggle')?.addEventListener('click', function () {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const isMuted = !audioTrack.enabled;
        this.style.opacity = isMuted ? '0.5' : '1';
        
        if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
          signalingSocket.send(JSON.stringify({
            type: 'mic-toggle',
            enabled: !isMuted
          }));
        }
        notify(isMuted ? 'Microphone muted' : 'Microphone unmuted', '');
      } else {
        notify('No active microphone found', 'error');
      }
    } else {
      this.style.opacity = this.style.opacity == '0.5' ? '1' : '0.5';
      const isMuted = this.style.opacity == '0.5';
      
      if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
        signalingSocket.send(JSON.stringify({
          type: 'mic-toggle',
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
        this.style.opacity = isDisabled ? '0.5' : '1';

        const localVideo = document.getElementById('localVideo');
        const placeholder = document.getElementById('localVideoPlaceholder');

        if (localVideo) {
          localVideo.style.display = isDisabled ? 'none' : 'block';
        }
        if (placeholder) {
          placeholder.style.display = isDisabled ? 'inline' : 'none';
        }

        // Send camera mute state to partner
        if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
          signalingSocket.send(JSON.stringify({
            type: 'camera-toggle',
            enabled: !isDisabled
          }));
        }

        notify(isDisabled ? 'Camera disabled' : 'Camera enabled', '');
      } else {
        notify('No active camera found', 'error');
      }
    } else {
      this.style.opacity = this.style.opacity == '0.5' ? '1' : '0.5';
      const isDisabled = this.style.opacity == '0.5';
      
      if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
        signalingSocket.send(JSON.stringify({
          type: 'camera-toggle',
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
  document.getElementById('btn-p-profile-save')?.addEventListener('click', openEditProfileModal);
  document.getElementById('btn-edit-p-profile-submit')?.addEventListener('click', submitEditPatientProfile);

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
    notify('Participants (2): Aarav Mehta, Dr. Shreya Joshi', 'success');
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
      emailInput.value = 'aarav@email.com';
    } else if (role === 'doctor') {
      emailInput.value = 'shreya@hospital.com';
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
    if (!res.ok) throw new Error(data.message || data.error || 'Server error during login');

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
  stream.getVideoTracks()[0].stop = function() {
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

function createPeerConnection() {
  console.log("Creating RTCPeerConnection...");
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };
  peerConnection = new RTCPeerConnection(configuration);
  
  if (localStream) {
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
  }
  
  peerConnection.onicecandidate = (event) => {
    if (event.candidate && signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
      signalingSocket.send(JSON.stringify({
        type: 'candidate',
        candidate: event.candidate
      }));
    }
  };
  
  peerConnection.ontrack = (event) => {
    console.log("Remote track received:", event.streams[0]);
    const partnerVideo = document.getElementById('partnerVideo');
    const partnerVideoImage = document.getElementById('partnerVideoImage');
    const avatarCenter = document.getElementById('partnerAvatarCenter');
    const pulseRing = document.getElementById('videoPulseRing');
    const audioBars = document.getElementById('partner-audio-bars');
    const partnerEl = document.getElementById('video-partner-name');
    const partnerName = activeCallPartnerName || (currentRole === 'doctor' ? 'Aarav Mehta' : 'Dr. Shreya Joshi');

    if (partnerEl) {
      partnerEl.textContent = `${partnerName} (Connected)`;
    }
    if (pulseRing) pulseRing.style.display = 'none';
    if (avatarCenter) avatarCenter.style.display = 'none';
    if (partnerVideoImage) partnerVideoImage.style.display = 'none';
    
    if (partnerVideo) {
      partnerVideo.srcObject = event.streams[0];
      partnerVideo.style.display = 'block';
      partnerVideo.play().catch(err => console.warn("Error playing remote video:", err));
    }
    if (audioBars) audioBars.style.display = 'flex';
  };
}

async function initiateCall() {
  if (!peerConnection) {
    createPeerConnection();
  }
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
      signalingSocket.send(JSON.stringify({
        type: 'offer',
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
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
      signalingSocket.send(JSON.stringify({
        type: 'answer',
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
    } catch (err) {
      console.error("Failed to handle answer:", err);
    }
  }
}

async function handleCandidate(candidate) {
  if (peerConnection) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Failed to handle ICE candidate:", err);
    }
  }
}

function handleSignalingMessage(data) {
  switch (data.type) {
    case 'peer-joined':
      console.log(`Peer joined: ${data.role}`);
      notify(`${data.role === 'doctor' ? 'Doctor' : 'Patient'} has joined the video consultation`, 'success');
      const partnerEl = document.getElementById('video-partner-name');
      const partnerName = activeCallPartnerName || (currentRole === 'doctor' ? 'Aarav Mehta' : 'Dr. Shreya Joshi');
      if (partnerEl) {
        partnerEl.textContent = `${partnerName} (Connected)`;
      }
      const pulseRing = document.getElementById('videoPulseRing');
      if (pulseRing) pulseRing.style.display = 'none';
      
      initiateCall();
      break;

    case 'peer-left':
      console.log(`Peer left: ${data.role}`);
      notify(`${data.role === 'doctor' ? 'Doctor' : 'Patient'} has left the video consultation`, 'warning');
      const partnerElLeft = document.getElementById('video-partner-name');
      const partnerNameLeft = activeCallPartnerName || (currentRole === 'doctor' ? 'Aarav Mehta' : 'Dr. Shreya Joshi');
      if (partnerElLeft) {
        partnerElLeft.textContent = `${partnerNameLeft} · Disconnected`;
      }
      const partnerVideo = document.getElementById('partnerVideo');
      const avatarCenter = document.getElementById('partnerAvatarCenter');
      if (partnerVideo) {
        partnerVideo.srcObject = null;
        partnerVideo.style.display = 'none';
      }
      if (avatarCenter) {
        avatarCenter.style.display = 'flex';
      }
      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
      }
      break;

    case 'offer':
      handleOffer(data.offer);
      break;

    case 'answer':
      handleAnswer(data.answer);
      break;

    case 'candidate':
      handleCandidate(data.candidate);
      break;

    case 'chat':
      appendChatMessage(data.sender, data.text, 'other');
      const sidebar = document.getElementById('videoCallSidebar');
      if (sidebar && sidebar.style.display === 'none') {
        notify(`New message from ${data.sender}`, 'success');
      }
      break;

    case 'advice':
      const patientAdviceBox = document.getElementById('patient-live-advice-box');
      if (patientAdviceBox) {
        if (data.clinical) {
          patientAdviceBox.innerHTML = `<div style="font-weight:600;margin-bottom:0.25rem;">Chief Complaint: ${data.complaint || 'None'}</div><div>${data.clinical}</div>`;
        } else {
          patientAdviceBox.innerHTML = `<span style="color:rgba(255,255,255,0.4);font-style:italic;">No advice recorded yet. The doctor's advice will update here in real-time.</span>`;
        }
      }
      break;

    case 'reaction':
      showReactionBubble(data.emoji);
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
        notify('Patient vitals synchronized successfully', 'success');
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
      const remoteMicIndicator = document.querySelector('.meet-tile-mic-indicator');
      if (remoteMicIndicator) {
        remoteMicIndicator.style.display = data.enabled ? 'none' : 'flex';
      }
      break;
  }
}

// ── VIDEO ROOM CONTROLLER ──
async function openVideoCall(partnerName = 'Doctor') {
  activeCallPartnerName = partnerName;
  const overlay = document.getElementById('videoCallOverlay');
  if (!overlay) return;

  const timer = document.getElementById('callTimer');
  const partnerEl = document.getElementById('video-partner-name');
  const partnerSub = document.getElementById('video-partner-sub');
  const pulseRing = document.getElementById('videoPulseRing');
  const partnerVideo = document.getElementById('partnerVideo');
  const partnerVideoImage = document.getElementById('partnerVideoImage');
  const audioBars = document.getElementById('partner-audio-bars');
  const micIndicator = document.querySelector('.meet-tile-mic-indicator');

  if (partnerVideo) partnerVideo.style.display = 'none';
  if (partnerVideoImage) partnerVideoImage.style.display = 'none';
  if (audioBars) audioBars.style.display = 'none';
  if (micIndicator) micIndicator.style.display = 'none'; // starts unmuted

  if (partnerEl) {
    partnerEl.textContent = `Waiting for partner...`;
  }

  // Initialize WebSocket signaling socket
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log("Connecting to WebRTC signaling at:", wsUrl);
    signalingSocket = new WebSocket(wsUrl);

    signalingSocket.onopen = () => {
      console.log("WebSocket signaling connected");
      signalingSocket.send(JSON.stringify({
        type: 'join',
        role: currentRole
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
      console.log("WebSocket signaling closed");
    };

    signalingSocket.onerror = (err) => {
      console.error("WebSocket signaling error:", err);
    };
  } catch (err) {
    console.error("Failed to establish WebSocket signaling:", err);
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

  // Reset call sidebar/chat state
  currentReplyIndex = 0;
  const sidebar = document.getElementById('videoCallSidebar');
  if (sidebar) sidebar.style.display = 'none';
  
  // Set active tab to chat
  switchCallTab('chat');

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

  // Reset recording button & badge
  const recordToggle = document.getElementById('btn-record-toggle');
  if (recordToggle) {
    recordToggle.innerHTML = '⏺️';
    recordToggle.style.background = '';
  }
  const recBadge = document.getElementById('recIndicatorBadge');
  if (recBadge) recBadge.style.display = 'none';
  isRecording = false;
  if (recordInterval) {
    clearInterval(recordInterval);
    recordInterval = null;
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

  // Access user's camera and microphone
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream = stream;

    const localVideo = document.getElementById('localVideo');
    const placeholder = document.getElementById('localVideoPlaceholder');
    const videoSelfContainer = document.querySelector('.video-self');
    if (videoSelfContainer) {
      videoSelfContainer.style.display = 'flex'; // show the container
    }
    if (localVideo) {
      localVideo.srcObject = stream;
      localVideo.style.display = 'block';
    }
    if (placeholder) {
      placeholder.style.display = 'none';
    }

    // Remote partner stream will be applied via WebRTC 'ontrack' event handler

    // Reset control buttons visually
    const camBtn = document.querySelector('.camera-toggle');
    const micBtn = document.querySelector('.mic-toggle');
    if (camBtn) camBtn.style.opacity = '1';
    if (micBtn) micBtn.style.opacity = '1';
  } catch (err) {
    console.warn("Camera/microphone access denied or unavailable. Activating simulated video & audio feed:", err);
    notify("Hardware permissions denied. Activating simulated video & audio feed.", "success");

    const stream = createMockMediaStream();
    localStream = stream;

    const localVideo = document.getElementById('localVideo');
    const placeholder = document.getElementById('localVideoPlaceholder');
    const videoSelfContainer = document.querySelector('.video-self');
    if (videoSelfContainer) {
      videoSelfContainer.style.display = 'flex'; // show the container
    }
    if (localVideo) {
      localVideo.srcObject = stream;
      localVideo.style.display = 'block';
    }
    if (placeholder) {
      placeholder.style.display = 'none';
    }

    // Remote partner stream will be applied via WebRTC 'ontrack' event handler

    // Reset control buttons visually
    const camBtn = document.querySelector('.camera-toggle');
    const micBtn = document.querySelector('.mic-toggle');
    if (camBtn) camBtn.style.opacity = '1';
    if (micBtn) micBtn.style.opacity = '1';
  }
}

function closeVideoCall() {
  document.getElementById('videoCallOverlay').style.display = 'none';
  clearInterval(callInterval);

  const timer = document.getElementById('callTimer');
  const durationText = timer ? timer.textContent : '00:00';
  notify(`Consultation ended. Duration: ${durationText}`, 'success');

  // Stop recording if active
  if (isRecording) {
    toggleRecording();
  }

  // Stop screen sharing if active
  if (screenStream) {
    stopScreenShare();
  }

  // Stop all camera and microphone tracks
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  const videoSelfContainer = document.querySelector('.video-self');
  if (videoSelfContainer) {
    videoSelfContainer.style.display = 'none';
  }

  const localVideo = document.getElementById('localVideo');
  const partnerVideo = document.getElementById('partnerVideo');
  const placeholder = document.getElementById('localVideoPlaceholder');
  const avatarCenter = document.getElementById('partnerAvatarCenter');

  if (localVideo) {
    localVideo.srcObject = null;
    localVideo.style.display = 'none';
  }
  if (partnerVideo) {
    partnerVideo.srcObject = null;
    partnerVideo.style.display = 'none';
  }
  if (avatarCenter) {
    avatarCenter.style.display = 'flex';
  }
  if (placeholder) {
    placeholder.style.display = 'inline';
  }

  const sidebar = document.getElementById('videoCallSidebar');
  if (sidebar) sidebar.style.display = 'none';

  // Close WebRTC and signaling socket connections
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (signalingSocket) {
    signalingSocket.close();
    signalingSocket = null;
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

// ── VIDEO CHAT HELPERS & TELEHEALTH ROOM EXTRA CONTROLS ──
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
  const sidebar = document.getElementById('videoCallSidebar');
  if (!sidebar) return;

  const isOpen = sidebar.style.display === 'flex';
  sidebar.style.display = isOpen ? 'none' : 'flex';
  btn.style.background = isOpen ? '' : '#14b8a6';

  if (!isOpen) {
    const input = document.getElementById('videoChatInput');
    if (input) input.focus();
    const messages = document.getElementById('videoChatMessages');
    if (messages) messages.scrollTop = messages.scrollHeight;
    updateCallEhrView();
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

  const myName = currentRole === 'doctor' ? 'Dr. Shreya Joshi' : 'Aarav Mehta';
  appendChatMessage(myName, text, 'self');
  input.value = '';

  // Send message over WebSockets to remote peer
  if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
    signalingSocket.send(JSON.stringify({
      type: 'chat',
      sender: myName,
      text: text
    }));
  } else {
    // Simulated backup if socket is not open
    setTimeout(() => {
      const isDoctor = currentRole === 'doctor';
      const replies = isDoctor ? patientChatReplies : doctorChatReplies;
      const partnerName = isDoctor ? 'Aarav Mehta' : 'Dr. Shreya Joshi';

      const replyText = replies[currentReplyIndex % replies.length];
      currentReplyIndex++;

      appendChatMessage(partnerName, replyText, 'other');

      const sidebar = document.getElementById('videoCallSidebar');
      if (sidebar && sidebar.style.display === 'none') {
        notify(`New message from ${partnerName}`, 'success');
      }
    }, 2000);
  }
}

function sendReaction(emoji, event) {
  if (event) {
    event.stopPropagation();
  }
  showReactionBubble(emoji);
  
  if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
    signalingSocket.send(JSON.stringify({
      type: 'reaction',
      emoji: emoji
    }));
  }
}

function toggleRecording() {
  const btn = document.getElementById('btn-record-toggle');
  const badge = document.getElementById('recIndicatorBadge');
  const timer = document.getElementById('recTimer');
  
  if (!btn || !badge) return;
  
  isRecording = !isRecording;
  
  if (isRecording) {
    btn.innerHTML = '⏹️';
    btn.style.background = '#ef4444';
    badge.style.display = 'flex';
    recordSeconds = 0;
    if (timer) timer.textContent = '00:00';
    
    if (recordInterval) clearInterval(recordInterval);
    recordInterval = setInterval(() => {
      recordSeconds++;
      const m = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
      const s = String(recordSeconds % 60).padStart(2, '0');
      if (timer) timer.textContent = `${m}:${s}`;
    }, 1000);
    
    notify('Consultation recording started', 'success');
  } else {
    btn.innerHTML = '⏺️';
    btn.style.background = '';
    badge.style.display = 'none';
    if (recordInterval) {
      clearInterval(recordInterval);
      recordInterval = null;
    }
    notify('Consultation recording saved to medical records', 'success');
  }
}

function requestVitals() {
  notify('Requesting latest vitals from patient device...', '');
  if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
    signalingSocket.send(JSON.stringify({
      type: 'request-vitals'
    }));
  } else {
    setTimeout(() => {
      const bpSystolic = Math.floor(Math.random() * 10) + 115;
      const bpDiastolic = Math.floor(Math.random() * 6) + 75;
      const hr = Math.floor(Math.random() * 8) + 68;
      const spo2 = Math.floor(Math.random() * 3) + 97;
      
      const bpVal = document.getElementById('val-bp');
      const hrVal = document.getElementById('val-hr');
      const spo2Val = document.getElementById('val-spo2');
      
      if (bpVal) bpVal.textContent = `${bpSystolic}/${bpDiastolic}`;
      if (hrVal) hrVal.textContent = `${hr} bpm`;
      if (spo2Val) spo2Val.textContent = `${spo2}%`;
      
      notify('Patient vitals synchronized successfully (simulated)', 'success');
    }, 1500);
  }
}

function shareVitals() {
  shareVitalsWebSocket();
}

async function saveCallNotes() {
  const complaint = document.getElementById('call-note-complaint')?.value;
  const clinical = document.getElementById('call-note-clinical')?.value;
  
  const patient = patients.find(p => p.name === activeCallPartnerName);
  const patientId = patient ? patient.id : 'P-10421';
  
  try {
    const res = await fetch(`${API_BASE}/patients/${patientId}/clinical-notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chiefComplaint: complaint, clinicalNotes: clinical })
    });
    
    if (!res.ok) throw new Error('Failed to save advice');
    
    notify('Consultation advice saved successfully', 'success');
    
    // Sync via WebSockets to patient screen in real-time
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
      signalingSocket.send(JSON.stringify({
        type: 'advice',
        complaint: complaint,
        clinical: clinical
      }));
    }
    
    const patientAdviceBox = document.getElementById('patient-live-advice-box');
    if (patientAdviceBox) {
      if (clinical) {
        patientAdviceBox.innerHTML = `<div style="font-weight:600;margin-bottom:0.25rem;">Chief Complaint: ${complaint || 'None'}</div><div>${clinical}</div>`;
      } else {
        patientAdviceBox.innerHTML = `<span style="color:rgba(255,255,255,0.4);font-style:italic;">No advice recorded yet. The doctor's advice will update here in real-time.</span>`;
      }
    }
  } catch (err) {
    notify(err.message, 'error');
  }
}

// ── PATIENT FLOW APIS ──
async function loadPatientData() {
  try {
    // 1. Load profile data
    const resPat = await fetch(`${API_BASE}/patients/P-10421`);
    patientData = await resPat.json();

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

    // Update UI profile and dashboard stats
    updatePatientProfileUI();
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
      const nameParts = (doc.name || 'Doctor').split(' ');
      const initials = (nameParts.length > 1 
        ? nameParts.slice(1).map(n => n[0]).join('') 
        : nameParts[0].substring(0, 2) || 'Dr').toUpperCase();
      
      const availabilityStr = doc.availability || (doc.status === 'Active' ? 'Today' : 'Tomorrow');
      const statusBadge = availabilityStr.includes('Today') || doc.status === 'Active' ? 'badge-green' : 'badge-yellow';
      const statusText = doc.status === 'Active' ? 'Available Today' : 'Tomorrow';
      
      const specialtyStr = doc.specialty || 'General Medicine';
      const borderClass = specialtyStr === 'General Medicine' ? 'avatar-teal' : specialtyStr === 'Cardiology' ? 'avatar-blue' : 'avatar-orange';
      const degreeStr = doc.degree || 'MBBS, MD';
      const expStr = doc.exp || '5 yrs';
      const ratingVal = doc.rating || 5.0;
      const feeVal = doc.fee || '500';

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display:flex;gap:1rem;align-items:flex-start;">
          <div class="avatar ${borderClass}" style="width:52px;height:52px;font-size:1rem;">${initials}</div>
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

function openEditProfileModal() {
  if (!patientData) return;
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
  const phone = document.getElementById('edit-p-phone').value;
  const dob = document.getElementById('edit-p-dob').value;
  const bloodType = document.getElementById('edit-p-blood').value;
  const city = document.getElementById('edit-p-city').value;
  const emergName = document.getElementById('edit-p-emerg-name').value;
  const emergRelation = document.getElementById('edit-p-emerg-relation').value;
  const emergPhone = document.getElementById('edit-p-emerg-phone').value;

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
    const res = await fetch(`${API_BASE}/patients/P-10421/profile`, {
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
    patients = patientsList;
    renderDoctorPatients(patientsList);

    // Populate patient select dropdowns in Doctor dashboard
    const notesSelect = document.getElementById('d-notes-patient-select');
    if (notesSelect) {
      notesSelect.innerHTML = patientsList.map(p => `<option value="${p.id}">${p.name} – ${p.id}</option>`).join('');
    }
    const prescSelect = document.getElementById('presc-patient-select');
    if (prescSelect) {
      prescSelect.innerHTML = patientsList.map(p => `<option value="${p.id}">${p.name} – ${p.id}</option>`).join('');
    }

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
    `;
    tableBody.appendChild(tr);
  });
}

function renderDoctorReports() {
  const tableBody = document.getElementById('d-reports-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  reportsData.forEach(rep => {
    const pat = patients.find(p => p.id === rep.patientId) || { name: 'Aarav Mehta' };
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
  const patientId = document.getElementById('d-notes-patient-select')?.value;
  notify('Consultation notes saved successfully', 'success');
  openPrescriptionModal(patientId);
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
    patients = patientsList;
    const resDocs = await fetch(`${API_BASE}/doctors`);
    doctorsData = await resDocs.json();

    renderAdminUsersList(patientsList, doctorsData);
    renderAdminDoctorsTable(doctorsData);

    // Fetch appointments for admin list
    const resAppt = await fetch(`${API_BASE}/appointments`);
    appointmentsData = await resAppt.json();
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
    tr.innerHTML = `
      <td><div class="flex items-center gap-2"><div class="avatar avatar-teal" style="width:32px;height:32px;font-size:.72rem;">${initials}</div><div class="font-semibold">${pat.name}</div></div></td>
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
    document.getElementById('editUser-patient-conditions').value = userObj.chronicConditions || userObj.conditions || '';
  } else if (isDoctor) {
    if (patientFields) patientFields.style.display = 'none';
    if (doctorFields) doctorFields.style.display = 'block';
    
    document.getElementById('editUser-doctor-specialty').value = userObj.specialty || '';
    document.getElementById('editUser-doctor-exp').value = userObj.exp || '';
    document.getElementById('editUser-doctor-fee').value = userObj.fee || '';
    document.getElementById('editUser-doctor-hospital').value = userObj.hospital || '';
  } else {
    if (patientFields) patientFields.style.display = 'none';
    if (doctorFields) doctorFields.style.display = 'none';
  }

  openModal('adminEditUserModal');
}

async function submitEditUserAdmin() {
  const id = document.getElementById('editUser-id').value;
  const name = document.getElementById('editUser-name').value;
  const email = document.getElementById('editUser-email').value;
  const phone = document.getElementById('editUser-phone').value;

  const isPatient = id.startsWith("P-");
  const isDoctor = id.startsWith("D-");

  const bodyData = { name, email, phone };

  if (isPatient) {
    bodyData.age = document.getElementById('editUser-patient-age').value;
    bodyData.bloodType = document.getElementById('editUser-patient-blood').value;
    bodyData.conditions = document.getElementById('editUser-patient-conditions').value;
  } else if (isDoctor) {
    bodyData.specialty = document.getElementById('editUser-doctor-specialty').value;
    bodyData.exp = document.getElementById('editUser-doctor-exp').value;
    bodyData.fee = document.getElementById('editUser-doctor-fee').value;
    bodyData.hospital = document.getElementById('editUser-doctor-hospital').value;
  }

  if (!name || !email) {
    notify('Name and Email are required', 'error');
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
  const firstName = document.getElementById('addUser-first').value;
  const lastName = document.getElementById('addUser-last').value;
  const email = document.getElementById('addUser-email').value;
  const role = document.getElementById('addUser-role').value;
  const phone = document.getElementById('addUser-phone').value;

  // Retrieve patient fields
  const age = document.getElementById('addUser-patient-age').value;
  const bloodType = document.getElementById('addUser-patient-blood').value;
  const chronicConditions = document.getElementById('addUser-patient-conditions').value;

  // Retrieve doctor fields
  const specialty = document.getElementById('addUser-doctor-specialty').value;
  const exp = document.getElementById('addUser-doctor-exp').value;
  const fee = document.getElementById('addUser-doctor-fee').value;
  const hospital = document.getElementById('addUser-doctor-hospital').value;

  if (!firstName || !lastName || !email) {
    notify('Please input name and email address', 'error');
    return;
  }

  try {
    const bodyData = { firstName, lastName, email, role, phone };
    if (role === 'Patient') {
      bodyData.age = age;
      bodyData.bloodType = bloodType;
      bodyData.chronicConditions = chronicConditions;
    } else if (role === 'Doctor') {
      bodyData.specialty = specialty;
      bodyData.exp = exp;
      bodyData.fee = fee;
      bodyData.hospital = hospital;
    }

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

function viewDoctorProfile(docId) {
  const doc = doctorsData.find(d => String(d.id) === String(docId));
  if (!doc) {
    notify('Doctor details not found', 'error');
    return;
  }

  const contentEl = document.getElementById('doc-profile-details-content');
  if (!contentEl) return;

  const nameParts = (doc.name || 'Doctor').split(' ');
  const initials = (nameParts.length > 1 
    ? nameParts.slice(1).map(n => n[0]).join('') 
    : nameParts[0].substring(0, 2) || 'Dr').toUpperCase();

  const specialtyStr = doc.specialty || 'General Medicine';
  const borderClass = specialtyStr === 'General Medicine' ? 'avatar-teal' : specialtyStr === 'Cardiology' ? 'avatar-blue' : 'avatar-orange';
  const ratingVal = doc.rating || 5.0;
  const expStr = doc.exp || '5 yrs';
  const feeVal = doc.fee || '500';
  const degreeStr = doc.degree || 'MBBS, MD';
  const licenseStr = doc.license || 'MCI-2014-08821';
  const hospitalStr = doc.hospital || 'City Medical Center';
  const consultationsCount = doc.consultationsCount || 120;
  const emailStr = doc.email || 'info@hospital.com';
  const phoneStr = doc.phone || '+91 98765 00004';
  const availabilityStr = doc.availability || 'Available Today';
  
  // High-fidelity doctor details mappings A-Z
  const doctorExtraDetails = {
    'D-101': {
      bio: 'Dr. Shreya Joshi is a highly regarded General Physician with over 12 years of experience. She specializes in managing chronic lifestyle conditions like Type-2 diabetes, hypertension, asthma, and thyroid disorders. She is strongly committed to evidence-based preventive medicine and patient education.',
      education: 'MBBS (Grant Medical College, Mumbai), MD in General Medicine (AIIMS, New Delhi)',
      languages: 'English, Hindi, Marathi',
      awards: 'Vanguard Healthcare Excellence Award (2024), Best General Practitioner - City Medical Center (2022)',
      location: 'Room 102, 1st Floor, OPD Block, City Medical Center, Mumbai',
      services: 'Chronic Disease Management, Geriatric Care, Preventive Health Checkups, Infectious Disease Treatment'
    },
    'D-102': {
      bio: 'Dr. Raj Patel is a senior Interventional Cardiologist with 18 years of clinical expertise. He is a pioneer in minimally invasive cardiac procedures and has performed over 3,000 successful coronary angioplasties. He specializes in heart failure therapies and preventative cardiac care.',
      education: 'MBBS (BJ Medical College, Pune), MD (Internal Medicine, KEM Hospital), DM in Cardiology (Hargurudas Heart Institute)',
      languages: 'English, Gujarati, Hindi',
      awards: 'State Cardiology Excellence Award (2023), Fellowship of the American College of Cardiology (FACC)',
      location: 'Chamber 304, 3rd Floor, Cardiology Wing, Heart Institute, Ahmedabad',
      services: 'Coronary Angioplasty, Pacemaker Implantation, Heart Failure Management, Lipidology Consultation'
    },
    'D-103': {
      bio: 'Dr. Neha Kapoor is a dedicated Endocrinologist specializing in diabetes, thyroid disorders, and metabolic health. With 9 years of experience, she focuses on personalized treatment plans combining advanced therapies with lifestyle medicine to empower patients to manage endocrine issues.',
      education: 'MBBS (Lady Hardinge Medical College, Delhi), MD (Medicine, UCMS), Fellowship in Endocrinology (Christian Medical College, Vellore)',
      languages: 'English, Hindi, Punjabi',
      awards: 'Young Endocrinologist Research Award (2021), Diabetes Care Innovation Award (2023)',
      location: 'Suite 12, Ground Floor, Diabetes & Hormone Clinic, New Delhi',
      services: 'Type 1 & Type 2 Diabetes Management, Thyroid Disorders, PCOS Treatment, Osteoporosis & Bone Health'
    },
    'D-104': {
      bio: 'Dr. Arun Mehta is a leading Neurologist with 15 years of experience in neurological care. He specializes in headache management, stroke rehabilitation, and movement disorders like Parkinson\'s disease. He runs dedicated clinics for epilepsy and sleep disorders.',
      education: 'MBBS (Maulana Azad Medical College, New Delhi), MD (General Medicine), DM in Neurology (NIMHANS, Bangalore)',
      languages: 'English, Hindi, Kannada',
      awards: 'National Neurologist Association Merit Award (2022), Stroke Care Pioneer Certificate (2024)',
      location: 'Chamber 401, 4th Floor, Neurology Block, Neuro Center, Bangalore',
      services: 'Stroke Rehabilitation, Epilepsy Management, Parkinson\'s Clinic, Migraine and Chronic Headache Care'
    },
    'D-105': {
      bio: 'Dr. Kavita Rao is a board-certified Dermatologist with 5 years of experience in clinical and cosmetic dermatology. She specializes in advanced treatments for acne, eczema, hair loss, and anti-aging therapies, offering customized skin health programs.',
      education: 'MBBS (KMC, Manipal), DDVL in Dermatology & Venereology (Madras Medical College)',
      languages: 'English, Tamil, Telugu',
      awards: 'Rising Star in Dermatology (Dermacon 2023)',
      location: 'Room 5, Ground Floor, City Skin Clinic, Chennai',
      services: 'Clinical Dermatology (Acne, Psoriasis), Laser Skin Resurfacing, Chemical Peels, Hair Fall Treatments'
    },
    'D-106': {
      bio: 'Dr. Amit Sharma is a compassionate General Physician with 10 years of experience. He is dedicated to comprehensive primary care, family health, and the management of acute infections and occupational health conditions.',
      education: 'MBBS (Maulana Azad Medical College, Delhi), DNB (Family Medicine)',
      languages: 'English, Hindi',
      awards: 'Community Service Health Medal (2023)',
      location: 'OPD Chamber 3, Ground Floor, Apollo Clinic, Kolkata',
      services: 'General Family Medicine, Seasonal Fevers & Infections, Hypertension Control, Lifestyle Counseling'
    },
    'D-107': {
      bio: 'Dr. Vikram Malhotra is an experienced Cardiologist with 14 years in cardiac sciences. He specializes in non-invasive cardiology, echocardiography, and the management of coronary artery disease and hypertension.',
      education: 'MBBS (AFMC, Pune), MD (General Medicine, Command Hospital)',
      languages: 'English, Hindi, Punjabi',
      awards: 'Distinguished Service Award in Cardiac Sciences (2024)',
      location: 'OPD 7, Ground Floor, Max Healthcare, Gurgaon',
      services: 'Stress Testing & ECG Analysis, Hypertension Management, Arrhythmia Care, Post-Heart Surgery Rehab'
    },
    'D-108': {
      bio: 'Dr. Priya Nair is an accomplished Endocrinologist with 8 years of clinical practice. She has special expertise in gestational diabetes, thyroid disorders during pregnancy, pediatric endocrinology, and metabolic syndrome.',
      education: 'MBBS (Calicut Medical College), MD (Internal Medicine), DM in Endocrinology (Amrita Institute of Medical Sciences)',
      languages: 'English, Malayalam, Hindi',
      awards: 'Outstanding Endocrinologist Award (2023)',
      location: 'Chamber 211, 2nd Floor, Fortis Hospital, Kochi',
      services: 'Gestational Diabetes Care, Pediatric Growth Disorders, Obesity Management, Adrenal & Pituitary Care'
    },
    'D-109': {
      bio: 'Dr. Rajesh Sen is a clinical Neurologist with 11 years of experience in brain and nerve health. He specializes in neuro-critical care, multiple sclerosis, and advanced diagnostic neurophysiology.',
      education: 'MBBS (Calcutta Medical College), MD (Medicine), DM in Neurology (NIMHANS)',
      languages: 'English, Bengali, Hindi',
      awards: 'Academic Excellence in Neurology Award (NIMHANS, 2016)',
      location: 'OPD Ward A, NIMHANS Special Wing, Bangalore',
      services: 'Multiple Sclerosis Care, Electromyography (EMG) & EEG, Dementia & Cognitive Care, Neuropathy Care'
    },
    'D-110': {
      bio: 'Dr. Sneha Reddy is a senior consultant Dermatologist with 7 years of experience. She specializes in pediatric dermatology, chronic skin conditions like vitiligo, and aesthetic dermatology including anti-aging procedures.',
      education: 'MBBS (Osmania Medical College), MD in Dermatology (JIPMER, Puducherry)',
      languages: 'English, Telugu, Kannada',
      awards: 'Best Clinical Paper in Dermatology (Aadcon 2022)',
      location: 'OPD Suite 2, City Skin & Hair Clinic, Hyderabad',
      services: 'Pediatric Dermatology, Chronic Skin Disease Management, Botox & Dermal Fillers, Vitiligo Treatments'
    }
  };

  const extra = doctorExtraDetails[doc.id] || {
    bio: 'Experienced medical professional dedicated to providing compassionate, high-quality patient care and clinical services.',
    education: doc.degree || degreeStr,
    languages: 'English, Hindi',
    awards: 'Verified Practitioner Award',
    location: hospitalStr,
    services: `${specialtyStr} services`
  };

  contentEl.innerHTML = `
    <!-- Header with Avatar and Key Badges -->
    <div style="display:flex; gap:1.5rem; align-items:center; margin-bottom:1.5rem;">
      <div class="avatar ${borderClass}" style="width:76px; height:76px; font-size:1.6rem; flex-shrink:0; font-weight:700;">${initials}</div>
      <div style="flex:1;">
        <h3 style="font-size:1.4rem; font-weight:700; margin:0 0 0.25rem 0; color:var(--text);">${doc.name}</h3>
        <div style="font-size:0.95rem; font-weight:600; color:var(--primary); margin-bottom:0.4rem;">${specialtyStr}</div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
          <span class="badge badge-teal">${doc.degree || degreeStr}</span>
          <span class="badge badge-blue">★ ${ratingVal} Rating</span>
          <span class="badge badge-green">${availabilityStr}</span>
        </div>
      </div>
    </div>
    
    <!-- Primary Stats Grid -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
      <div style="background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.75rem 1rem;">
        <div style="font-size:0.75rem; color:var(--text3); font-weight:600; text-transform:uppercase; margin-bottom:0.25rem;">Experience & License</div>
        <div style="font-size:0.9rem; font-weight:600; color:var(--text2); margin-bottom:0.15rem;">${expStr} Experience</div>
        <div style="font-size:0.83rem; color:var(--text3);">Lic. No: ${licenseStr}</div>
      </div>
      <div style="background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.75rem 1rem;">
        <div style="font-size:0.75rem; color:var(--text3); font-weight:600; text-transform:uppercase; margin-bottom:0.25rem;">Consultation Fee</div>
        <div style="font-size:0.9rem; font-weight:600; color:var(--primary); margin-bottom:0.15rem;">₹${feeVal} per visit</div>
        <div style="font-size:0.83rem; color:var(--text3);">Online & Clinic Consultation</div>
      </div>
    </div>

    <!-- Biography -->
    <div style="margin-bottom:1.5rem;">
      <h4 style="font-size:0.9rem; font-weight:600; color:var(--text); margin:0 0 0.4rem 0;">About the Doctor</h4>
      <p style="font-size:0.88rem; color:var(--text2); line-height:1.5; margin:0;">${extra.bio}</p>
    </div>

    <!-- Education, Languages, Awards, Services Grid -->
    <div style="display:grid; grid-template-columns:1fr; gap:0.75rem; margin-bottom:1.5rem; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:1rem;">
      <div style="font-size:0.88rem; line-height:1.4;">
        <strong style="color:var(--text2);">🎓 Education:</strong> <span style="color:var(--text2);">${extra.education}</span>
      </div>
      <div style="font-size:0.88rem; line-height:1.4;">
        <strong style="color:var(--text2);">🗣️ Languages Spoken:</strong> <span style="color:var(--text2);">${extra.languages}</span>
      </div>
      <div style="font-size:0.88rem; line-height:1.4;">
        <strong style="color:var(--text2);">🏆 Awards & Honors:</strong> <span style="color:var(--text2);">${extra.awards}</span>
      </div>
      <div style="font-size:0.88rem; line-height:1.4;">
        <strong style="color:var(--text2);">🩺 Special Services:</strong> <span style="color:var(--text2);">${extra.services}</span>
      </div>
    </div>

    <!-- OPD / Contact Info -->
    <div style="margin-bottom:1.5rem; display:grid; grid-template-columns:1fr; gap:0.75rem;">
      <div style="display:flex; align-items:flex-start; gap:0.5rem; font-size:0.88rem;">
        <span style="font-size:1.1rem; width:24px; text-align:center;">🏢</span>
        <div><strong style="color:var(--text2);">Chamber Location:</strong> ${extra.location}</div>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.88rem;">
        <span style="font-size:1.1rem; width:24px; text-align:center;">📧</span>
        <div><strong style="color:var(--text2);">Email Support:</strong> ${emailStr}</div>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.88rem;">
        <span style="font-size:1.1rem; width:24px; text-align:center;">📞</span>
        <div><strong style="color:var(--text2);">Phone Support:</strong> ${phoneStr}</div>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.88rem;">
        <span style="font-size:1.1rem; width:24px; text-align:center;">⏱️</span>
        <div><strong style="color:var(--text2);">Working Hours:</strong> Mon-Sat (09:00 AM - 05:00 PM)</div>
      </div>
    </div>
    
    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:var(--radius-sm); padding:0.75rem 1rem; display:flex; align-items:center; gap:0.75rem;">
      <span style="font-size:1.5rem;">📊</span>
      <div style="font-size:0.85rem; color:#15803d; line-height:1.4;">
        This practitioner has completed <strong>${consultationsCount} consultations</strong> on MedXpert with a <strong>98.7% positive patient feedback score</strong>.
      </div>
    </div>
  `;

  // Bind booking button to pre-select the doctor and switch to booking modal
  const bookBtn = document.getElementById('btn-doc-profile-book');
  if (bookBtn) {
    bookBtn.onclick = () => {
      closeModal('viewDocProfileModal');
      openBookAppointmentModal(doc.id);
    };
  }

  // Open the modal
  openModal('viewDocProfileModal');
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
