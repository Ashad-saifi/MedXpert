import express from "express";
import { 
    getAllPatients, 
    getPatientById, 
    addPatient,
    updatePatientProfile, 
    updateClinicalNotes,
    deletePatient
} from "../controllers/patientController.js";

const router = express.Router();

// GET all patients
router.get("/", getAllPatients);

// GET patient by string ID
router.get("/:id", getPatientById);

// POST add new patient
router.post("/", addPatient);

// PUT update patient profile
router.put("/:id/profile", updatePatientProfile);

// PUT update clinical notes
router.put("/:id/clinical-notes", updateClinicalNotes);

// DELETE patient profile
router.delete("/:id", deletePatient);

export default router;
