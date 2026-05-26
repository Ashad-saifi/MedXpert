import express from "express";
import { getAppointments, bookAppointment, cancelAppointment } from "../controllers/appointmentController.js";

const router = express.Router();

// GET all appointments
router.get("/", getAppointments);

// POST book new appointment
router.post("/book", bookAppointment);

// POST cancel appointment
router.post("/cancel/:id", cancelAppointment);

export default router;
