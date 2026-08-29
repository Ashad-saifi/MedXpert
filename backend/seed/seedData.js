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
import Notification from "../models/Notification.js";
import { signPrescription } from "../cryptoHelper.js";

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
        await ContactRequest.deleteMany({});
        await Notification.deleteMany({});
        console.log("Collections cleared successfully.");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        console.log("Seeding Users...");
        const users = [
            {
                name: "System Admin",
                email: "admin@medxpert.com",
                password: hashedPassword,
                role: "admin",
                phone: "+919999999999"
            },
            {
                name: "Dr. UMA PRAJAPATI",
                email: "umaprajapati759@gmail.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+918868832521"
            },
            {
                name: "Dr. Shreya Joshi",
                email: "shreya@hospital.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+919876543210"
            },
            {
                name: "Dr. Rahul Sharma",
                email: "rahul@hospital.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+919812345678"
            },
            {
                name: "Ashad Saifi",
                email: "saifiashad649@gmail.com",
                password: hashedPassword,
                role: "patient",
                phone: "+918218194545"
            },
            {
                name: "Ashad Saifi",
                email: "ashadsaifi0759@gmail.com",
                password: hashedPassword,
                role: "patient",
                phone: "+918218194545"
            },
            {
                name: "Aarav Mehta",
                email: "aarav@email.com",
                password: hashedPassword,
                role: "patient",
                phone: "+919876501234"
            }
        ];

        const createdUsers = await User.create(users);
        console.log(`Seeded ${createdUsers.length} users.`);

        const adminUser = createdUsers.find(u => u.email === "admin@medxpert.com");
        const docUmaUser = createdUsers.find(u => u.email === "umaprajapati759@gmail.com");
        const docShreyaUser = createdUsers.find(u => u.email === "shreya@hospital.com");
        const docRahulUser = createdUsers.find(u => u.email === "rahul@hospital.com");
        const patAshad1 = createdUsers.find(u => u.email === "saifiashad649@gmail.com");
        const patAshad2 = createdUsers.find(u => u.email === "ashadsaifi0759@gmail.com");
        const patAarav = createdUsers.find(u => u.email === "aarav@email.com");

        console.log("Seeding Doctors Profiles...");
        const docUma = await Doctor.create({
            id: "D-101",
            user: docUmaUser._id,
            profileImage: "",
            name: "Dr. UMA PRAJAPATI",
            email: "umaprajapati759@gmail.com",
            gender: "Female",
            specialty: "Radiology & Imaging",
            exp: "5 yrs",
            fee: "₹500",
            license: "MCI-78821",
            hospital: "City Medical Center",
            rating: 5.0,
            status: "Active",
            availability: "Available Today",
            degree: "MBBS, MD (Radiology)",
            consultationsCount: 142
        });

        const docShreya = await Doctor.create({
            id: "D-102",
            user: docShreyaUser._id,
            profileImage: "",
            name: "Dr. Shreya Joshi",
            email: "shreya@hospital.com",
            gender: "Female",
            specialty: "Cardiology",
            exp: "8 yrs",
            fee: "₹800",
            license: "MCI-99412",
            hospital: "Metro Heart Institute",
            rating: 4.9,
            status: "Active",
            availability: "Available Today",
            degree: "MBBS, DM (Cardiology)",
            consultationsCount: 289
        });

        const docRahul = await Doctor.create({
            id: "D-103",
            user: docRahulUser._id,
            profileImage: "",
            name: "Dr. Rahul Sharma",
            email: "rahul@hospital.com",
            gender: "Male",
            specialty: "General Medicine",
            exp: "12 yrs",
            fee: "₹600",
            license: "MCI-66231",
            hospital: "City Medical Center",
            rating: 4.8,
            status: "Active",
            availability: "Available Today",
            degree: "MBBS, MD (Medicine)",
            consultationsCount: 410
        });

        console.log("Seeding Patient Profiles...");
        const pat1 = await Patient.create({
            id: "P-10421",
            user: patAshad1._id,
            profileImage: "",
            name: "Ashad Saifi",
            email: "saifiashad649@gmail.com",
            age: 26,
            gender: "Male",
            bloodType: "O+",
            height: "178 cm",
            weight: "72 kg",
            chronicConditions: "Mild Seasonal Allergy",
            allergies: "Penicillin",
            emergencyContact: {
                name: "Parent",
                relation: "Family",
                phone: "+918218194545"
            },
            insurance: {
                provider: "Star Health Premier",
                policyNo: "POL-884920",
                validUntil: "2029-12-31"
            },
            conditions: "None",
            clinicalNotes: "Patient reports overall stable health. Seasonal allergy under control.",
            chiefComplaint: "Routine tele-consultation checkup",
            city: "Delhi / NCR",
            dob: "1998-05-14",
            phone: "+918218194545"
        });

        const pat2 = await Patient.create({
            id: "P-10001",
            user: patAshad2._id,
            profileImage: "",
            name: "Ashad Saifi",
            email: "ashadsaifi0759@gmail.com",
            age: 26,
            gender: "Male",
            bloodType: "O+",
            height: "178 cm",
            weight: "72 kg",
            chronicConditions: "None",
            allergies: "None",
            emergencyContact: {
                name: "Family",
                relation: "Spouse",
                phone: "+918218194545"
            },
            insurance: {
                provider: "HDFC ERGO Health",
                policyNo: "HDF-77219",
                validUntil: "2030-01-01"
            },
            conditions: "None",
            clinicalNotes: "Vitals normal. Blood pressure 120/80 mmHg.",
            chiefComplaint: "General Wellness",
            city: "Delhi",
            dob: "1998-05-14",
            phone: "+918218194545"
        });

        const pat3 = await Patient.create({
            id: "P-10002",
            user: patAarav._id,
            profileImage: "",
            name: "Aarav Mehta",
            email: "aarav@email.com",
            age: 32,
            gender: "Male",
            bloodType: "A+",
            height: "175 cm",
            weight: "68 kg",
            chronicConditions: "None",
            allergies: "Dust, Pollen",
            emergencyContact: {
                name: "Rohan Mehta",
                relation: "Brother",
                phone: "+919876501234"
            },
            insurance: {
                provider: "Care Health Insurance",
                policyNo: "CHI-55102",
                validUntil: "2028-06-30"
            },
            conditions: "None",
            clinicalNotes: "Clear lungs, regular heart sounds. Routine preventive consult.",
            chiefComplaint: "Health Certificate",
            city: "Mumbai",
            dob: "1992-08-20",
            phone: "+919876501234"
        });

        console.log("Seeding Appointments...");
        const todayStr = new Date().toISOString().split('T')[0];
        const appts = [
            {
                id: "A-501",
                patient: pat1._id,
                doctor: docUma._id,
                patientId: pat1.id,
                doctorId: docUma.id,
                patientName: pat1.name,
                doctorName: docUma.name,
                date: todayStr,
                time: "10:30 AM",
                dateTime: `${todayStr}T10:30:00`,
                type: "Video Consultation",
                status: "Confirmed",
                reason: "Radiology Scan Consultation & Review"
            },
            {
                id: "A-502",
                patient: pat1._id,
                doctor: docShreya._id,
                patientId: pat1.id,
                doctorId: docShreya.id,
                patientName: pat1.name,
                doctorName: docShreya.name,
                date: todayStr,
                time: "02:00 PM",
                dateTime: `${todayStr}T14:00:00`,
                type: "Video Consultation",
                status: "Confirmed",
                reason: "Cardio Health Follow-up"
            },
            {
                id: "A-503",
                patient: pat2._id,
                doctor: docUma._id,
                patientId: pat2.id,
                doctorId: docUma.id,
                patientName: pat2.name,
                doctorName: docUma.name,
                date: todayStr,
                time: "11:30 AM",
                dateTime: `${todayStr}T11:30:00`,
                type: "Video Consultation",
                status: "Confirmed",
                reason: "Follow-up Teleconsultation"
            },
            {
                id: "A-504",
                patient: pat3._id,
                doctor: docUma._id,
                patientId: pat3.id,
                doctorId: docUma.id,
                patientName: pat3.name,
                doctorName: docUma.name,
                date: todayStr,
                time: "04:30 PM",
                dateTime: `${todayStr}T16:30:00`,
                type: "Video Consultation",
                status: "Pending",
                reason: "X-Ray Report Assessment"
            },
            {
                id: "A-505",
                patient: pat3._id,
                doctor: docRahul._id,
                patientId: pat3.id,
                doctorId: docRahul.id,
                patientName: pat3.name,
                doctorName: docRahul.name,
                date: todayStr,
                time: "05:15 PM",
                dateTime: `${todayStr}T17:15:00`,
                type: "Video Consultation",
                status: "Confirmed",
                reason: "Annual Preventive Health Checkup"
            }
        ];
        await Appointment.create(appts);

        console.log("Seeding Prescriptions with Cryptographic RSA Signatures...");
        const rxData1 = `Metformin 500mg|1 tablet twice daily with meals|${pat1.id}|${todayStr}|RX-201`;
        const sig1 = signPrescription(rxData1);

        const rxData2 = `Vitamin D3 60,000 IU|1 capsule weekly on Sundays|${pat1.id}|${todayStr}|RX-202`;
        const sig2 = signPrescription(rxData2);

        const rxData3 = `Amoxicillin 500mg|1 capsule 3 times daily after food|${pat2.id}|${todayStr}|RX-203`;
        const sig3 = signPrescription(rxData3);

        const rxData4 = `Cetirizine 10mg|1 tablet once daily at bedtime|${pat3.id}|${todayStr}|RX-204`;
        const sig4 = signPrescription(rxData4);

        const prescriptions = [
            {
                id: "RX-201",
                patient: pat1._id,
                doctor: docUma._id,
                patientId: pat1.id,
                patientName: pat1.name,
                doctorName: docUma.name,
                medicineName: "Metformin 500mg",
                dosage: "1 tablet twice daily with meals",
                duration: "1 month",
                date: todayStr,
                refillsTotal: 3,
                refillsUsed: 0,
                status: "Active",
                signature: sig1
            },
            {
                id: "RX-202",
                patient: pat1._id,
                doctor: docShreya._id,
                patientId: pat1.id,
                patientName: pat1.name,
                doctorName: docShreya.name,
                medicineName: "Vitamin D3 60,000 IU",
                dosage: "1 capsule weekly on Sundays",
                duration: "8 weeks",
                date: todayStr,
                refillsTotal: 2,
                refillsUsed: 0,
                status: "Active",
                signature: sig2
            },
            {
                id: "RX-203",
                patient: pat2._id,
                doctor: docUma._id,
                patientId: pat2.id,
                patientName: pat2.name,
                doctorName: docUma.name,
                medicineName: "Amoxicillin 500mg",
                dosage: "1 capsule 3 times daily after food",
                duration: "5 days",
                date: todayStr,
                refillsTotal: 1,
                refillsUsed: 0,
                status: "Active",
                signature: sig3
            },
            {
                id: "RX-204",
                patient: pat3._id,
                doctor: docRahul._id,
                patientId: pat3.id,
                patientName: pat3.name,
                doctorName: docRahul.name,
                medicineName: "Cetirizine 10mg",
                dosage: "1 tablet once daily at bedtime",
                duration: "10 days",
                date: todayStr,
                refillsTotal: 2,
                refillsUsed: 0,
                status: "Active",
                signature: sig4
            }
        ];
        await Prescription.create(prescriptions);

        console.log("Seeding Lab Reports...");
        const reports = [
            {
                id: "L-301",
                patient: pat1._id,
                patientId: pat1.id,
                testName: "Complete Blood Count (CBC)",
                date: todayStr,
                lab: "CityPath Diagnostics",
                result: "Normal (Hb: 14.8 g/dL, TLC: 7,200)",
                status: "Reviewed",
                doctor: docUma._id,
                doctorName: docUma.name
            },
            {
                id: "L-302",
                patient: pat1._id,
                patientId: pat1.id,
                testName: "Lipid Profile & Lipid Panel",
                date: todayStr,
                lab: "Apex Pathology Lab",
                result: "Cholesterol: 172 mg/dL, HDL: 48 mg/dL (Optimal)",
                status: "Reviewed",
                doctor: docShreya._id,
                doctorName: docShreya.name
            },
            {
                id: "L-303",
                patient: pat2._id,
                patientId: pat2.id,
                testName: "Chest X-Ray Digital Screening",
                date: todayStr,
                lab: "City Radiology Imaging Center",
                result: "Normal lung fields, clear sinus angles",
                status: "Reviewed",
                doctor: docUma._id,
                doctorName: docUma.name
            },
            {
                id: "L-304",
                patient: pat3._id,
                patientId: pat3.id,
                testName: "Thyroid Profile (T3, T4, TSH)",
                date: todayStr,
                lab: "Metro Diagnostics",
                result: "TSH: 2.1 uIU/mL (Euthyroid)",
                status: "Reviewed",
                doctor: docRahul._id,
                doctorName: docRahul.name
            }
        ];
        await LabReport.create(reports);

        console.log("Seeding Notifications...");
        await Notification.create([
            {
                userId: pat1.id,
                text: `Your video consultation with Dr. UMA PRAJAPATI is confirmed for today at 10:30 AM.`,
                type: "success",
                page: "pAppointments",
                read: false
            },
            {
                userId: pat1.id,
                text: `Dr. UMA PRAJAPATI uploaded your CBC lab report with normal results.`,
                type: "info",
                page: "pRecords",
                read: false
            },
            {
                userId: pat2.id,
                text: `Your video consultation with Dr. UMA PRAJAPATI is confirmed for today at 11:30 AM.`,
                type: "success",
                page: "pAppointments",
                read: false
            },
            {
                userId: pat3.id,
                text: `Dr. Rahul Sharma scheduled your annual checkup for today at 05:15 PM.`,
                type: "info",
                page: "pAppointments",
                read: false
            }
        ]);

        console.log("Seeding Activity Logs...");
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        await ActivityLog.create([
            { time: nowTime, user: "System Admin", action: "Platform services initiated and synchronized", ip: "127.0.0.1", status: "Success" },
            { time: nowTime, user: "Dr. UMA PRAJAPATI", action: "Completed morning clinical review", ip: "127.0.0.1", status: "Success" },
            { time: nowTime, user: "Ashad Saifi", action: "Accessed digital EHR patient portal", ip: "127.0.0.1", status: "Success" }
        ]);

        console.log("Seeding System Settings...");
        await SystemSetting.create({
            platformName: "MedXpert Telemedicine & EHR",
            supportEmail: "support@medxpert.com",
            defaultDuration: "30 minutes",
            maxPatientsPerDay: 25,
            twoFAEnabled: true,
            sessionTimeoutEnabled: true,
            auditLoggingEnabled: true,
            e2eEncryptionEnabled: true
        });

        console.log("✅ All collections populated with comprehensive, realistic healthcare data!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
};

seedDatabase();
