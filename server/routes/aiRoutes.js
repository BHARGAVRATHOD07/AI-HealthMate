const express = require("express");
const rateLimit = require("express-rate-limit");
const { chat } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
const aiChatLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    keyGenerator: (req) => req.user._id.toString(),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "AI assistant request limit reached. Wait a minute and try again."
    }
});

// POST /api/ai/chat — protected, requires valid JWT
// Body: { message: string, history: Array<{ sender: "user"|"ai", text: string }> }
router.post("/chat", protect, aiChatLimiter, chat);

module.exports = router;
