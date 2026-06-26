import connectDB from "./config/db.js";
import Appointment from "./models/Appointment.js";
import Notification from "./models/Notification.js";

connectDB()
    .then(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const appts = await Appointment.find({});
        console.log("Appointments in DB:", appts);
        
        const notifications = await Notification.find({});
        console.log("Notifications in DB:", notifications);
        
        process.exit(0);
    })
    .catch(err => {
        console.error("Connection failed:", err.message);
        process.exit(1);
    });
