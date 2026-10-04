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
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: "patient",
                createdAt: user.createdAt
            }
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
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: "patient",
                createdAt: user.createdAt
            }
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
            data: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: "patient",
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not retrieve user profile.",
            error: error.message
        });
    }
};

module.exports = { register, login, getMe };
