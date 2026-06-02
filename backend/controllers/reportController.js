import LabReport from "../models/LabReport.js";
import Patient from "../models/Patient.js";
import ActivityLog from "../models/ActivityLog.js";

const addLog = async (user, action, status = "Success", ip = "127.0.0.1") => {
    const time = new Date().toTimeString().split(' ')[0];
    await ActivityLog.create({ time, user, action, ip, status });
};

// @desc    Get all lab reports
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
    try {
        const reports = await LabReport.find({});
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload lab report
// @route   POST /api/reports/upload
// @access  Private
const uploadReport = async (req, res) => {
    try {
        const { testName, patientId, lab } = req.body;

        const patient = await Patient.findOne({ id: patientId || "P-10421" });
        const patientObjectId = patient ? patient._id : null;
        const finalPatientId = patient ? patient.id : "P-10421";
        const patientName = patient ? patient.name : "Aarav Mehta";

        const count = await LabReport.countDocuments();
        const nextId = `L-${300 + count + 1}`;

        const report = await LabReport.create({
            id: nextId,
            patient: patientObjectId,
            patientId: finalPatientId,
            testName: testName || "Blood Test",
            date: new Date().toISOString().split('T')[0],
            lab: lab || "CityPath Lab",
            result: "Normal",
            status: "Reviewed"
        });

        await addLog(patientName, `Uploaded lab report: ${testName || "Blood Test"}`);

        const allReports = await LabReport.find({});
        res.json({ success: true, message: "Report uploaded successfully", labReports: allReports });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getReports,
    uploadReport
};
