import Doctor from "../models/Doctor.js";
import ActivityLog from "../models/ActivityLog.js";

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
        await Doctor.deleteOne({ id: req.params.id });

        await addLog("Admin", `Rejected doctor application ID: ${req.params.id}`);

        const allDoctors = await Doctor.find({});
        res.json({ success: true, message: "Doctor application rejected", doctors: allDoctors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getDoctors,
    approveDoctor,
    rejectDoctor
};