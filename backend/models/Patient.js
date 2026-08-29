import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    profileImage: {
        type: String,
        default: ""
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    age: {
        type: Number
    },
    gender: {
        type: String
    },
    bloodType: {
        type: String
    },
    height: {
        type: String
    },
    weight: {
        type: String
    },
    chronicConditions: {
        type: String
    },
    allergies: {
        type: String
    },
    emergencyContact: {
        type: mongoose.Schema.Types.Mixed
    },
    insurance: {
        type: mongoose.Schema.Types.Mixed
    },
    conditions: {
        type: String
    },
    phone: {
        type: String
    },
    dob: {
        type: String
    },
    city: {
        type: String
    },
    clinicalNotes: {
        type: String,
        default: ""
    },
    chiefComplaint: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

export default mongoose.model("Patient", patientSchema);
