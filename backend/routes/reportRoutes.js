import express from "express";
import { getReports, uploadReport } from "../controllers/reportController.js";

const router = express.Router();

// GET all reports
router.get("/", getReports);

// POST upload new lab report
router.post("/upload", uploadReport);

export default router;
