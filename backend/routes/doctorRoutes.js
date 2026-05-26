import express from "express";
import { getDoctors, approveDoctor, rejectDoctor } from "../controllers/doctorController.js";

const router = express.Router();

// GET all doctors
router.get("/", getDoctors);

// Approve a doctor's credentials
router.post("/approve/:id", approveDoctor);

// Reject a doctor's credentials
router.post("/reject/:id", rejectDoctor);

export default router;
