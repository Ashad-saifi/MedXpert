import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import { broadcastGlobalEvent } from "../server.js";

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

        // Escape regex special characters to prevent regex injection crashes
        const escapedDoctorId = doctorId ? String(doctorId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : "";
        const doctor = await Doctor.findOne({
            $or: [
                { id: doctorId },
                { name: { $regex: escapedDoctorId, $options: "i" } }
            ]
        });

        // Find patient
        let patient = null;
        if (patientId) {
            patient = await Patient.findOne({ id: patientId });
        }
        if (!patient) {
            patient = await Patient.findOne({ id: "P-10421" }); // fallback
        }

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
            dateTime: dateTime || new Date().toISOString(),
            type: type || "Video Consultation",
            status: req.body.status || "Pending",
            reason: reason || "General Consult"
        });

        await addLog(patient.name, `Booked appointment with ${doctor.name} (${type || "Video Consultation"})`);

        broadcastGlobalEvent({
            type: 'db-sync',
            entity: 'appointment',
            action: 'create',
            appointmentId: appointment.id,
            message: `New appointment booked: ${appointment.patientName} with ${appointment.doctorName}`
        });

        const allAppointments = await Appointment.find({});
        res.json({ success: true, message: "Appointment booked successfully", appointments: allAppointments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get available slots for a doctor on a specific date
// @route   GET /api/appointments/available-slots
// @access  Private
const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) {
            return res.status(400).json({ error: "Doctor ID and date are required" });
        }

        // Find all appointments for doctor on date (excluding cancelled ones)
        const appointments = await Appointment.find({
            doctorId,
            date,
            status: { $ne: "Cancelled" }
        });

        // Hardcoded standard time slots
        const standardSlots = [
            "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", 
            "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM", 
            "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
        ];

        // Filter out already booked slots
        const bookedTimes = appointments.map(appt => appt.time);
        const availableSlots = standardSlots.filter(slot => !bookedTimes.includes(slot));

        res.json({ success: true, slots: availableSlots });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reschedule an appointment
// @route   POST /api/appointments/reschedule/:id
// @access  Private
const rescheduleAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { dateTime, rescheduledBy } = req.body;

        if (!dateTime) {
            return res.status(400).json({ error: "New date and time are required" });
        }

        const appointment = await Appointment.findOne({ id });
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        const date = dateTime.split("T")[0];
        const time = new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        appointment.date = date;
        appointment.time = time;
        appointment.dateTime = dateTime;
        
        // If patient rescheduled, status becomes Pending (needs doctor approval). If doctor/admin rescheduled, it remains Confirmed or becomes Confirmed.
        if (rescheduledBy === "patient") {
            appointment.status = "Pending";
        } else {
            appointment.status = "Confirmed";
        }

        await appointment.save();

        const logMsg = `Rescheduled appointment slot ID: ${appointment.id} to ${date} at ${time}`;
        await addLog(appointment.patientName, logMsg);

        // Save Notification in database
        const docName = appointment.doctorName.startsWith('Dr.') ? appointment.doctorName : `Dr. ${appointment.doctorName}`;
        const statusLabel = rescheduledBy === "patient" ? 'pending doctor approval' : 'confirmed';
        await Notification.create({
            userId: appointment.patientId,
            text: `Your appointment with ${docName} has been rescheduled and is now ${statusLabel}.`,
            type: 'info',
            page: 'pAppointments',
            read: false
        });

        broadcastGlobalEvent({
            type: 'db-sync',
            entity: 'appointment',
            action: 'update',
            appointmentId: appointment.id,
            message: `Appointment ${appointment.id} rescheduled by ${rescheduledBy || 'user'}`
        });

        const allAppointments = await Appointment.find({});
        res.json({ success: true, message: "Appointment rescheduled successfully", appointments: allAppointments });
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

        // Save Notification in database
        const docName = appointment.doctorName.startsWith('Dr.') ? appointment.doctorName : `Dr. ${appointment.doctorName}`;
        await Notification.create({
            userId: appointment.patientId,
            text: `Your appointment with ${docName} has been cancelled.`,
            type: 'warning',
            page: 'pAppointments',
            read: false
        });

        broadcastGlobalEvent({
            type: 'db-sync',
            entity: 'appointment',
            action: 'cancel',
            appointmentId: appointment.id,
            message: `Appointment cancelled: ${appointment.patientName} (${appointment.id})`
        });

        const allAppointments = await Appointment.find({});
        res.json({ success: true, message: "Appointment cancelled successfully", appointments: allAppointments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

import { activeCallSessions } from "../server.js";

// @desc    Verify if patient/doctor has a valid slot for signaling token
// @route   POST /api/appointments/verify-room
// @access  Private
const verifyRoomAccess = async (req, res) => {
    try {
        const { appointmentId, userId, role } = req.body;
        if (!appointmentId || !userId || !role) {
            return res.status(400).json({ error: "Missing required verification fields (appointmentId, userId, role)" });
        }

        // 1. Doctors have provider privileges to start the consultation room at any time
        if (role === 'doctor') {
            return res.json({
                success: true,
                token: `token_webrtc_${appointmentId}_${userId}_${Date.now()}`,
                message: "Doctor verified. Video consultation session initiated."
            });
        }

        // 2. For patients: Check if doctor has already initiated / opened this room
        const hasActiveDoctorSession = activeCallSessions && (
            activeCallSessions.has(appointmentId) || 
            activeCallSessions.has(appointmentId.replace('room-', '')) ||
            activeCallSessions.has(`room-${appointmentId}`)
        );

        if (hasActiveDoctorSession) {
            return res.json({
                success: true,
                token: `token_webrtc_${appointmentId}_${userId}_${Date.now()}`,
                message: "Doctor has initiated the consultation. Joining call now."
            });
        }

        // 3. Find the appointment in database
        let appt = await Appointment.findOne({ id: appointmentId });
        if (!appt) {
            // Check by patientId if available
            appt = await Appointment.findOne({ 
                $or: [{ id: appointmentId }, { patientId: userId }],
                type: { $in: ["Video", "Video Consultation"] },
                status: "Confirmed"
            }).sort({ dateTime: 1 });
        }

        if (appt) {
            if (appt.status === "Cancelled") {
                return res.status(403).json({
                    error: "This appointment was cancelled. Please book a new consultation.",
                    notAllowedEarly: true
                });
            }

            if (appt.status === "Completed") {
                return res.status(403).json({
                    error: "This consultation has already been completed.",
                    notAllowedEarly: true
                });
            }

            // Parse scheduled appointment datetime
            let scheduledDate = null;
            if (appt.dateTime) {
                scheduledDate = new Date(appt.dateTime);
            } else if (appt.date && appt.time) {
                scheduledDate = new Date(`${appt.date} ${appt.time}`);
            }

            if (scheduledDate && !isNaN(scheduledDate.getTime())) {
                const now = Date.now();
                const scheduledTime = scheduledDate.getTime();
                const diffMinutes = (scheduledTime - now) / (1000 * 60);

                // If appointment is more than 15 minutes in the future
                if (diffMinutes > 15) {
                    const formattedTime = scheduledDate.toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    return res.status(403).json({
                        error: `Cannot start video call before scheduled time. Your appointment with ${appt.doctorName || 'the doctor'} is scheduled for ${formattedTime}. Please wait for your slot or wait for the doctor to initiate the call.`,
                        notAllowedEarly: true,
                        scheduledTime: appt.dateTime || appt.date
                    });
                }

                // If appointment was more than 24 hours ago
                if (diffMinutes < -1440) {
                    return res.status(403).json({
                        error: "This appointment slot has passed. Please schedule a new video consultation.",
                        notAllowedEarly: true
                    });
                }
            }
        }

        // Permit access if within valid time window
        res.json({
            success: true,
            token: `token_webrtc_${appointmentId}_${userId}_${Date.now()}`,
            message: "Appointment room session verified and access granted."
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = async (req, res) => {
    try {
        let { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: "Status field is required" });
        }

        // Map "Approved" to "Confirmed" if passed from legacy client
        if (status === "Approved") {
            status = "Confirmed";
        }

        const validStatuses = ["Confirmed", "Pending", "Cancelled", "Completed"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }

        const appt = await Appointment.findOneAndUpdate(
            { id: req.params.id },
            { status },
            { new: true }
        );

        if (!appt) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        await addLog(appt.patientName, `Updated appointment slot ID: ${appt.id} status to: ${status}`);

        // Save notification in database for patient
        const docName = appt.doctorName.startsWith('Dr.') ? appt.doctorName : `Dr. ${appt.doctorName}`;
        if (status === 'Confirmed') {
            await Notification.create({
                userId: appt.patientId,
                text: `Your appointment with ${docName} on ${appt.date} at ${appt.time} has been confirmed.`,
                type: 'success',
                page: 'pAppointments',
                read: false
            });
        } else if (status === 'Cancelled') {
            await Notification.create({
                userId: appt.patientId,
                text: `Your appointment request with ${docName} has been rejected/cancelled.`,
                type: 'danger',
                page: 'pAppointments',
                read: false
            });
        }

        broadcastGlobalEvent({
            type: 'db-sync',
            entity: 'appointment',
            action: 'update',
            appointmentId: appt.id,
            message: `Appointment ${appt.id} status updated to: ${status}`
        });

        const allAppointments = await Appointment.find({});
        res.json({ success: true, message: `Appointment status updated to ${status}`, appointments: allAppointments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getAppointments,
    bookAppointment,
    cancelAppointment,
    verifyRoomAccess,
    updateAppointmentStatus,
    getAvailableSlots,
    rescheduleAppointment
};
