const express = require("express");
const router = express.Router();

// Stubs for Day 2 authentication routes
router.get("/test", (req, res) => res.json({ message: "Auth routes placeholder" }));

module.exports = router;
