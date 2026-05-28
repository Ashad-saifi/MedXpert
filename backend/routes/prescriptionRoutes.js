import express from "express";
import { getPrescriptions, issuePrescription, downloadPrescriptionPDF, verifyPrescriptionSignature } from "../controllers/prescriptionController.js";

const router = express.Router();

// GET all prescriptions
router.get("/", getPrescriptions);

// POST issue new prescriptions
router.post("/issue", issuePrescription);

// GET download signed PDF
router.get("/:id/download", downloadPrescriptionPDF);

// GET verify digital signature
router.get("/verify/:id", verifyPrescriptionSignature);

export default router;
