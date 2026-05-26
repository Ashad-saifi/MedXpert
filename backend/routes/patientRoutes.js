import express from "express";
import { getAllPatients, getPatientById, updatePatientProfile, updateClinicalNotes } from "../controllers/patientController.js";

const router = express.Router();

// GET all patients
router.get("/", getAllPatients);

// GET patient by string ID
router.get("/:id", getPatientById);

// PUT update patient profile
router.put("/:id/profile", updatePatientProfile);

// PUT update clinical notes
router.put("/:id/clinical-notes", updateClinicalNotes);

export default router;
