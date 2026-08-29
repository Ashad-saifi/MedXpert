import express from "express";
import { 
    getAdminLogsAndStats, 
    getAdminDashboard,
    getAdminPatients,
    getAdminPatientDetails,
    updatePatientStatus,
    getAdminDoctors,
    getPendingDoctors,
    approveDoctorAdmin,
    rejectDoctorAdmin,
    getAdminAppointments,
    cancelAppointmentAdmin,
    getAdminMedicalRecords,
    getAdminPrescriptions,
    getAdminReportsData,
    getAdminNotifications,
    updateSettings, 
    suspendUser, 
    addUser, 
    editUserAdmin 
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Strict Zero-Trust RBAC: All Admin routes require valid JWT token & role === 'admin'
router.use(protect, authorize("admin"));

// Dashboard & Overview
router.get("/dashboard", getAdminDashboard);
router.get("/logs", getAdminLogsAndStats);
router.get("/security/activity", getAdminLogsAndStats);

// Patients Management
router.get("/patients", getAdminPatients);
router.get("/patients/:id", getAdminPatientDetails);
router.put("/patients/:id/status", updatePatientStatus);

// Doctors & Verification
router.get("/doctors", getAdminDoctors);
router.get("/doctors/pending", getPendingDoctors);
router.put("/doctors/:id/approve", approveDoctorAdmin);
router.post("/doctors/:id/approve", approveDoctorAdmin);
router.put("/doctors/:id/reject", rejectDoctorAdmin);
router.post("/doctors/:id/reject", rejectDoctorAdmin);

// Appointments
router.get("/appointments", getAdminAppointments);
router.put("/appointments/:id/cancel", cancelAppointmentAdmin);

// Records & Prescriptions
router.get("/medical-records", getAdminMedicalRecords);
router.get("/prescriptions", getAdminPrescriptions);

// Reports & Notifications
router.get("/reports", getAdminReportsData);
router.get("/notifications", getAdminNotifications);

// System Settings & Users
router.put("/settings", updateSettings);
router.post("/users/suspend/:id", suspendUser);
router.post("/users/add", addUser);
router.put("/users/edit/:id", editUserAdmin);

export default router;
