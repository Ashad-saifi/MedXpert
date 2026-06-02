import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import ActivityLog from "../models/ActivityLog.js";

const addLog = async (user, action, status = "Success", ip = "127.0.0.1") => {
    const time = new Date().toTimeString().split(' ')[0];
    await ActivityLog.create({ time, user, action, ip, status });
};

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private
const getPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({});
        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Issue a new prescription
// @route   POST /api/prescriptions/issue
// @access  Private/Doctor
const issuePrescription = async (req, res) => {
    try {
        const { patientId, diagnosis, medicines } = req.body;

        const patient = await Patient.findOne({ id: patientId });
        if (!patient) {
            return res.status(400).json({ error: "Invalid patient selected" });
        }

        // Hardcode active doctor context or find one
        const doctor = await Doctor.findOne({ id: "D-101" }) || await Doctor.findOne({});
        const doctorName = doctor ? doctor.name : "Dr. Shreya Joshi";
        const doctorObjectId = doctor ? doctor._id : null;

        const count = await Prescription.countDocuments();
        let indexOffset = 1;

        const createdPrescriptions = [];
        for (const med of medicines) {
            const nextRxId = `RX-${200 + count + indexOffset}`;
            indexOffset++;

            const prescription = await Prescription.create({
                id: nextRxId,
                patient: patient._id,
                doctor: doctorObjectId,
                patientId: patient.id,
                patientName: patient.name,
                doctorName: doctorName,
                medicineName: med.name,
                dosage: med.dosage || "1 tablet daily",
                duration: req.body.duration || "7 days",
                date: new Date().toISOString().split('T')[0],
                refillsTotal: req.body.duration === '3 months' ? 3 : 1,
                refillsUsed: 0,
                status: "Active"
            });
            createdPrescriptions.push(prescription);
        }

        await addLog(doctorName, `Issued prescription for ${patient.name} - ${diagnosis}`);

        const allPrescriptions = await Prescription.find({});
        res.json({ success: true, message: "Prescription issued and sent to patient", prescriptions: allPrescriptions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getPrescriptions,
    issuePrescription
};
