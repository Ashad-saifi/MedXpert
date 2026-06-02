import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config({ path: "./.env" });

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/medxpert";
console.log("Connecting to:", uri);

mongoose.connect(uri)
    .then(async () => {
        console.log("Connected successfully!");
        const count = await User.countDocuments({});
        console.log("Total users in database:", count);
        if (count > 0) {
            const users = await User.find({}).select("name email role");
            console.log("Users present in DB:", users);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error("Connection failed:", err.message);
        process.exit(1);
    });
