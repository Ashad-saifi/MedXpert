# MedXpert – Three-Panel Authorization & Access System

MedXpert is structured around three core roles, each containing a discrete workspace (shell) with specific clinical and system privileges.

---

## 🔑 Role Comparison Matrix

| Capability | Patient Portal | Doctor Dashboard | Admin Panel |
| :--- | :---: | :---: | :---: |
| View Vitals & EHR | Read-Only | Read & Note Addition | Read-Only Summary |
| Book Appointment | Yes (Submit Request) | No | Yes (View / Cancel) |
| Issue Prescription | No | Yes (Create / Transmit) | No |
| Upload Lab Report | Yes (Own reports) | No | No |
| Approve Doctor Credentials | No | No | Yes |
| Manage User Logins | No | No | Yes |
| platform Settings | No | No | Yes |

---

## 🧑‍💼 1. Patient Portal (Alex Smith)
Designed for patients to view personal medical history and schedule telehealth consults.
- **Access Boundary**: Can only view records linked to their unique ID (`P-10421`).
- **Pages**:
  - **Dashboard**: High-level visual widgets summarizing upcoming bookings, active prescriptions, and vitals.
  - **Appointments**: Interactive table listing scheduled dates. Contains buttons to book new appointments or cancel.
  - **Find Doctors**: Search index with filtering, sorting, and consult triggers.
  - **Records & Prescriptions**: Review lab reports, active medical renewals, and download physical copies.

---

## 👨‍⚕️ 2. Doctor Dashboard (Dr. Sarah Johnson)
Provides clinical utilities for physicians to manage active patients and consult virtually.
- **Access Boundary**: Authorized to view all registered patients' diagnostic histories, write consultation reports, and sign medical orders.
- **Pages**:
  - **Dashboard**: Highlights today's hourly schedules, patient ratings, and alerts for pending documents needing review.
  - **My Patients**: Searchable list detailing patient age, primary health conditions, and visit history.
  - **Consultation Room**: Live queue control center to initialize teleconferencing.
  - **Prescription Issuance**: Multi-row form module to prescribe medicines, set schedules, and dispatch prescription records.

---

## 🛡️ 3. Admin Panel (System Administrator)
System console to oversee platform activities, review security logs, and modify operating configs.
- **Access Boundary**: Global system scope. Has permissions to add/suspend accounts and adjust security parameters, but cannot create clinical files (like prescriptions).
- **Pages**:
  - **Manage Users**: Interactive search registry to add new user profiles or suspend existing logins.
  - **Manage Doctors**: Verify onboarding credentials of medical practitioners before they go live on the directory.
  - **Activity Log**: Real-time audit log tracker displaying timestamps, user actions, IP addresses, and transaction outcomes.
  - **System Settings**: Controls platform metadata, consultation slot timers, session timeouts, and two-factor authentication toggles.
