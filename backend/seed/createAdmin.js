import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import SystemSetting from "../models/SystemSetting.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const createAdmin = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb://localhost:27017/medxpert";
        console.log("Connecting to MongoDB...");
        await mongoose.connect(uri);

        const existingAdmin = await User.findOne({ email: "admin@medxpert.com" });
        if (existingAdmin) {
            console.log("Admin user already exists:", existingAdmin.email);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        const admin = await User.create({
            name: "System Administrator",
            email: "admin@medxpert.com",
            password: hashedPassword,
            role: "admin",
            phone: "+919999999999"
        });

        // Initialize default system settings
        const existingSettings = await SystemSetting.findOne({});
        if (!existingSettings) {
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
        }

        console.log("Admin account created successfully!");
        console.log("Email:", admin.email);
        console.log("Password: password123");
        console.log("Role:", admin.role);

        process.exit(0);
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
};

createAdmin();
