import connectDB from "./config/db.js";
import User from "./models/User.js";
import Patient from "./models/Patient.js";
import Doctor from "./models/Doctor.js";

connectDB()
    .then(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const emails = ["testpatient@medxpert.com", "testdoctor@medxpert.com"];
        
        for (const email of emails) {
            const user = await User.findOne({ email });
            if (user) {
                console.log("Deleting user:", user.email);
                await Patient.deleteMany({ user: user._id });
                await Doctor.deleteMany({ user: user._id });
                await User.deleteOne({ _id: user._id });
            }
        }
        
        console.log("Cleanup completed!");
        process.exit(0);
    })
    .catch(err => {
        console.error("Failed:", err);
        process.exit(1);
    });
