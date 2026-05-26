import Patient from "../models/Patient.js";
import ActivityLog from "../models/ActivityLog.js";

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

export {
    getAllPatients,
    getPatientById,
    updatePatientProfile,
    updateClinicalNotes
};
