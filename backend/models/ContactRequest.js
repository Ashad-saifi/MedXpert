import mongoose from "mongoose";

const contactRequestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    specialty: {
        type: String,
        required: true
    },
    message: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: "Pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const ContactRequest = mongoose.model("ContactRequest", contactRequestSchema);
export default ContactRequest;
