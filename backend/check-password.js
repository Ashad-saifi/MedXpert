import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

connectDB()
    .then(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user = await User.findOne({ email: "testpatient@medxpert.com" });
        if (user) {
            console.log("Found test patient user:", user.email);
            const isMatch = await bcrypt.compare("password123", user.password);
            console.log("Password comparison for 'password123':", isMatch);
        } else {
            console.log("Test patient user not found in DB.");
        }
        process.exit(0);
    })
    .catch(err => {
        console.error("Failed:", err);
        process.exit(1);
    });
