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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const seedDatabase = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/medxpert";
        console.log(`Connecting to database at ${mongoUri}...`);
        await mongoose.connect(mongoUri);
        console.log("MongoDB Connected for seeding.");

        console.log("Clearing existing collections...");
        await User.deleteMany({});
        await Doctor.deleteMany({});
        await Patient.deleteMany({});
        await Appointment.deleteMany({});
        await Prescription.deleteMany({});
        await LabReport.deleteMany({});
        await ActivityLog.deleteMany({});
        await SystemSetting.deleteMany({});
        console.log("Collections cleared successfully.");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        console.log("Seeding Users...");
        const users = [
            {
                name: "Alex Smith",
                email: "alex@email.com",
                password: hashedPassword,
                role: "patient",
                phone: "+91 98765 43210"
            },
            {
                name: "Dr. Sarah Johnson",
                email: "sarah@hospital.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+91 98765 00004"
            },
            {
                name: "Dr. Raj Patel",
                email: "raj@heartinstitute.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+91 98765 00005"
            },
            {
                name: "Dr. Neha Kim",
                email: "neha@diabetesclinic.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+91 98765 00006"
            },
            {
                name: "Dr. Arun Mehta",
                email: "arun@neurocenter.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+91 98765 00007"
            },
            {
                name: "Dr. Kavita Rao",
                email: "kavita@clinic.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+91 98765 00008"
            },
            {
                name: "System Administrator",
                email: "admin@medxpert.com",
                password: hashedPassword,
                role: "admin",
                phone: "+1 (555) 000-1111"
            }
        ];

        const createdUsers = await User.create(users);
        console.log(`Seeded ${createdUsers.length} users.`);

        const alexUser = createdUsers.find(u => u.email === "alex@email.com");
        const sarahUser = createdUsers.find(u => u.email === "sarah@hospital.com");
        const rajUser = createdUsers.find(u => u.email === "raj@heartinstitute.com");
        const nehaUser = createdUsers.find(u => u.email === "neha@diabetesclinic.com");
        const arunUser = createdUsers.find(u => u.email === "arun@neurocenter.com");
        const kavitaUser = createdUsers.find(u => u.email === "kavita@clinic.com");

        console.log("Seeding Patient Profile...");
        const patientProfile = await Patient.create({
            id: "P-10421",
            user: alexUser._id,
            name: alexUser.name,
            email: alexUser.email,
            age: 38,
            gender: "Male",
            bloodType: "O+",
            height: "175 cm",
            weight: "72 kg",
            chronicConditions: "Type 2 Diabetes",
            allergies: "Penicillin, Dust",
            emergencyContact: "Priya Smith (Spouse) – +91 98765 00000",
            insurance: "StarHealth · Policy #SH-204881"
        });
        console.log("Seeded patient profile.");

        console.log("Seeding Doctor Profiles...");
        const doctorProfiles = await Doctor.create([
            {
                id: "D-101",
                user: sarahUser._id,
                name: sarahUser.name,
                email: sarahUser.email,
                specialty: "General Medicine",
                exp: "12 yrs",
                fee: "₹500",
                license: "MCI-2014-08821",
                hospital: "City Medical Center",
                rating: 4.9,
                status: "Active"
            },
            {
                id: "D-102",
                user: rajUser._id,
                name: rajUser.name,
                email: rajUser.email,
                specialty: "Cardiology",
                exp: "18 yrs",
                fee: "₹800",
                license: "MCI-2008-01124",
                hospital: "Heart Institute",
                rating: 4.8,
                status: "Active"
            },
            {
                id: "D-103",
                user: nehaUser._id,
                name: nehaUser.name,
                email: nehaUser.email,
                specialty: "Endocrinology",
                exp: "9 yrs",
                fee: "₹600",
                license: "MCI-2017-09432",
                hospital: "Diabetes Clinic",
                rating: 4.7,
                status: "Active"
            },
            {
                id: "D-104",
                user: arunUser._id,
                name: arunUser.name,
                email: arunUser.email,
                specialty: "Neurology",
                exp: "15 yrs",
                fee: "₹900",
                license: "MCI-2011-04399",
                hospital: "Neuro Center",
                rating: 4.9,
                status: "Active"
            },
            {
                id: "D-105",
                user: kavitaUser._id,
                name: kavitaUser.name,
                email: kavitaUser.email,
                specialty: "Dermatology",
                exp: "5 yrs",
                fee: "₹700",
                license: "MCI-PENDING",
                hospital: "City Skin Clinic",
                rating: 4.6,
                status: "Pending"
            }
        ]);
        console.log(`Seeded ${doctorProfiles.length} doctor profiles.`);

        const sarahDoc = doctorProfiles.find(d => d.id === "D-101");
        const rajDoc = doctorProfiles.find(d => d.id === "D-102");

        console.log("Seeding Appointments...");
        await Appointment.create([
            {
                id: "A-501",
                patient: patientProfile._id,
                doctor: sarahDoc._id,
                patientId: patientProfile.id,
                doctorId: sarahDoc.id,
                patientName: patientProfile.name,
                doctorName: sarahDoc.name,
                date: "2026-05-23",
                time: "10:30 AM",
                type: "Video Consultation",
                status: "Confirmed",
                reason: "General Consult"
            },
            {
                id: "A-502",
                patient: patientProfile._id,
                doctor: rajDoc._id,
                patientId: patientProfile.id,
                doctorId: rajDoc.id,
                patientName: patientProfile.name,
                doctorName: rajDoc.name,
                date: "2026-06-03",
                time: "02:00 PM",
                type: "In-Clinic",
                status: "Confirmed",
                reason: "Follow-up – Cardiology"
            }
        ]);
        console.log("Seeded appointments.");

        console.log("Seeding Prescriptions...");
        await Prescription.create([
            {
                id: "RX-201",
                patient: patientProfile._id,
                doctor: rajDoc._id,
                patientId: patientProfile.id,
                patientName: patientProfile.name,
                doctorName: rajDoc.name,
                medicineName: "Metformin 500mg",
                dosage: "Twice daily – Morning & Evening",
                duration: "3 months",
                date: "2026-05-10",
                refillsTotal: 3,
                refillsUsed: 1,
                status: "Active"
            },
            {
                id: "RX-202",
                patient: patientProfile._id,
                doctor: sarahDoc._id,
                patientId: patientProfile.id,
                patientName: patientProfile.name,
                doctorName: sarahDoc.name,
                medicineName: "Atorvastatin 10mg",
                dosage: "Once daily – Bedtime",
                duration: "6 months",
                date: "2026-04-22",
                refillsTotal: 6,
                refillsUsed: 2,
                status: "Active"
            },
            {
                id: "RX-203",
                patient: patientProfile._id,
                doctor: sarahDoc._id, // Set Neha Kim or Sarah
                patientId: patientProfile.id,
                patientName: patientProfile.name,
                doctorName: "Dr. Neha Kim",
                medicineName: "Vitamin D3 1000IU",
                dosage: "Once daily – Morning",
                duration: "3 months",
                date: "2026-05-15",
                refillsTotal: 3,
                refillsUsed: 3,
                status: "Refill Soon"
            }
        ]);
        console.log("Seeded prescriptions.");

        console.log("Seeding Lab Reports...");
        await LabReport.create([
            {
                id: "L-301",
                patient: patientProfile._id,
                patientId: patientProfile.id,
                testName: "Complete Blood Count",
                date: "2026-05-15",
                lab: "CityPath Lab",
                result: "Normal",
                status: "Reviewed"
            },
            {
                id: "L-302",
                patient: patientProfile._id,
                patientId: patientProfile.id,
                testName: "HbA1c",
                date: "2026-05-15",
                lab: "CityPath Lab",
                result: "6.8% – Borderline",
                status: "Action Required"
            },
            {
                id: "L-303",
                patient: patientProfile._id,
                patientId: patientProfile.id,
                testName: "Lipid Panel",
                date: "2026-05-15",
                lab: "CityPath Lab",
                result: "Normal",
                status: "Reviewed"
            }
        ]);
        console.log("Seeded lab reports.");

        console.log("Seeding Activity Logs...");
        await ActivityLog.create([
            { time: "10:32:18", user: "Dr. Sarah Johnson", action: "Started video consultation with P-10421", ip: "192.168.1.42", status: "Success" },
            { time: "10:29:44", user: "Alex Smith", action: "Logged in to patient portal", ip: "203.90.1.18", status: "Success" },
            { time: "10:15:02", user: "System", action: "Automated database seeding", ip: "Internal", status: "Success" }
        ]);
        console.log("Seeded activity logs.");

        console.log("Seeding System Settings...");
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
        console.log("Seeded system settings.");

        console.log("Database seeded successfully!");
        process.exit(0);
    } catch (error) {
        if (error.name === "MongooseServerSelectionError" || error.message.includes("connect ECONNREFUSED")) {
            console.warn(`\n⚠️  Database Seeding Warning: ${error.message}`);
            console.warn(`👉 MongoDB local server is not running or offline. Seeding was bypassed gracefully.`);
            console.warn(`👉 To seed a live database, please ensure MongoDB is running and update backend/.env with your MONGO_URI.\n`);
            process.exit(0);
        } else {
            console.error("Database seeding failed:", error);
            process.exit(1);
        }
    }
};

seedDatabase();
