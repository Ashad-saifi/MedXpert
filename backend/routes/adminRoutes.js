import express from "express";
import { getAdminLogsAndStats, updateSettings, suspendUser, addUser, editUserAdmin } from "../controllers/adminController.js";

const router = express.Router();

// GET settings, logs and statistics
router.get("/logs", getAdminLogsAndStats);

// PUT save settings
router.put("/settings", updateSettings);

// POST suspend user
router.post("/users/suspend/:id", suspendUser);

// POST add new user
router.post("/users/add", addUser);

// PUT edit user details
router.put("/users/edit/:id", editUserAdmin);

export default router;
