import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Patient from "./models/Patient.js";
import Doctor from "./models/Doctor.js";
import Appointment from "./models/Appointment.js";
import Prescription from "./models/Prescription.js";
import LabReport from "./models/LabReport.js";
import ActivityLog from "./models/ActivityLog.js";
import ContactRequest from "./models/ContactRequest.js";

const run = async () => {
    try {
        await connectDB();
        console.log("Connected to MongoDB for data cleaning...");

        const keepPatientEmail = "ashad@email.com";
        const keepDoctorEmail = "shreya@hospital.com";
        const keepAdminEmail = "admin@medxpert.com";

        const patientUser = await User.findOne({ email: keepPatientEmail });
        const doctorUser = await User.findOne({ email: keepDoctorEmail });
        const adminUser = await User.findOne({ email: keepAdminEmail });

        const patientUserId = patientUser ? patientUser._id : null;
        const doctorUserId = doctorUser ? doctorUser._id : null;
        const adminUserId = adminUser ? adminUser._id : null;

        // Delete all patients except the one we keep
        const deletePatientsRes = await Patient.deleteMany({ user: { $ne: patientUserId } });
        console.log(`Deleted ${deletePatientsRes.deletedCount} patients.`);

        // Delete all doctors except the one we keep
        const deleteDoctorsRes = await Doctor.deleteMany({ user: { $ne: doctorUserId } });
        console.log(`Deleted ${deleteDoctorsRes.deletedCount} doctors.`);

        // Delete all users except the ones we keep
        const keepUserIds = [patientUserId, doctorUserId, adminUserId].filter(Boolean);
        const deleteUsersRes = await User.deleteMany({ _id: { $not: { $in: keepUserIds } } });
        console.log(`Deleted ${deleteUsersRes.deletedCount} users.`);

        // Delete all appointments, prescriptions, lab reports, logs, etc.
        const apptsRes = await Appointment.deleteMany({});
        console.log(`Deleted ${apptsRes.deletedCount} appointments.`);

        const rxRes = await Prescription.deleteMany({});
        console.log(`Deleted ${rxRes.deletedCount} prescriptions.`);

        const reportsRes = await LabReport.deleteMany({});
        console.log(`Deleted ${reportsRes.deletedCount} lab reports.`);

        const logsRes = await ActivityLog.deleteMany({});
        console.log(`Deleted ${logsRes.deletedCount} activity logs.`);

        const contactsRes = await ContactRequest.deleteMany({});
        console.log(`Deleted ${contactsRes.deletedCount} contact requests.`);

        console.log("Database cleanup completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Cleanup script failed:", err);
        process.exit(1);
    }
};

run();
