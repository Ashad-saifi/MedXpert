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
        console.log("Collections cleared successfully.");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        console.log("Seeding Users...");
        const users = [
            {
                name: "Aarav Mehta",
                email: "aarav@email.com",
                password: hashedPassword,
                role: "patient",
                phone: "+91 98765 43210"
            },
            {
                name: "Riya Sharma",
                email: "riya@email.com",
                password: hashedPassword,
                role: "patient",
                phone: "+91 98765 43211"
            },
            {
                name: "Kabir Malhotra",
                email: "kabir@email.com",
                password: hashedPassword,
                role: "patient",
                phone: "+91 98765 43212"
            },
            {
                name: "Ananya Iyer",
                email: "ananya@email.com",
                password: hashedPassword,
                role: "patient",
                phone: "+91 98765 43213"
            },
            {
                name: "Arjun Sen",
                email: "arjun@email.com",
                password: hashedPassword,
                role: "patient",
                phone: "+91 98765 43214"
            },
            {
                name: "Dr. Shreya Joshi",
                email: "shreya@hospital.com",
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
                name: "Dr. Neha Kapoor",
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
                name: "Dr. Amit Sharma",
                email: "amit@hospital.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+91 98765 00009"
            },
            {
                name: "Dr. Vikram Malhotra",
                email: "vikram@heartinstitute.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+91 98765 00010"
            },
            {
                name: "Dr. Priya Nair",
                email: "priya@diabetesclinic.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+91 98765 00011"
            },
            {
                name: "Dr. Rajesh Sen",
                email: "rajesh@neurocenter.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+91 98765 00012"
            },
            {
                name: "Dr. Sneha Reddy",
                email: "sneha@clinic.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+91 98765 00013"
            },
            {
                name: "Dr. Ajay Verma",
                email: "ajay@hospital.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+91 98765 00014"
            },
            {
                name: "Dr. Sunita Rao",
                email: "sunita@clinic.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+91 98765 00015"
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

        const alexUser = createdUsers.find(u => u.email === "aarav@email.com");
        const riyaUser = createdUsers.find(u => u.email === "riya@email.com");
        const kabirUser = createdUsers.find(u => u.email === "kabir@email.com");
        const ananyaUser = createdUsers.find(u => u.email === "ananya@email.com");
        const arjunUserFind = createdUsers.find(u => u.email === "arjun@email.com");
        const sarahUser = createdUsers.find(u => u.email === "shreya@hospital.com");
        const rajUser = createdUsers.find(u => u.email === "raj@heartinstitute.com");
        const nehaUser = createdUsers.find(u => u.email === "neha@diabetesclinic.com");
        const arunUser = createdUsers.find(u => u.email === "arun@neurocenter.com");
        const kavitaUser = createdUsers.find(u => u.email === "kavita@clinic.com");
        const amitUser = createdUsers.find(u => u.email === "amit@hospital.com");
        const vikramUser = createdUsers.find(u => u.email === "vikram@heartinstitute.com");
        const priyaUser = createdUsers.find(u => u.email === "priya@diabetesclinic.com");
        const rajeshUser = createdUsers.find(u => u.email === "rajesh@neurocenter.com");
        const snehaUser = createdUsers.find(u => u.email === "sneha@clinic.com");
        const ajayUser = createdUsers.find(u => u.email === "ajay@hospital.com");
        const sunitaUser = createdUsers.find(u => u.email === "sunita@clinic.com");

        console.log("Seeding Patient Profile...");
        const patientProfiles = await Patient.create([
            {
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
                conditions: "Type 2 Diabetes",
                allergies: "Penicillin, Dust",
                emergencyContact: {
                    name: "Priya Mehta",
                    relation: "Spouse",
                    phone: "+91 98765 00000"
                },
                insurance: {
                    provider: "StarHealth",
                    policyNo: "SH-204881",
                    validUntil: "2028-12-31"
                }
            },
            {
                id: "P-10422",
                user: riyaUser._id,
                name: riyaUser.name,
                email: riyaUser.email,
                age: 28,
                gender: "Female",
                bloodType: "B+",
                height: "162 cm",
                weight: "54 kg",
                chronicConditions: "Asthma",
                conditions: "Asthma",
                allergies: "Sulfonamides",
                emergencyContact: {
                    name: "Rajesh Sharma",
                    relation: "Father",
                    phone: "+91 98765 00001"
                },
                insurance: {
                    provider: "StarHealth",
                    policyNo: "SH-204882",
                    validUntil: "2029-06-30"
                }
            },
            {
                id: "P-10423",
                user: kabirUser._id,
                name: kabirUser.name,
                email: kabirUser.email,
                age: 45,
                gender: "Male",
                bloodType: "A-",
                height: "180 cm",
                weight: "85 kg",
                chronicConditions: "Hypertension",
                conditions: "Hypertension",
                allergies: "Aspirin",
                emergencyContact: {
                    name: "Sonia Malhotra",
                    relation: "Sister",
                    phone: "+91 98765 00002"
                },
                insurance: {
                    provider: "HDFC Ergo",
                    policyNo: "HE-908231",
                    validUntil: "2030-01-15"
                }
            },
            {
                id: "P-10424",
                user: ananyaUser._id,
                name: ananyaUser.name,
                email: ananyaUser.email,
                age: 32,
                gender: "Female",
                bloodType: "O-",
                height: "165 cm",
                weight: "58 kg",
                chronicConditions: "None",
                conditions: "None",
                allergies: "None",
                emergencyContact: {
                    name: "Venkatesh Iyer",
                    relation: "Brother",
                    phone: "+91 98765 00003"
                },
                insurance: {
                    provider: "ICICI Lombard",
                    policyNo: "IC-102983",
                    validUntil: "2028-09-20"
                }
            },
            {
                id: "P-10425",
                user: arjunUserFind._id,
                name: arjunUserFind.name,
                email: arjunUserFind.email,
                age: 55,
                gender: "Male",
                bloodType: "AB+",
                height: "172 cm",
                weight: "79 kg",
                chronicConditions: "Chronic Kidney Disease",
                conditions: "Chronic Kidney Disease",
                allergies: "Contrast dye",
                emergencyContact: {
                    name: "Meera Sen",
                    relation: "Spouse",
                    phone: "+91 98765 00004"
                },
                insurance: {
                    provider: "StarHealth",
                    policyNo: "SH-302911",
                    validUntil: "2027-11-30"
                }
            }
        ]);
        console.log("Seeded patient profiles.");
        const patientProfile = patientProfiles[0];

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
                status: "Active",
                degree: "MBBS, MD",
                availability: "Available Today",
                consultationsCount: 284
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
                status: "Active",
                degree: "MBBS, MD, DM",
                availability: "Available Today",
                consultationsCount: 156
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
                status: "Active",
                degree: "MBBS, MD",
                availability: "Available Tomorrow",
                consultationsCount: 94
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
                status: "Active",
                degree: "MBBS, MD, DM",
                availability: "Available Today",
                consultationsCount: 112
            },
            {
                id: "D-105",
                user: kavitaUser._id,
                name: kavitaUser.name,
                email: kavitaUser.email,
                specialty: "Dermatology",
                exp: "5 yrs",
                fee: "₹700",
                license: "MCI-2019-01141",
                hospital: "City Skin Clinic",
                rating: 4.6,
                status: "Active",
                degree: "MBBS, DDVL",
                availability: "Available Tomorrow",
                consultationsCount: 45
            },
            {
                id: "D-106",
                user: amitUser._id,
                name: amitUser.name,
                email: amitUser.email,
                specialty: "General Medicine",
                exp: "10 yrs",
                fee: "₹500",
                license: "MCI-2016-01294",
                hospital: "Apollo Clinic",
                rating: 4.8,
                status: "Active",
                degree: "MBBS",
                availability: "Available Today",
                consultationsCount: 187
            },
            {
                id: "D-107",
                user: vikramUser._id,
                name: vikramUser.name,
                email: vikramUser.email,
                specialty: "Cardiology",
                exp: "14 yrs",
                fee: "₹800",
                license: "MCI-2012-05491",
                hospital: "Max Healthcare",
                rating: 4.7,
                status: "Active",
                degree: "MBBS, MD",
                availability: "Available Tomorrow",
                consultationsCount: 134
            },
            {
                id: "D-108",
                user: priyaUser._id,
                name: priyaUser.name,
                email: priyaUser.email,
                specialty: "Endocrinology",
                exp: "8 yrs",
                fee: "₹600",
                license: "MCI-2018-02834",
                hospital: "Fortis Hospital",
                rating: 4.9,
                status: "Active",
                degree: "MBBS, MD",
                availability: "Available Today",
                consultationsCount: 78
            },
            {
                id: "D-109",
                user: rajeshUser._id,
                name: rajeshUser.name,
                email: rajeshUser.email,
                specialty: "Neurology",
                exp: "11 yrs",
                fee: "₹900",
                license: "MCI-2015-09843",
                hospital: "NIMHANS Special",
                rating: 4.6,
                status: "Active",
                degree: "MBBS, MD",
                availability: "Available Today",
                consultationsCount: 89
            },
            {
                id: "D-110",
                user: snehaUser._id,
                name: snehaUser.name,
                email: snehaUser.email,
                specialty: "Dermatology",
                exp: "7 yrs",
                fee: "₹700",
                license: "MCI-2019-01142",
                hospital: "Kaya Skin Clinic",
                rating: 4.8,
                status: "Active",
                degree: "MBBS, MD",
                availability: "Available Today",
                consultationsCount: 92
            },
            {
                id: "D-111",
                user: ajayUser._id,
                name: ajayUser.name,
                email: ajayUser.email,
                specialty: "Pediatrics",
                exp: "10 yrs",
                fee: "₹500",
                license: "MCI-2016-04423",
                hospital: "Rainbow Children Clinic",
                rating: 4.9,
                status: "Active",
                degree: "MBBS, DCH, DNB",
                availability: "Available Today",
                consultationsCount: 120
            },
            {
                id: "D-112",
                user: sunitaUser._id,
                name: sunitaUser.name,
                email: sunitaUser.email,
                specialty: "Gynecology",
                exp: "15 yrs",
                fee: "₹700",
                license: "MCI-2011-09871",
                hospital: "Matrika Hospital",
                rating: 4.8,
                status: "Active",
                degree: "MBBS, MS, DGO",
                availability: "Available Today",
                consultationsCount: 210
            }
        ]);
        console.log(`Seeded ${doctorProfiles.length} doctor profiles.`);

        const sarahDoc = doctorProfiles.find(d => d.id === "D-101");
        const rajDoc = doctorProfiles.find(d => d.id === "D-102");
        const nehaDoc = doctorProfiles.find(d => d.id === "D-103");

        console.log("Seeding Appointments...");
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        
        await Appointment.create([
            {
                id: "A-501",
                patient: patientProfiles[0]._id,
                doctor: sarahDoc._id,
                patientId: patientProfiles[0].id,
                doctorId: sarahDoc.id,
                patientName: patientProfiles[0].name,
                doctorName: sarahDoc.name,
                date: tomorrow.toISOString().split("T")[0],
                time: "10:30 AM",
                dateTime: tomorrow.toISOString(),
                type: "Video",
                status: "Confirmed",
                reason: "General Consultation"
            },
            {
                id: "A-502",
                patient: patientProfiles[0]._id,
                doctor: rajDoc._id,
                patientId: patientProfiles[0].id,
                doctorId: rajDoc.id,
                patientName: patientProfiles[0].name,
                doctorName: rajDoc.name,
                date: nextWeek.toISOString().split("T")[0],
                time: "02:00 PM",
                dateTime: nextWeek.toISOString(),
                type: "In-Clinic",
                status: "Confirmed",
                reason: "Follow-up – Cardiology"
            },
            {
                id: "A-503",
                patient: patientProfiles[1]._id,
                doctor: sarahDoc._id,
                patientId: patientProfiles[1].id,
                doctorId: sarahDoc.id,
                patientName: patientProfiles[1].name,
                doctorName: sarahDoc.name,
                date: tomorrow.toISOString().split("T")[0],
                time: "11:30 AM",
                dateTime: tomorrow.toISOString(),
                type: "Video",
                status: "Confirmed",
                reason: "Asthma Follow-up"
            },
            {
                id: "A-504",
                patient: patientProfiles[2]._id,
                doctor: rajDoc._id,
                patientId: patientProfiles[2].id,
                doctorId: rajDoc.id,
                patientName: patientProfiles[2].name,
                doctorName: rajDoc.name,
                date: tomorrow.toISOString().split("T")[0],
                time: "03:00 PM",
                dateTime: tomorrow.toISOString(),
                type: "Video",
                status: "Confirmed",
                reason: "Hypertension Review"
            },
            {
                id: "A-505",
                patient: patientProfiles[3]._id,
                doctor: nehaDoc._id,
                patientId: patientProfiles[3].id,
                doctorId: nehaDoc.id,
                patientName: patientProfiles[3].name,
                doctorName: nehaDoc.name,
                date: nextWeek.toISOString().split("T")[0],
                time: "09:30 AM",
                dateTime: nextWeek.toISOString(),
                type: "In-Clinic",
                status: "Confirmed",
                reason: "Thyroid Consultation"
            },
            {
                id: "A-506",
                patient: patientProfiles[4]._id,
                doctor: sarahDoc._id,
                patientId: patientProfiles[4].id,
                doctorId: sarahDoc.id,
                patientName: patientProfiles[4].name,
                doctorName: sarahDoc.name,
                date: tomorrow.toISOString().split("T")[0],
                time: "04:30 PM",
                dateTime: tomorrow.toISOString(),
                type: "In-Clinic",
                status: "Confirmed",
                reason: "CKD Care Management"
            },
            // Past completed appointments for Last Visit columns
            {
                id: "A-507",
                patient: patientProfiles[0]._id,
                doctor: sarahDoc._id,
                patientId: patientProfiles[0].id,
                doctorId: sarahDoc.id,
                patientName: patientProfiles[0].name,
                doctorName: sarahDoc.name,
                date: tenDaysAgo.toISOString().split("T")[0],
                time: "10:00 AM",
                dateTime: tenDaysAgo.toISOString(),
                type: "In-Clinic",
                status: "Completed",
                reason: "Annual Health Checkup"
            },
            {
                id: "A-508",
                patient: patientProfiles[1]._id,
                doctor: sarahDoc._id,
                patientId: patientProfiles[1].id,
                doctorId: sarahDoc.id,
                patientName: patientProfiles[1].name,
                doctorName: sarahDoc.name,
                date: fiveDaysAgo.toISOString().split("T")[0],
                time: "11:00 AM",
                dateTime: fiveDaysAgo.toISOString(),
                type: "Video",
                status: "Completed",
                reason: "Initial Consultation"
            },
            {
                id: "A-509",
                patient: patientProfiles[2]._id,
                doctor: rajDoc._id,
                patientId: patientProfiles[2].id,
                doctorId: rajDoc.id,
                patientName: patientProfiles[2].name,
                doctorName: rajDoc.name,
                date: tenDaysAgo.toISOString().split("T")[0],
                time: "02:30 PM",
                dateTime: tenDaysAgo.toISOString(),
                type: "In-Clinic",
                status: "Completed",
                reason: "Cardiac Screening"
            }
        ]);
        console.log("Seeded appointments.");

        console.log("Seeding Prescriptions...");
        await Prescription.create([
            {
                id: "RX-201",
                patient: patientProfiles[0]._id,
                doctor: rajDoc._id,
                patientId: patientProfiles[0].id,
                patientName: patientProfiles[0].name,
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
                patient: patientProfiles[0]._id,
                doctor: sarahDoc._id,
                patientId: patientProfiles[0].id,
                patientName: patientProfiles[0].name,
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
                patient: patientProfiles[0]._id,
                doctor: sarahDoc._id,
                patientId: patientProfiles[0].id,
                patientName: patientProfiles[0].name,
                doctorName: "Dr. Neha Kapoor",
                medicineName: "Vitamin D3 1000IU",
                dosage: "Once daily – Morning",
                duration: "3 months",
                date: "2026-05-15",
                refillsTotal: 3,
                refillsUsed: 3,
                status: "Refill Soon"
            },
            {
                id: "RX-204",
                patient: patientProfiles[1]._id,
                doctor: sarahDoc._id,
                patientId: patientProfiles[1].id,
                patientName: patientProfiles[1].name,
                doctorName: sarahDoc.name,
                medicineName: "Albuterol Inhaler",
                dosage: "1-2 puffs every 4 hours as needed",
                duration: "1 month",
                date: "2026-05-20",
                refillsTotal: 2,
                refillsUsed: 0,
                status: "Active"
            },
            {
                id: "RX-205",
                patient: patientProfiles[2]._id,
                doctor: rajDoc._id,
                patientId: patientProfiles[2].id,
                patientName: patientProfiles[2].name,
                doctorName: rajDoc.name,
                medicineName: "Amlodipine 5mg",
                dosage: "Once daily - Morning",
                duration: "3 months",
                date: "2026-05-22",
                refillsTotal: 3,
                refillsUsed: 1,
                status: "Active"
            },
            {
                id: "RX-206",
                patient: patientProfiles[3]._id,
                doctor: nehaDoc._id,
                patientId: patientProfiles[3].id,
                patientName: patientProfiles[3].name,
                doctorName: "Dr. Neha Kapoor",
                medicineName: "Levothyroxine 50mcg",
                dosage: "Once daily - 30 mins before breakfast",
                duration: "3 months",
                date: "2026-05-25",
                refillsTotal: 3,
                refillsUsed: 0,
                status: "Active"
            },
            {
                id: "RX-207",
                patient: patientProfiles[4]._id,
                doctor: sarahDoc._id,
                patientId: patientProfiles[4].id,
                patientName: patientProfiles[4].name,
                doctorName: sarahDoc.name,
                medicineName: "Lisinopril 10mg",
                dosage: "Once daily - Bedtime",
                duration: "6 months",
                date: "2026-05-28",
                refillsTotal: 6,
                refillsUsed: 1,
                status: "Active"
            }
        ]);
        console.log("Seeded prescriptions.");

        console.log("Seeding Lab Reports...");
        await LabReport.create([
            {
                id: "L-301",
                patient: patientProfiles[0]._id,
                patientId: patientProfiles[0].id,
                testName: "Complete Blood Count",
                date: "2026-05-15",
                lab: "CityPath Lab",
                result: "Normal",
                status: "Reviewed"
            },
            {
                id: "L-302",
                patient: patientProfiles[0]._id,
                patientId: patientProfiles[0].id,
                testName: "HbA1c",
                date: "2026-05-15",
                lab: "CityPath Lab",
                result: "6.8% – Borderline",
                status: "Action Required"
            },
            {
                id: "L-303",
                patient: patientProfiles[0]._id,
                patientId: patientProfiles[0].id,
                testName: "Lipid Panel",
                date: "2026-05-15",
                lab: "CityPath Lab",
                result: "Normal",
                status: "Reviewed"
            },
            {
                id: "L-304",
                patient: patientProfiles[1]._id,
                patientId: patientProfiles[1].id,
                testName: "Pulmonary Function Test",
                date: "2026-05-20",
                lab: "CityPath Lab",
                result: "Mild Obstructive Pattern",
                status: "Action Required"
            },
            {
                id: "L-305",
                patient: patientProfiles[2]._id,
                patientId: patientProfiles[2].id,
                testName: "HbA1c",
                date: "2026-05-22",
                lab: "Apollo Diagnostics",
                result: "7.2% – High",
                status: "Action Required"
            },
            {
                id: "L-306",
                patient: patientProfiles[3]._id,
                patientId: patientProfiles[3].id,
                testName: "Thyroid Profile (TSH)",
                date: "2026-05-25",
                lab: "CityPath Lab",
                result: "Normal (TSH: 2.1 mIU/L)",
                status: "Reviewed"
            },
            {
                id: "L-307",
                patient: patientProfiles[4]._id,
                patientId: patientProfiles[4].id,
                testName: "Serum Creatinine",
                date: "2026-05-28",
                lab: "Star Diagnostics",
                result: "1.8 mg/dL – Elevated",
                status: "Action Required"
            }
        ]);
        console.log("Seeded lab reports.");

        console.log("Seeding Activity Logs...");
        await ActivityLog.create([
            { time: "10:32:18", user: "Dr. Shreya Joshi", action: "Started video consultation with P-10421", ip: "192.168.1.42", status: "Success" },
            { time: "10:29:44", user: "Aarav Mehta", action: "Logged in to patient portal", ip: "203.90.1.18", status: "Success" },
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

        console.log("In-memory database seeded successfully!");
    } catch (error) {
        console.error("In-memory database seeding failed:", error);
        throw error;
    }
};
