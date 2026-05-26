import express from "express";
import { getPrescriptions, issuePrescription } from "../controllers/prescriptionController.js";

const router = express.Router();

// GET all prescriptions
router.get("/", getPrescriptions);

// POST issue new prescriptions
router.post("/issue", issuePrescription);

export default router;
