import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["info", "success", "danger", "warning"],
        default: "info"
    },
    read: {
        type: Boolean,
        default: false
    },
    page: {
        type: String,
        default: "pAppointments"
    }
}, {
    timestamps: true
});

export default mongoose.model("Notification", notificationSchema);
