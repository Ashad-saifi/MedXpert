import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import ActivityLog from "../models/ActivityLog.js";

const addLog = async (user, action, status = "Success", ip = "127.0.0.1") => {
    const time = new Date().toTimeString().split(' ')[0];
    await ActivityLog.create({ time, user, action, ip, status });
};

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({});
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Book a new appointment
// @route   POST /api/appointments/book
// @access  Private
const bookAppointment = async (req, res) => {
    try {
        const { doctorId, patientId, dateTime, type, reason } = req.body;

        // Find doctor
        const doctor = await Doctor.findOne({
            $or: [
                { id: doctorId },
                { name: { $regex: doctorId, $options: "i" } }
            ]
        });

        // Find patient
        const patient = await Patient.findOne({
            $or: [
                { id: patientId || "P-10421" },
                { id: "P-10421" } // fallback
            ]
        });

        if (!doctor) {
            return res.status(400).json({ error: "Invalid doctor selected" });
        }

        if (!patient) {
            return res.status(400).json({ error: "Invalid patient profile" });
        }

        const count = await Appointment.countDocuments();
        const nextId = `A-${500 + count + 1}`;

        const appointment = await Appointment.create({
            id: nextId,
            patient: patient._id,
            doctor: doctor._id,
            patientId: patient.id,
            doctorId: doctor.id,
            patientName: patient.name,
            doctorName: doctor.name,
            date: dateTime ? dateTime.split("T")[0] : new Date().toISOString().split("T")[0],
            time: dateTime ? new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "10:00 AM",
            type: type || "Video Consultation",
            status: "Confirmed",
            reason: reason || "General Consult"
        });

        await addLog(patient.name, `Booked appointment with ${doctor.name} (${type || "Video Consultation"})`);

        const allAppointments = await Appointment.find({});
        res.json({ success: true, message: "Appointment booked successfully", appointments: allAppointments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel an appointment
// @route   POST /api/appointments/cancel/:id
// @access  Private
const cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({ id: req.params.id });
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        appointment.status = "Cancelled";
        await appointment.save();

        await addLog(appointment.patientName, `Cancelled appointment with ${appointment.doctorName}`);

        const allAppointments = await Appointment.find({});
        res.json({ success: true, message: "Appointment cancelled successfully", appointments: allAppointments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getAppointments,
    bookAppointment,
    cancelAppointment
};
