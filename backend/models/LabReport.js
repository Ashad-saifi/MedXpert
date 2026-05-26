import mongoose from "mongoose";

const labReportSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },
    patientId: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true,
        unique: true
    },
    testName: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    lab: {
        type: String,
        required: true
    },
    result: {
        type: String,
        default: "Normal"
    },
    status: {
        type: String,
        enum: ["Reviewed", "Action Required", "Pending"],
        default: "Reviewed"
    }
}, {
    timestamps: true
});

export default mongoose.model("LabReport", labReportSchema);
