import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
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
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    specialty: {
        type: String,
        required: true
    },
    exp: {
        type: String,
        required: true
    },
    fee: {
        type: String,
        required: true
    },
    license: {
        type: String,
        required: true
    },
    hospital: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 5.0
    },
    status: {
        type: String,
        default: "Active"
    },
    availability: {
        type: String,
        default: "Available Today"
    },
    degree: {
        type: String,
        default: "MBBS, MD"
    },
    consultationsCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export default mongoose.model("Doctor", doctorSchema);
