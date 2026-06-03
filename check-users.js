import connectDB from "./backend/config/db.js";
import User from "./backend/models/User.js";

console.log("Initializing database connection...");

connectDB()
    .then(async () => {
        // Wait a brief moment to ensure async seeding completes if mock DB was activated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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

