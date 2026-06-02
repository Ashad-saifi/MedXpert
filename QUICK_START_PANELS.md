# MedXpert – Panel Quick Start & Testing Guide

This guide explains how to log into the application using prefilled demo credentials and verify the interactive features across each dashboard.

---

## 🔑 Demo Access Credentials

When you launch the login overlays, these credentials will be automatically prefilled:

- **Patient Portal**:
  - **Email**: `aarav@email.com`
  - **Password**: `password123`
- **Doctor Dashboard**:
  - **Email**: `shreya@hospital.com`
  - **Password**: `password123`
- **Admin Panel**:
  - **Email**: `admin@medxpert.com`
  - **Password**: `password123`

---

## 🧑‍💼 Patient Flow (Alex Smith)

1. Open the **Patient Portal** from the landing screen and sign in.
2. **Book an Appointment**:
   - Navigate to the **Find Doctors** tab.
   - Click **Book Appointment** on any doctor card.
   - Select a date/time, add a reason (e.g. "Regular Checkup"), and confirm.
   - Navigate to the **Appointments** tab to verify your booking is listed.
3. **Upload Lab Report**:
   - Navigate to the **Lab Reports** page.
   - Click **Upload Report**.
   - Input a name (e.g. "Thyroid Panel") and confirm.
   - Check that the new report is added to the table.
4. **Join Consultation**:
   - Navigate to **Video Consult**.
   - Under Scheduled consultations, click **Join**.
   - Verify that the call overlay opens, the timer starts ticking, and the camera indicator glows.

---

## 👨‍⚕️ Doctor Flow (Dr. Sarah Johnson)

1. Return to the landing page and log into the **Doctor Dashboard**.
2. **Review Patient Records**:
   - Click the **My Patients** tab to view all patients.
   - Select a patient to check their conditions.
3. **Consult & Issue Prescriptions**:
   - Under pending actions, choose **Review Now** or join the queue.
   - Launch a call. Once you click **End Call**, the **Issue Prescription** modal will open automatically.
   - Select your patient, input diagnoses, add medicines (e.g., "Amoxicillin 500mg"), and click **Issue**.
   - Verify that the prescription is now listed in the **Prescriptions** tab.

---

## 🛡️ Admin Flow (System Administrator)

1. Log into the **Admin Panel**.
2. **Approve Doctors**:
   - Click **Manage Doctors**.
   - Find "Dr. Kavita Rao" (marked as Pending).
   - Click **Approve** and verify her status updates to Active.
3. **Register New Users**:
   - Click **Manage Users** and click **+ Add User**.
   - Fill out the user details (name, email, role) and submit.
   - Verify that the new user is added to the table.
4. **View Audit Logs**:
   - Navigate to **Activity Log** and verify that all actions taken in the steps above are logged with accurate timestamps.
