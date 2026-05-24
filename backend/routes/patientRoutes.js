const express = require("express");
const router = express.Router();

// Stubs for Day 3 patient EHR routes
router.get("/test", (req, res) => res.json({ message: "Patient routes placeholder" }));

module.exports = router;
