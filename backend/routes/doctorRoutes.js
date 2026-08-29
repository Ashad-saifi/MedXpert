import express from "express";
import {
    getDoctors,
    getDoctorById,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    approveDoctor,
    rejectDoctor
} from "../controllers/doctorController.js";

const router = express.Router();

// GET all doctors
router.get("/", getDoctors);

// POST add new doctor
router.post("/", addDoctor);

// Approve a doctor's credentials (MUST come before /:id to avoid route collision)
router.post("/approve/:id", approveDoctor);

// Reject a doctor's credentials (MUST come before /:id to avoid route collision)
router.post("/reject/:id", rejectDoctor);

// GET single doctor by string ID or ObjectId
router.get("/:id", getDoctorById);

// PUT update doctor profile
router.put("/:id", updateDoctor);

// DELETE doctor profile
router.delete("/:id", deleteDoctor);

export default router;
