import express from "express";
import { getReports, uploadReport, downloadAllRecordsPDF } from "../controllers/reportController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all reports
router.get("/", protect, getReports);

// POST upload new lab report
router.post("/upload", protect, uploadReport);

// GET download comprehensive EHR PDF
router.get("/download-all/:id", downloadAllRecordsPDF);

export default router;

