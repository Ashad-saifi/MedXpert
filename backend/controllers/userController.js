import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
            const count = await Doctor.countDocuments();
            const nextDocId = `D-${100 + count + 1}`;

            await Doctor.create({
                id: nextDocId,
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
            const count = await Patient.countDocuments();
            const nextPatId = `P-${10000 + count + 1}`;

            await Patient.create({
                id: nextPatId,
                user: user._id,
                name: user.name,
                email: user.email,
                age: additionalFields.age || 0,
                gender: additionalFields.gender || "Not Specified",
                bloodType: additionalFields.bloodType || "Not Specified",
                height: additionalFields.height || "Not Specified",
                weight: additionalFields.weight || "Not Specified",
                chronicConditions: additionalFields.chronicConditions || "None",
                conditions: additionalFields.chronicConditions || "None",
                allergies: additionalFields.allergies || "None",
                emergencyContact: additionalFields.emergencyContact || {
                    name: "Not Specified",
                    relation: "Not Specified",
                    phone: "Not Specified"
                },
                insurance: additionalFields.insurance || {
                    provider: "Not Specified",
                    policyNo: "Not Specified",
                    validUntil: "Not Specified"
                }
            });
        }

        let profile = null;
        if (user.role === "doctor") {
            profile = await Doctor.findOne({ user: user._id });
        } else if (user.role === "patient") {
            profile = await Patient.findOne({ user: user._id });
        }

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            },
            profile,
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
            let profile = null;
            if (user.role === "doctor") {
                profile = await Doctor.findOne({ user: user._id });
            } else if (user.role === "patient") {
                profile = await Patient.findOne({ user: user._id });
            }

            res.json({
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone
                },
                profile,
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

/**
 * @desc    Update user details
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;

            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();

            // Find and update associated role profile
            let profile = null;
            if (updatedUser.role === "doctor") {
                profile = await Doctor.findOneAndUpdate(
                    { user: updatedUser._id },
                    { name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone },
                    { new: true }
                );
            } else if (updatedUser.role === "patient") {
                profile = await Patient.findOneAndUpdate(
                    { user: updatedUser._id },
                    { name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone },
                    { new: true }
                );
            }

            res.json({
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    phone: updatedUser.phone
                },
                profile,
                token: generateToken(updatedUser._id)
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Update User Profile Error:", error);
        res.status(500).json({ message: error.message });
    }
};

export {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile
};
