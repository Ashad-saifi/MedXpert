import Notification from "../models/Notification.js";

// @desc    Get notifications for user
// @route   GET /api/notifications
// @access  Public (for demo simplicity, query by userId)
export const getNotifications = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "userId query parameter is required" });
        }
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Public
export const markAllRead = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "userId query parameter is required" });
        }
        await Notification.updateMany({ userId, read: false }, { read: true });
        res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Clear all notifications for user
// @route   DELETE /api/notifications/clear
// @access  Public
export const clearNotifications = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "userId query parameter is required" });
        }
        await Notification.deleteMany({ userId });
        res.json({ success: true, message: "All notifications cleared" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
