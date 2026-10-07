const mongoose = require("mongoose");

const passwordResetOtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    codeHash: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 0
    },
    lastSentAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("PasswordResetOtp", passwordResetOtpSchema);
