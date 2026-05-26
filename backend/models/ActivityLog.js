import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    time: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Success", "Failed"],
        default: "Success"
    }
}, {
    timestamps: true
});

export default mongoose.model("ActivityLog", activityLogSchema);
