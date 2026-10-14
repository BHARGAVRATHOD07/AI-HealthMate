const express = require("express");
const rateLimit = require("express-rate-limit");
const { chat, getHealthSummary } = require("../controllers/aiController");
const {
    createConversation,
    listConversations,
    listConversationMessages,
    renameConversation,
    deleteConversation
} = require("../controllers/conversationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    keyGenerator: (req) => req.user._id.toString(),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "AI request limit reached. Wait a minute and try again."
    }
});

// POST /api/ai/chat — protected, requires valid JWT
// Body: { message: string, history: Array<{ sender: "user"|"ai", text: string }> }
router.post("/chat", protect, aiLimiter, chat);

// POST /api/ai/health-summary — protected, requires valid JWT
router.post("/health-summary", protect, aiLimiter, getHealthSummary);

// Conversation endpoints use cursor IDs and return metadata/message pages.
router.route("/conversations")
    .post(protect, aiLimiter, createConversation)
    .get(protect, aiLimiter, listConversations);

router.get("/conversations/:id/messages", protect, aiLimiter, listConversationMessages);
router.patch("/conversations/:id", protect, aiLimiter, renameConversation);
router.delete("/conversations/:id", protect, aiLimiter, deleteConversation);

module.exports = router;
