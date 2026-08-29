import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import LabReport from "../models/LabReport.js";
import ActivityLog from "../models/ActivityLog.js";
import SystemSetting from "../models/SystemSetting.js";
import ContactRequest from "../models/ContactRequest.js";
import Notification from "../models/Notification.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const cleanAll = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb://localhost:27017/medxpert";
        console.log("Connecting to MongoDB...");
        await mongoose.connect(uri);

        console.log("Completely wiping all collections...");
        await User.deleteMany({});
        await Doctor.deleteMany({});
        await Patient.deleteMany({});
        await Appointment.deleteMany({});
        await Prescription.deleteMany({});
        await LabReport.deleteMany({});
        await ActivityLog.deleteMany({});
        await SystemSetting.deleteMany({});
        await ContactRequest.deleteMany({});
        await Notification.deleteMany({});

        console.log("Creating sole Admin account...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        await User.create({
            name: "System Administrator",
            email: "admin@medxpert.com",
            password: hashedPassword,
            role: "admin",
            phone: "+919999999999"
        });

        await SystemSetting.create({
            platformName: "MedXpert",
            supportEmail: "support@medxpert.com",
            defaultDuration: "30 minutes",
            maxPatientsPerDay: 20,
            twoFAEnabled: true,
            sessionTimeoutEnabled: true,
            auditLoggingEnabled: true,
            e2eEncryptionEnabled: true
        });

        console.log("Backend database completely reset and clean!");
        console.log("Zero doctors, zero patients, zero appointments, zero notifications.");
        console.log("Sole user in database: admin@medxpert.com");

        process.exit(0);
    } catch (error) {
        console.error("Error clearing database:", error);
        process.exit(1);
    }
};

cleanAll();
