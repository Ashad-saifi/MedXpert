import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema({
    platformName: {
        type: String,
        default: "MedXpert"
    },
    supportEmail: {
        type: String,
        default: "support@medxpert.com"
    },
    defaultDuration: {
        type: String,
        default: "30 minutes"
    },
    maxPatientsPerDay: {
        type: Number,
        default: 20
    },
    twoFAEnabled: {
        type: Boolean,
        default: true
    },
    sessionTimeoutEnabled: {
        type: Boolean,
        default: true
    },
    auditLoggingEnabled: {
        type: Boolean,
        default: true
    },
    e2eEncryptionEnabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model("SystemSetting", systemSettingSchema);
