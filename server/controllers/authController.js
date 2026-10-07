const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── Helper: Generate a signed JWT ────────────────────────────────────────────
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
};

const serializeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: "patient",
    createdAt: user.createdAt,
    healthProfile: user.healthProfile
});

// ─── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            token,
            data: serializeUser(user)
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Registration failed. Please try again.",
            error: error.message
        });
    }
};

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // Find user and explicitly include password field (it's normally excluded)
        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            data: serializeUser(user)
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Login failed. Please try again.",
            error: error.message
        });
    }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Protected route — returns current authenticated user's profile
const getMe = async (req, res) => {
    try {
        // req.user is attached by the protect middleware
        res.status(200).json({
            success: true,
            data: serializeUser(req.user)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not retrieve user profile.",
            error: error.message
        });
    }
};

const updateMe = async (req, res) => {
    try {
        const body = req.body || {};
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

        if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "A valid name and email are required."
            });
        }

        const existingUser = await User.findOne({
            email,
            _id: { $ne: req.user._id }
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const updates = { name, email };
        const profileFields = [
            "dateOfBirth", "gender", "phone", "address", "height", "weight",
            "bloodGroup", "allergies", "existingConditions", "emergencyName",
            "emergencyRelation", "emergencyPhone"
        ];

        if (body.healthProfile !== undefined) {
            if (!body.healthProfile || typeof body.healthProfile !== "object" || Array.isArray(body.healthProfile)) {
                return res.status(400).json({
                    success: false,
                    message: "Health profile must be an object."
                });
            }

            for (const field of profileFields) {
                if (Object.prototype.hasOwnProperty.call(body.healthProfile, field)) {
                    if (typeof body.healthProfile[field] !== "string") {
                        return res.status(400).json({
                            success: false,
                            message: `Health profile field "${field}" must be text.`
                        });
                    }
                    updates[`healthProfile.${field}`] = body.healthProfile[field].trim();
                }
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: serializeUser(user)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not update profile.",
            error: error.message
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current and new passwords are required."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters."
            });
        }

        const user = await User.findById(req.user._id).select("+password");
        const passwordMatches = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not change password.",
            error: error.message
        });
    }
};

module.exports = { register, login, getMe, updateMe, changePassword };
