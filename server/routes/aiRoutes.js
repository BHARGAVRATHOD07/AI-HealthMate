const express = require("express");
const { chat } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/ai/chat — protected, requires valid JWT
// Body: { message: string, history: Array<{ sender: "user"|"ai", text: string }> }
router.post("/chat", protect, chat);

module.exports = router;
