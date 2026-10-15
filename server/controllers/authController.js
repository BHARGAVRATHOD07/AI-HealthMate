const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const PasswordResetOtp = require("../models/PasswordResetOtp");
const { getSmtpConfig, validateEmailConfig, sendPasswordResetOtp } = require("../utils/emailService");
const { logInternalError } = require("../utils/errorLogging");

const PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_RESEND_COOLDOWN_MS = 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;

const getPasswordResetOtpSecret = () => {
    const secret = process.env.PASSWORD_RESET_OTP_SECRET;
    if (typeof secret !== "string" || Buffer.byteLength(secret) < 32) {
        const error = new Error("PASSWORD_RESET_OTP_SECRET is not configured.");
        error.code = "PASSWORD_RESET_SECRET_NOT_CONFIGURED";
        throw error;
    }
    return secret;
};

const hashPasswordResetOtp = (email, code) => crypto
    .createHmac("sha256", getPasswordResetOtpSecret())
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
        validateEmailConfig();
        getPasswordResetOtpSecret();
    } catch (error) {
        return res.status(503).json({
            success: false,
            message: error.code === "PASSWORD_RESET_SECRET_NOT_CONFIGURED"
                ? "Password recovery is not configured correctly."
                : error.code === "SMTP_NOT_CONFIGURED"
                    ? "Email delivery is not configured. Add the SMTP settings to the server environment."
                    : "Email delivery is not configured correctly."
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
            logInternalError("Password reset email delivery", error);
            return res.status(502).json({
                success: false,
                message: "Could not send the verification email. Check the SMTP configuration and try again."
            });
        }

        return res.status(200).json({ success: true, message: genericResetRequestMessage });
    } catch (error) {
        logInternalError("Password reset request", error);
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
        getPasswordResetOtpSecret();
    } catch {
        return res.status(503).json({
            success: false,
            message: "Password recovery is not configured correctly."
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
        logInternalError("Password reset", error);
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

const allowedProfileFields = [
    "dateOfBirth", "gender", "phone", "address", "height", "weight",
    "bloodGroup", "allergies", "existingConditions", "emergencyName",
    "emergencyRelation", "emergencyPhone"
];
const allowedGenders = new Set(["", "Male", "Female", "Other", "Prefer not to say"]);
const allowedBloodGroups = new Set(["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

const validatePhone = (value) => {
    if (!value) return true;
    if (!/^\+?[\d\s().-]+$/.test(value)) return false;
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
};

const validateMeasurement = (value, kind) => {
    if (!value) return true;
    const pattern = kind === "height"
        ? /^(\d{1,3}(?:\.\d{1,2})?)\s*(cm|m|in|ft)?$/i
        : /^(\d{1,3}(?:\.\d{1,2})?)\s*(kg|lbs?)?$/i;
    const match = value.match(pattern);
    if (!match) return false;

    const amount = Number(match[1]);
    const unit = (match[2] || (kind === "height" ? "cm" : "kg")).toLowerCase();
    if (kind === "height") {
        const centimeters = amount * ({ cm: 1, m: 100, in: 2.54, ft: 30.48 }[unit]);
        return centimeters >= 30 && centimeters <= 300;
    }

    const kilograms = amount * (unit === "lb" || unit === "lbs" ? 0.45359237 : 1);
    return kilograms >= 1 && kilograms <= 700;
};

const validateDateOfBirth = (value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return !Number.isNaN(date.getTime())
        && date.toISOString().slice(0, 10) === value
        && value <= today;
};

const validateProfileField = (field, value) => {
    if (field === "dateOfBirth" && !validateDateOfBirth(value)) {
        return "Date of birth must be a valid date that is not in the future.";
    }
    if (field === "gender" && !allowedGenders.has(value)) {
        return "Select a supported gender option.";
    }
    if (field === "bloodGroup" && !allowedBloodGroups.has(value)) {
        return "Select a supported blood group.";
    }
    if ((field === "phone" || field === "emergencyPhone") && !validatePhone(value)) {
        return "Enter a valid phone number with 7 to 15 digits.";
    }
    if (field === "height" && !validateMeasurement(value, field)) {
        return "Enter a valid height between 30 and 300 cm (or equivalent).";
    }
    if (field === "weight" && !validateMeasurement(value, field)) {
        return "Enter a valid weight between 1 and 700 kg (or equivalent).";
    }
    if (field === "emergencyName" && value.length > 100) {
        return "Emergency contact name must be 100 characters or fewer.";
    }
    if (field === "emergencyRelation" && value.length > 80) {
        return "Relationship must be 80 characters or fewer.";
    }
    if (field === "address" && value.length > 300) {
        return "Address must be 300 characters or fewer.";
    }
    if ((field === "allergies" || field === "existingConditions") && value.length > 1000) {
        return "Health notes must be 1000 characters or fewer.";
    }
    return null;
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
            data: serializeUser(user)
        });

    } catch (error) {
        logInternalError("Registration", error);
        res.status(500).json({
            success: false,
            message: "Registration failed. Please try again."
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
        logInternalError("Login", error);
        res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
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
        logInternalError("Get profile", error);
        res.status(500).json({
            success: false,
            message: "Could not retrieve user profile."
        });
    }
};

const updateMe = async (req, res) => {
    try {
        const body = req.body || {};
        const allowedTopLevelFields = new Set(["name", "email", "healthProfile"]);
        if (Object.keys(body).some((field) => !allowedTopLevelFields.has(field))) {
            return res.status(400).json({
                success: false,
                message: "The request contains unsupported profile fields."
            });
        }

        if (body.email !== undefined
            && (typeof body.email !== "string" || body.email.trim().toLowerCase() !== req.user.email.toLowerCase())) {
            return res.status(409).json({
                success: false,
                message: "Email changes are not available from profile settings."
            });
        }

        const updates = {};
        if (body.name !== undefined) {
            if (typeof body.name !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Full name must be text."
                });
            }
            const name = body.name.trim();
            if (!name || name.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Full name is required and must be 100 characters or fewer."
                });
            }
            updates.name = name;
        }

        if (body.healthProfile !== undefined) {
            if (!body.healthProfile || typeof body.healthProfile !== "object" || Array.isArray(body.healthProfile)) {
                return res.status(400).json({
                    success: false,
                    message: "Health profile must be an object."
                });
            }

            if (Object.keys(body.healthProfile).some((field) => !allowedProfileFields.includes(field))) {
                return res.status(400).json({
                    success: false,
                    message: "The health profile contains unsupported fields."
                });
            }

            for (const field of allowedProfileFields) {
                if (Object.prototype.hasOwnProperty.call(body.healthProfile, field)) {
                    if (typeof body.healthProfile[field] !== "string") {
                        return res.status(400).json({
                            success: false,
                            message: `Health profile field "${field}" must be text.`
                        });
                    }
                    const value = body.healthProfile[field].trim();
                    const validationError = validateProfileField(field, value);
                    if (validationError) {
                        return res.status(400).json({
                            success: false,
                            message: validationError
                        });
                    }
                    updates[`healthProfile.${field}`] = value;
                }
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one profile field to update."
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User profile was not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: serializeUser(user)
        });
    } catch (error) {
        logInternalError("Update profile", error);
        res.status(500).json({
            success: false,
            message: "Could not update profile."
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
        logInternalError("Change password", error);
        res.status(500).json({
            success: false,
            message: "Could not change password."
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
