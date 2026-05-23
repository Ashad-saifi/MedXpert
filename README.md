# MedXpert – Advanced Telemedicine & EHR Platform

MedXpert is a premium, responsive full-stack web application designed for digital healthcare systems. Refactored from a monolithic HTML mock-up, it utilizes a modular build setup with Vite and Tailwind CSS for the frontend, coupled with a Node.js Express API backend simulating real-time health data workflows.

---

## 📂 Project Structure

```text
medXpert demo/
├── backend/
│   ├── package.json           # Node.js backend configuration
│   └── server.js               # Express mock API database and routing
├── src/
│   ├── index.css              # PostCSS imports & custom components
│   └── main.js                # Frontend controllers & state managers
├── index.html                 # Application page layout and DOM container
├── package.json               # Root frontend configurations
├── postcss.config.js          # PostCSS processing setup
├── tailwind.config.js         # Tailwind utility scan configs
├── vite.config.js             # Vite configuration and server API proxying
└── [10 Documentation Guides]  # Reference manuals for design and dev guides
```

---

## 🛠️ Technology Stack

- **Frontend Core**: HTML5 Semantic Structure, Vanilla JavaScript (ES6+).
- **Styling Design**: Tailwind CSS v3, Custom CSS Variables, Glassmorphism Backdrop, Custom Keyframes.
- **Build Tool**: Vite.
- **Backend API Server**: Node.js, Express, Cors, Dotenv, Nodemon.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).

### Installation & Run

1. **Install Dependencies** (Root & Backend):
   ```bash
   # Install frontend packages in the root directory
   npm install

   # Install backend packages in the backend directory
   cd backend
   npm install
   cd ..
   ```

2. **Start the Express API Server**:
   ```bash
   cd backend
   npm run start
   # Or for development reload:
   npm run dev
   ```

3. **Start the Frontend Dev Server**:
   ```bash
   # In the root directory (separate terminal)
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## ⚡ Main Features

### 🧑‍💼 Patient Portal
- **Dashboard Vitals**: Real-time tracked metrics (Heart rate, Blood Pressure, SpO₂).
- **Find Doctors**: Live searching and specialty-based filtering of medical personnel.
- **Appointment Booking**: Form modals to submit dates, times, and clinical reasons.
- **Telemedicine & Video**: Integrated digital consulting room with active timer overlays.
- **Prescriptions & Labs**: View active meds and download lab reports.

### 👨‍⚕️ Doctor Dashboard
- **Consultation Room**: Join active queues, write notes, and issue prescriptions.
- **Prescription Manager**: Draft medication schedules and transmit prescriptions instantly.
- **Lab Report Reviews**: Examine clinical results and approve treatment plans.

### 🛡️ System Administration
- **User Control Panels**: Register, suspend, and configure authorization roles.
- **Doctor Verification**: Review licensing documents and approve/reject credentials.
- **Platform Customization**: Adjust audit logs, E2E encryption flags, and session timeouts.

---

## 📖 Developer Manuals
Find detailed development guides located in the root folder:
1. [DEVELOPER_GUIDE.md](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/DEVELOPER_GUIDE.md) - Architecture and API details.
2. [THREE_PANEL_SYSTEM.md](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/THREE_PANEL_SYSTEM.md) - Patient, Doctor, and Admin rules.
3. [UNIFIED_PANEL_GUIDE.md](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/UNIFIED_PANEL_GUIDE.md) - UI design consistent patterns.
4. [ANIMATION_GUIDE.md](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/ANIMATION_GUIDE.md) - Keyframes and transition mechanics.
5. [BEFORE_AND_AFTER.md](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/BEFORE_AND_AFTER.md) - Modernization advantages.
6. [CHANGES_LOG.md](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/CHANGES_LOG.md) - Transition logs.
7. [ENHANCEMENTS.md](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/ENHANCEMENTS.md) - Future features.
8. [QUICK_START_PANELS.md](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/QUICK_START_PANELS.md) - Preset testing credentials.
9. [README_ENHANCEMENTS.md](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/README_ENHANCEMENTS.md) - Migration achievements.
