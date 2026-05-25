const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");

// Route for User Registration
router.post("/register", registerUser);

// Route for User Login
router.post("/login", loginUser);

// Route to get Current User Profile (Protected)
router.get("/profile", protect, getUserProfile);

// Stub for testing routes
router.get("/test", (req, res) => res.json({ message: "Auth routes placeholder" }));

module.exports = router;
