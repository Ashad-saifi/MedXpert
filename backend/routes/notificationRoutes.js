import express from "express";
import { getNotifications, markAllRead, clearNotifications } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getNotifications);
router.put("/read-all", markAllRead);
router.delete("/clear", clearNotifications);

export default router;
