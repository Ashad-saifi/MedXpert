import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import all models
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

const clearDatabase = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb://localhost:27017/medxpert";
        console.log("Connecting to MongoDB to clear data...");
        await mongoose.connect(uri);
        console.log("Connected to MongoDB.");

        console.log("Clearing all collections...");
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
        console.log("Database cleared successfully! All collections are now empty.");

        process.exit(0);
    } catch (error) {
        console.error("Error clearing database:", error);
        process.exit(1);
    }
};

clearDatabase();
