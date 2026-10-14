const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 10000
        },
        requestId: {
            type: String,
            maxlength: 36,
            match: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        },
        inReplyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        },
        model: {
            type: String,
            maxlength: 100
        },
        failureCode: {
            type: String,
            enum: ["not_processed", "outcome_unknown"]
        },
        status: {
            type: String,
            enum: ["pending", "complete", "failed"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

messageSchema.index({ user: 1, conversation: 1, createdAt: 1, _id: 1 });
messageSchema.index(
    { user: 1, conversation: 1, requestId: 1 },
    {
        unique: true,
        partialFilterExpression: { requestId: { $type: "string" } }
    }
);
messageSchema.index(
    { user: 1, conversation: 1, inReplyTo: 1 },
    {
        unique: true,
        partialFilterExpression: { inReplyTo: { $type: "objectId" } }
    }
);

module.exports = mongoose.model("Message", messageSchema);
