import ContactRequest from "../models/ContactRequest.js";
import ActivityLog from "../models/ActivityLog.js";
import { broadcastGlobalEvent } from "../server.js";

const addLog = async (user, action, status = "Success", ip = "127.0.0.1") => {
    const time = new Date().toTimeString().split(' ')[0];
    await ActivityLog.create({ time, user, action, ip, status });
};

// @desc    Submit a new contact/booking request
// @route   POST /api/contact
// @access  Public
export const submitContactRequest = async (req, res) => {
    try {
        const { name, email, phone, specialty, message } = req.body;

        if (!name || !email || !phone || !specialty) {
            return res.status(400).json({ error: "Missing required fields (name, email, phone, specialty)" });
        }

        const newRequest = await ContactRequest.create({
            name,
            email,
            phone,
            specialty,
            message: message || ""
        });

        await addLog("Visitor", `Submitted contact/booking request: ${name} (${specialty})`);

        broadcastGlobalEvent({
            type: 'db-sync',
            entity: 'contact',
            action: 'create',
            message: `New booking inquiry from ${name} (${specialty})`
        });

        res.status(201).json({ success: true, message: "Request received successfully", data: newRequest });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all contact/booking requests (for admin)
// @route   GET /api/contact
// @access  Private/Admin
export const getContactRequests = async (req, res) => {
    try {
        const requests = await ContactRequest.find({}).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
