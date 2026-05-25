const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Helper
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "super_secret_cryptographic_compliance_jwt_token_key_123!", {
        expiresIn: "30d"
    });
};

/**
 * @desc    Register a new user (patient or doctor)
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, ...additionalFields } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please enter name, email, and password" });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user in User collection
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "patient",
            phone: phone || ""
        });

        // Depending on role, create associated profile
        if (user.role === "doctor") {
            await Doctor.create({
                user: user._id,
                name: user.name,
                email: user.email,
                specialty: additionalFields.specialty || "General Medicine",
                exp: additionalFields.exp || "0 years",
                fee: additionalFields.fee || "₹500",
                license: additionalFields.license || "MCI-PENDING",
                hospital: additionalFields.hospital || "City Medical Center",
                rating: additionalFields.rating || 5.0,
                status: additionalFields.status || "Available Today"
            });
        } else if (user.role === "patient") {
            await Patient.create({
                user: user._id,
                name: user.name,
                email: user.email,
                age: additionalFields.age || 0,
                gender: additionalFields.gender || "Not Specified",
                bloodType: additionalFields.bloodType || "Not Specified",
                height: additionalFields.height || "Not Specified",
                weight: additionalFields.weight || "Not Specified",
                chronicConditions: additionalFields.chronicConditions || "None",
                allergies: additionalFields.allergies || "None",
                emergencyContact: additionalFields.emergencyContact || "None",
                insurance: additionalFields.insurance || "None"
            });
        }

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            },
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error("User Registration Error:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Authenticate a user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please enter email and password" });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone
                },
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("User Login Error:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get user profile details
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        if (user) {
            let profile = null;
            if (user.role === "doctor") {
                profile = await Doctor.findOne({ user: user._id });
            } else if (user.role === "patient") {
                profile = await Patient.findOne({ user: user._id });
            }

            res.json({
                user,
                profile
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Get User Profile Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile
};
