import express from "express";
import {
    getAppointments,
    bookAppointment,
    cancelAppointment,
    verifyRoomAccess,
    updateAppointmentStatus,
    getAvailableSlots,
    rescheduleAppointment
} from "../controllers/appointmentController.js";

const router = express.Router();

// GET all appointments
router.get("/", getAppointments);

// GET available slots
router.get("/available-slots", getAvailableSlots);

// POST book new appointment
router.post("/book", bookAppointment);

// POST cancel appointment
router.post("/cancel/:id", cancelAppointment);

// POST reschedule appointment
router.post("/reschedule/:id", rescheduleAppointment);

// POST verify appointment session room lock
router.post("/verify-room", verifyRoomAccess);

// PUT update appointment status
router.put("/:id/status", updateAppointmentStatus);

export default router;
