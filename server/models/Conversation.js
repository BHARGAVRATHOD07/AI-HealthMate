const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
            default: "New Chat"
        },
        lastMessageAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

conversationSchema.index({ user: 1, lastMessageAt: -1, _id: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
