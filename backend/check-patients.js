import connectDB from "./config/db.js";
import Patient from "./models/Patient.js";

connectDB()
    .then(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const count = await Patient.countDocuments({});
        console.log("Total patients in database:", count);
        if (count > 0) {
            const patients = await Patient.find({}).select("id name email user");
            console.log("Patients present in DB:", patients);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error("Failed:", err);
        process.exit(1);
    });
