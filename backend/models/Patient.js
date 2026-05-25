import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
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
        type: String
    },
    insurance: {
        type: String
    }
}, {
    timestamps: true
});

export default mongoose.model("Patient", patientSchema);
