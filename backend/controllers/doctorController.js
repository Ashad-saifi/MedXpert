import Doctor from "../models/Doctor.js";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { broadcastGlobalEvent } from "../server.js";

const addLog = async (user, action, status = "Success", ip = "127.0.0.1") => {
    const time = new Date().toTimeString().split(' ')[0];
    await ActivityLog.create({ time, user, action, ip, status });
};

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({});
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single doctor by string ID or ObjectId
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
    try {
        let doctor = await Doctor.findOne({ id: req.params.id });
        if (!doctor) {
            try {
                doctor = await Doctor.findById(req.params.id);
            } catch (e) {}
        }
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a new doctor
// @route   POST /api/doctors
// @access  Private/Admin
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, specialty, exp, fee, license, hospital, phone, gender } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: "User already exists with this email" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "doctor",
            phone: phone || ""
        });

        const count = await Doctor.countDocuments();
        const nextId = `D-${100 + count + 1}`;

        const doctor = await Doctor.create({
            user: user._id,
            id: nextId,
            name,
            email,
            gender: gender || "Not Specified",
            specialty: specialty || "General Medicine",
            exp: exp || "5 years",
            fee: fee || "₹500",
            license: license || "MCI-APPROVED",
            hospital: hospital || "City Medical Center",
            rating: 4.8,
            status: "Available Today"
        });

        await addLog("Admin", `Added new doctor: ${name}`);

        broadcastGlobalEvent({
            type: 'db-sync',
            entity: 'doctor',
            action: 'create',
            doctorId: doctor.id,
            message: `New doctor added: ${doctor.name}`
        });

        res.status(201).json({ success: true, message: "Doctor added successfully", doctor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/:id
// @access  Private/Admin
const updateDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        await addLog("Admin", `Updated doctor profile for ${doctor.name}`);

        broadcastGlobalEvent({
            type: 'db-sync',
            entity: 'doctor',
            action: 'update',
            doctorId: doctor.id,
            message: `Doctor profile updated: ${doctor.name}`
        });

        res.json({ success: true, message: "Doctor profile updated", doctor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete doctor
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
const deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ id: req.params.id });
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        // Delete from Doctor and User collection
        await User.findByIdAndDelete(doctor.user);
        await Doctor.findByIdAndDelete(doctor._id);

        await addLog("Admin", `Deleted doctor profile for ${doctor.name}`);

        broadcastGlobalEvent({
            type: 'db-sync',
            entity: 'doctor',
            action: 'delete',
            doctorId: req.params.id,
            message: `Doctor profile deleted: ${doctor.name}`
        });

        res.json({ success: true, message: "Doctor profile deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve doctor credentials
// @route   POST /api/doctors/approve/:id
// @access  Private/Admin
const approveDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ id: req.params.id });
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        doctor.status = "Active";
        await doctor.save();

        await addLog("Admin", `Approved doctor credentials for ${doctor.name}`);

        broadcastGlobalEvent({
            type: 'db-sync',
            entity: 'doctor',
            action: 'approve',
            doctorId: doctor.id,
            message: `Doctor credentials approved: ${doctor.name}`
        });

        const allDoctors = await Doctor.find({});
        res.json({ success: true, message: "Doctor approved", doctors: allDoctors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject doctor application
// @route   POST /api/doctors/reject/:id
// @access  Private/Admin
const rejectDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ id: req.params.id });
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        const doctorName = doctor.name;
        if (doctor.user) {
            await User.findByIdAndDelete(doctor.user);
        }
        await Doctor.deleteOne({ id: req.params.id });

        await addLog("Admin", `Rejected doctor application for ${doctorName} (ID: ${req.params.id})`);

        broadcastGlobalEvent({
            type: 'db-sync',
            entity: 'doctor',
            action: 'reject',
            doctorId: req.params.id,
            message: `Doctor application rejected: ${doctorName}`
        });

        const allDoctors = await Doctor.find({});
        res.json({ success: true, message: "Doctor application rejected", doctors: allDoctors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getDoctors,
    getDoctorById,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    approveDoctor,
    rejectDoctor
};