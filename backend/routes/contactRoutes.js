import express from "express";
import { submitContactRequest, getContactRequests } from "../controllers/contactController.js";

const router = express.Router();

// Public route to submit contact/booking request
router.post("/", submitContactRequest);

// Route to get all contact requests
router.get("/", getContactRequests);

export default router;
