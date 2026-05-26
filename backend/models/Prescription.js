import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
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
    id: {
        type: String,
        required: true,
        unique: true
    },
    patientName: {
        type: String,
        required: true
    },
    patientId: {
        type: String,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    medicineName: {
        type: String,
        required: true
    },
    dosage: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    refillsTotal: {
        type: Number,
        default: 1
    },
    refillsUsed: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["Active", "Refill Soon", "Expired", "Completed"],
        default: "Active"
    }
}, {
    timestamps: true
});

export default mongoose.model("Prescription", prescriptionSchema);
