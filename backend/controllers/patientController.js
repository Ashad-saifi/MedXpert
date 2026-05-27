import Patient from "../models/Patient.js";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const addLog = async (user, action, status = "Success", ip = "127.0.0.1") => {
    const time = new Date().toTimeString().split(' ')[0];
    await ActivityLog.create({ time, user, action, ip, status });
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
const getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find({});
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get patient profile by string ID
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findOne({ id: req.params.id });
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a new patient
// @route   POST /api/patients
// @access  Private/Admin
const addPatient = async (req, res) => {
    try {
        const { name, email, password, age, gender, bloodType, height, weight, phone, dob, city } = req.body;
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
            role: "patient",
            phone: phone || ""
        });

        const count = await Patient.countDocuments();
        const nextId = `P-${10400 + count + 1}`;

        const patient = await Patient.create({
            user: user._id,
            id: nextId,
            name,
            email,
            age: age || 30,
            gender: gender || "Not Specified",
            bloodType: bloodType || "O+",
            height: height || "175 cm",
            weight: weight || "70 kg",
            chronicConditions: "None",
            allergies: "None",
            phone: phone || "",
            dob: dob || "1996-01-01",
            city: city || "New Delhi",
            emergencyContact: { name: "Jane Smith", relation: "Spouse", phone: phone || "9999999999" },
            insurance: { provider: "HealthCare Corp", policyNo: "POL-99921", validUntil: "2029-12-31" }
        });

        await addLog("Admin", `Added new patient: ${name}`);

        res.status(201).json({ success: true, message: "Patient added successfully", patient });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update patient profile
// @route   PUT /api/patients/:id/profile
// @access  Private
const updatePatientProfile = async (req, res) => {
    try {
        const patient = await Patient.findOne({ id: req.params.id });
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        // Update fields dynamically
        const allowedUpdates = [
            "name", "email", "age", "gender", "bloodType", "height", "weight",
            "chronicConditions", "allergies", "emergencyContact", "insurance",
            "phone", "dob", "city"
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                patient[field] = req.body[field];
            }
        });

        await patient.save();
        await addLog(patient.name, "Updated profile personal details");

        res.json({ success: true, message: "Profile updated successfully", patient });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update clinical notes & chief complaint
// @route   PUT /api/patients/:id/clinical-notes
// @access  Private/Doctor
const updateClinicalNotes = async (req, res) => {
    try {
        const patient = await Patient.findOne({ id: req.params.id });
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        patient.clinicalNotes = req.body.clinicalNotes || "";
        patient.chiefComplaint = req.body.chiefComplaint || "";

        await patient.save();
        await addLog("Dr. Sarah Johnson", `Updated clinical notes for ${patient.name}`);

        res.json({ success: true, message: "Clinical notes updated successfully", patient });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete patient profile
// @route   DELETE /api/patients/:id
// @access  Private/Admin
const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findOne({ id: req.params.id });
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        // Delete from User and Patient collection
        await User.findByIdAndDelete(patient.user);
        await Patient.findByIdAndDelete(patient._id);

        await addLog("Admin", `Deleted patient profile for ${patient.name}`);
        res.json({ success: true, message: "Patient profile deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getAllPatients,
    getPatientById,
    addPatient,
    updatePatientProfile,
    updateClinicalNotes,
    deletePatient
};
