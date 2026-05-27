import express from "express";
const router = express.Router();
import { registerUser, loginUser, getUserProfile, updateUserProfile } from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";

// Route for User Registration
router.post("/register", registerUser);

// Route for User Login
router.post("/login", loginUser);

// Route to get Current User Profile (Protected)
router.get("/profile", protect, getUserProfile);

// Route to update User Profile (Protected)
router.put("/profile", protect, updateUserProfile);

// Stub for testing routes
router.get("/test", (req, res) => res.json({ message: "Auth routes placeholder" }));

export default router;
