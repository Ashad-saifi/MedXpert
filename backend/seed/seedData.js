require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/medxpert";
        console.log(`Connecting to database at ${mongoUri}...`);
        await mongoose.connect(mongoUri);
        console.log("MongoDB Connected for seeding.");

        // Clear existing data
        console.log("Clearing existing collections...");
        await User.deleteMany({});
        await Doctor.deleteMany({});
        await Patient.deleteMany({});
        await Appointment.deleteMany({});
        console.log("Collections cleared successfully.");

        // Hash passwords
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        // 1. Create Users
        console.log("Seeding Users...");
        const users = [
            {
                name: "Alex Smith",
                email: "demo@medxpert.com",
                password: hashedPassword,
                role: "patient",
                phone: "+1 (555) 019-2834"
            },
            {
                name: "Dr. Sarah Johnson",
                email: "doctor@medxpert.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+1 (555) 011-4455"
            },
            {
                name: "Dr. Raj Patel",
                email: "patel@medxpert.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+1 (555) 011-7788"
            },
            {
                name: "Dr. Neha Kim",
                email: "kim@medxpert.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+1 (555) 011-9922"
            },
            {
                name: "Dr. Arun Mehta",
                email: "mehta@medxpert.com",
                password: hashedPassword,
                role: "doctor",
                phone: "+1 (555) 011-1122"
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

        // Find patient & doctor users
        const alexSmithUser = createdUsers.find(u => u.email === "demo@medxpert.com");
        const sarahJohnsonUser = createdUsers.find(u => u.email === "doctor@medxpert.com");
        const rajPatelUser = createdUsers.find(u => u.email === "patel@medxpert.com");
        const nehaKimUser = createdUsers.find(u => u.email === "kim@medxpert.com");
        const arunMehtaUser = createdUsers.find(u => u.email === "mehta@medxpert.com");

        // 2. Create Patient Profile
        console.log("Seeding Patient Profile...");
        const patientProfile = await Patient.create({
            user: alexSmithUser._id,
            name: alexSmithUser.name,
            email: alexSmithUser.email,
            age: 34,
            gender: "Male",
            bloodType: "O+",
            height: "175 cm",
            weight: "72 kg",
            chronicConditions: "Type 2 Diabetes",
            allergies: "Penicillin, Dust",
            emergencyContact: "Emily Smith (Wife) – +1 (555) 019-2834",
            insurance: "BlueShield Health · Policy #BS-991288-A"
        });
        console.log("Seeded patient profile.");

        // 3. Create Doctor Profiles
        console.log("Seeding Doctor Profiles...");
        const doctorProfiles = await Doctor.create([
            {
                user: sarahJohnsonUser._id,
                name: sarahJohnsonUser.name,
                email: sarahJohnsonUser.email,
                specialty: "General Medicine",
                exp: "12 years",
                fee: "₹500",
                license: "MCI-2014-08821",
                hospital: "City Medical Center",
                rating: 4.9,
                status: "Available Today"
            },
            {
                user: rajPatelUser._id,
                name: rajPatelUser.name,
                email: rajPatelUser.email,
                specialty: "Cardiology",
                exp: "18 years",
                fee: "₹800",
                license: "MCI-2008-01124",
                hospital: "Heart Institute",
                rating: 4.8,
                status: "Tomorrow"
            },
            {
                user: nehaKimUser._id,
                name: nehaKimUser.name,
                email: nehaKimUser.email,
                specialty: "Endocrinology",
                exp: "9 years",
                fee: "₹600",
                license: "MCI-2017-09432",
                hospital: "Diabetes Clinic",
                rating: 4.7,
                status: "Available Today"
            },
            {
                user: arunMehtaUser._id,
                name: arunMehtaUser.name,
                email: arunMehtaUser.email,
                specialty: "Neurology",
                exp: "15 years",
                fee: "₹900",
                license: "MCI-2011-04399",
                hospital: "Neuro Center",
                rating: 4.9,
                status: "Mon/Wed/Fri"
            }
        ]);
        console.log(`Seeded ${doctorProfiles.length} doctor profiles.`);

        // Find doctor profile IDs
        const sarahJohnsonProfile = doctorProfiles.find(d => d.email === "doctor@medxpert.com");
        const rajPatelProfile = doctorProfiles.find(d => d.email === "patel@medxpert.com");

        // 4. Create Initial Appointments
        console.log("Seeding Appointments...");
        await Appointment.create([
            {
                patient: patientProfile._id,
                doctor: sarahJohnsonProfile._id,
                patientName: patientProfile.name,
                doctorName: sarahJohnsonProfile.name,
                date: "2026-05-25",
                time: "10:30 AM",
                type: "Video Consultation",
                status: "Confirmed",
                reason: "Routine review of vitals"
            },
            {
                patient: patientProfile._id,
                doctor: rajPatelProfile._id,
                patientName: patientProfile.name,
                doctorName: rajPatelProfile.name,
                date: "2026-06-03",
                time: "02:00 PM",
                type: "In-Clinic",
                status: "Confirmed",
                reason: "Cardio follow-up test"
            }
        ]);
        console.log("Seeded appointments.");

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
