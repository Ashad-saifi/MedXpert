import express from "express";
import { getPrescriptions, issuePrescription, downloadPrescriptionPDF, verifyPrescriptionSignature } from "../controllers/prescriptionController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all prescriptions
router.get("/", protect, getPrescriptions);

// POST issue new prescriptions
router.post("/issue", protect, issuePrescription);

// GET download signed PDF
router.get("/:id/download", downloadPrescriptionPDF);

// GET verify digital signature
router.get("/verify/:id", verifyPrescriptionSignature);

export default router;
