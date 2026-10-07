const express = require("express");
const rateLimit = require("express-rate-limit");
const {
    register,
    login,
    getMe,
    updateMe,
    changePassword,
    requestPasswordReset,
    resetPasswordWithOtp
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many registration attempts. Wait an hour and try again."
    }
});
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Wait 15 minutes and try again."
    }
});
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many password recovery attempts. Wait 15 minutes and try again."
    }
});
const passwordResetVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many verification attempts. Wait 15 minutes and try again."
    }
});

// Public routes
router.post("/register", registrationLimiter, register);   // POST /api/auth/register
router.post("/login", loginLimiter, login);                 // POST /api/auth/login
router.post("/forgot-password/request", passwordResetLimiter, requestPasswordReset);
router.post("/forgot-password/reset", passwordResetVerifyLimiter, resetPasswordWithOtp);

// Protected route (requires valid JWT)
router.get("/me", protect, getMe);     // GET  /api/auth/me
router.patch("/me", protect, updateMe);
router.patch("/password", protect, changePassword);

module.exports = router;
