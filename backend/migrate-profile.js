import connectDB from "./config/db.js";
import User from "./models/User.js";
import Patient from "./models/Patient.js";

const run = async () => {
    try {
        await connectDB();
        console.log("Connected to MongoDB for profile migration...");

        const oldEmail = "aarav@email.com";
        const newEmail = "ashad@email.com";
        const newName = "Ashad saifi";

        // Find Aarav user
        const user = await User.findOne({ email: oldEmail });
        if (user) {
            user.name = newName;
            user.email = newEmail;
            await user.save();
            console.log("Updated user table: email set to", newEmail, "and name set to", newName);

            // Find associated patient profile
            const patient = await Patient.findOne({ user: user._id });
            if (patient) {
                patient.name = newName;
                patient.email = newEmail;
                await patient.save();
                console.log("Updated patients table: email set to", newEmail, "and name set to", newName);
            }
        } else {
            console.log("User aarav@email.com not found. Checking if ashad@email.com already exists...");
            const ashadUser = await User.findOne({ email: newEmail });
            if (ashadUser) {
                console.log("ashad@email.com already exists in user table.");
            } else {
                console.log("Neither aarav@email.com nor ashad@email.com found. Seeding new profile...");
                // Create user and patient
                const newUser = await User.create({
                    name: newName,
                    email: newEmail,
                    password: "$2a$10$tMhPq3L4nJbM1iB5L6L6XeMhPq3L4nJbM1iB5L6L6XeMhPq3L4nJbM", // hashed password123
                    role: "patient",
                    phone: "0136547892"
                });
                await Patient.create({
                    id: "P-10421",
                    user: newUser._id,
                    name: newName,
                    email: newEmail,
                    age: 29,
                    gender: "Male",
                    bloodType: "O+",
                    height: "175 cm",
                    weight: "70 kg",
                    chronicConditions: "None",
                    conditions: "None",
                    allergies: "None",
                    city: "delhi",
                    emergencyContact: {
                        name: "Uma",
                        relation: "Spouse",
                        phone: "1234567890"
                    },
                    insurance: {
                        provider: "StarHealth",
                        policyNo: "SH-204881",
                        validUntil: "2028-12-31"
                    }
                });
                console.log("Seeded default patient: Ashad saifi (ashad@email.com)");
            }
        }

        console.log("Profile migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

run();
