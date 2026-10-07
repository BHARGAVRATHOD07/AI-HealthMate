const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const PasswordResetOtp = require("../models/PasswordResetOtp");
const { getSmtpConfig, sendPasswordResetOtp } = require("../utils/emailService");

const PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_RESEND_COOLDOWN_MS = 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;

const hashPasswordResetOtp = (email, code) => crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`${email}:${code}`)
    .digest("hex");

const genericResetRequestMessage = "If an account exists for that email, a verification code has been sent.";

const requestPasswordReset = async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid email address."
        });
    }

    try {
        getSmtpConfig();
    } catch (error) {
        return res.status(503).json({
            success: false,
            message: error.code === "SMTP_NOT_CONFIGURED"
                ? "Email delivery is not configured. Add the SMTP settings to the server environment."
                : error.message
        });
    }

    try {
        const user = await User.findOne({ email }).select("_id");
        if (!user) {
            return res.status(200).json({ success: true, message: genericResetRequestMessage });
        }

        const now = new Date();
        const existingRequest = await PasswordResetOtp.findOne({ email });
        if (existingRequest && now.getTime() - existingRequest.lastSentAt.getTime() < PASSWORD_RESET_RESEND_COOLDOWN_MS) {
            return res.status(200).json({ success: true, message: genericResetRequestMessage });
        }

        const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
        const request = await PasswordResetOtp.findOneAndUpdate(
            { email },
            {
                $set: {
                    codeHash: hashPasswordResetOtp(email, code),
                    attempts: 0,
                    expiresAt: new Date(now.getTime() + PASSWORD_RESET_OTP_TTL_MS),
                    lastSentAt: now
                }
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );

        try {
            await sendPasswordResetOtp(email, code);
        } catch (error) {
            await PasswordResetOtp.deleteOne({ _id: request._id });
            console.error("Password reset email delivery failed:", error.message);
            return res.status(502).json({
                success: false,
                message: "Could not send the verification email. Check the SMTP configuration and try again."
            });
        }

        return res.status(200).json({ success: true, message: genericResetRequestMessage });
    } catch (error) {
        console.error("Password reset request failed:", error.message);
        return res.status(500).json({
            success: false,
            message: "Could not start password recovery. Please try again."
        });
    }
};

const resetPasswordWithOtp = async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code)) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid email address and six-digit verification code."
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters."
        });
    }

    try {
        const now = new Date();
        const otp = await PasswordResetOtp.findOneAndUpdate(
            { email, expiresAt: { $gt: now }, attempts: { $lt: PASSWORD_RESET_MAX_ATTEMPTS } },
            { $inc: { attempts: 1 } },
            { new: true }
        );

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "The verification code is invalid or expired. Request a new code and try again."
            });
        }

        const submittedHash = Buffer.from(hashPasswordResetOtp(email, code), "hex");
        const storedHash = Buffer.from(otp.codeHash, "hex");
        if (submittedHash.length !== storedHash.length || !crypto.timingSafeEqual(submittedHash, storedHash)) {
            return res.status(400).json({
                success: false,
                message: "The verification code is invalid or expired. Request a new code and try again."
            });
        }

        const consumed = await PasswordResetOtp.deleteOne({
            _id: otp._id,
            codeHash: otp.codeHash,
            attempts: otp.attempts
        });
        if (consumed.deletedCount !== 1) {
            return res.status(400).json({
                success: false,
                message: "The verification code is invalid or expired. Request a new code and try again."
            });
        }

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "The verification code is invalid or expired. Request a new code and try again."
            });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Your password has been reset. You can now log in."
        });
    } catch (error) {
        console.error("Password reset failed:", error.message);
        return res.status(500).json({
            success: false,
            message: "Could not reset the password. Please try again."
        });
    }
};

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

module.exports = {
    register,
    login,
    getMe,
    updateMe,
    changePassword,
    requestPasswordReset,
    resetPasswordWithOtp
};
