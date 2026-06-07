import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    profileImage: {
  type: String,
  default: "/images/default-avatar.png"
},
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["patient", "doctor", "admin"],
        default: "patient"
    },

    phone: {
        type: String
    }
});

export default mongoose.model("User", userSchema);