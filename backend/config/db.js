const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/medxpert");
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.warn(`⚠️  MongoDB Connection Warning: ${error.message}`);
        console.warn(`👉 The backend is running in offline fallback mode. Update backend/.env with your MONGO_URI to connect a live database.`);
    }
};

module.exports = connectDB;
