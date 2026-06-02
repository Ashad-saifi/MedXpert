import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    patientId: {
        type: String,
        required: true
    },
    doctorId: {
        type: String,
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    dateTime: {
        type: String
    },
    type: {
        type: String,
        enum: ["Video", "Video Consultation", "In-Clinic"],
        default: "Video"
    },
    status: {
        type: String,
        enum: ["Confirmed", "Pending", "Cancelled", "Completed"],
        default: "Confirmed"
    },
    reason: {
        type: String
    }
}, {
    timestamps: true
});

export default mongoose.model("Appointment", appointmentSchema);
