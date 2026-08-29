import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const seedDatabaseForInMemory = async () => {
    try {
        console.log("Clearing existing collections...");
        await User.deleteMany({});
        await Doctor.deleteMany({});
        await Patient.deleteMany({});
        await Appointment.deleteMany({});
        await Prescription.deleteMany({});
        await LabReport.deleteMany({});
        await ActivityLog.deleteMany({});
        await SystemSetting.deleteMany({});
        await ContactRequest.deleteMany({});
        console.log("Collections cleared successfully.");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        console.log("Seeding Users...");
        const users = [
            {
                name: "uma prajapati",
                email: "UMAPRAJAPATI759@GMAIL.COM",
                password: hashedPassword,
                role: "doctor",
                phone: "+918868832521"
            },
            {
                name: "ashad saifi",
                email: "saifiashad649@gmail.com",
                password: hashedPassword,
                role: "patient",
                phone: "+918218194545"
            }
        ];

        const createdUsers = await User.create(users);
        console.log(`Seeded ${createdUsers.length} users.`);

        const doctorUser = createdUsers.find(u => u.role === "doctor");
        const patientUser = createdUsers.find(u => u.role === "patient");

        console.log("Seeding Patient Profile...");
        await Patient.create({
            id: "P-10001",
            user: patientUser._id,
            profileImage: "",
            name: "ashad saifi",
            email: "saifiashad649@gmail.com",
            age: 30,
            gender: "Male",
            bloodType: "O+",
            height: "Not Specified",
            weight: "Not Specified",
            chronicConditions: "None",
            allergies: "None",
            emergencyContact: {
                name: "ashad saifi",
                relation: "hlo",
                phone: "12345611221"
            },
            insurance: {
                provider: "Not Specified",
                policyNo: "Not Specified",
                validUntil: "Not Specified"
            },
            conditions: "None",
            clinicalNotes: "",
            chiefComplaint: "",
            city: "SIKANDARABAD INDUSTRIAL AREA",
            dob: "2026-07-03",
            phone: "+918218194545"
        });

        console.log("Seeding Doctor Profile...");
        await Doctor.create({
            id: "D-101",
            user: doctorUser._id,
            profileImage: "",
            name: "UMA PRAJAPATI",
            email: "UMAPRAJAPATI759@GMAIL.COM",
            specialty: "Radiology",
            exp: "5 yrs",
            fee: "5000",
            license: "MCI",
            hospital: "City Medical Center",
            rating: 5,
            status: "Active",
            availability: "Available Today",
            degree: "MBBS, MD",
            consultationsCount: 0
        });

        console.log("Database seeded successfully with only Ashad and Uma!");
    } catch (error) {
        console.error("Error seeding database:", error);
    }
};
