import express from "express";
import { getReports, uploadReport, downloadAllRecordsPDF } from "../controllers/reportController.js";

const router = express.Router();

// GET all reports
router.get("/", getReports);

// POST upload new lab report
router.post("/upload", uploadReport);

// GET download comprehensive EHR PDF
router.get("/download-all/:id", downloadAllRecordsPDF);

export default router;

