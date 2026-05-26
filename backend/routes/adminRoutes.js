import express from "express";
import { getAdminLogsAndStats, updateSettings, suspendUser, addUser } from "../controllers/adminController.js";

const router = express.Router();

// GET settings, logs and statistics
router.get("/logs", getAdminLogsAndStats);

// PUT save settings
router.put("/settings", updateSettings);

// POST suspend user
router.post("/users/suspend/:id", suspendUser);

// POST add new user
router.post("/users/add", addUser);

export default router;
