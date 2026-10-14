const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { logInternalError } = require("../utils/errorLogging");

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MAX_TITLE_LENGTH = 100;

class ConversationNotFoundError extends Error {}

const logConversationError = (context, error) => {
    logInternalError(context, {
        name: error?.name,
        code: error?.code
    });
};

const getObjectBody = (body) => {
    if (body === undefined) return {};
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body;
};

const hasOnlyKeys = (value, allowedKeys) =>
    Object.keys(value).every((key) => allowedKeys.includes(key));

const validateTitle = (value, { required }) => {
    if (value === undefined && !required) {
        return { isValid: true, value: "New Chat" };
    }
    if (typeof value !== "string") {
        return { isValid: false, message: "Title must be text." };
    }

    const title = value.trim();
    if (!title) {
        return { isValid: false, message: "Title is required." };
    }
    if (title.length > MAX_TITLE_LENGTH) {
        return { isValid: false, message: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` };
    }

    return { isValid: true, value: title };
};

const validateId = (id) => mongoose.isValidObjectId(id);

const parsePagination = (query) => {
    const queryParams = query || {};
    if (!hasOnlyKeys(queryParams, ["limit", "cursor"])) {
        return { isValid: false, status: 400, message: "Unsupported pagination parameter." };
    }

    let limit = DEFAULT_PAGE_SIZE;
    if (queryParams.limit !== undefined) {
        if (typeof queryParams.limit !== "string" || !/^\d+$/.test(queryParams.limit)) {
            return { isValid: false, status: 400, message: "Limit must be a positive integer." };
        }
        limit = Number(queryParams.limit);
        if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
            return { isValid: false, status: 400, message: `Limit must be between 1 and ${MAX_PAGE_SIZE}.` };
        }
    }

    if (queryParams.cursor !== undefined && !validateId(queryParams.cursor)) {
        return { isValid: false, status: 400, message: "Pagination cursor is invalid." };
    }

    return { isValid: true, limit, cursor: queryParams.cursor };
};

const sendNotFound = (res) => res.status(404).json({
    success: false,
    message: "Conversation not found."
});

const createConversation = async (req, res) => {
    try {
        const body = getObjectBody(req.body);
        if (!body || !hasOnlyKeys(body, ["title"])) {
            return res.status(400).json({
                success: false,
                message: "Request body may contain only a title."
            });
        }

        const title = validateTitle(body.title, { required: false });
        if (!title.isValid) {
            return res.status(400).json({ success: false, message: title.message });
        }

        const conversation = await Conversation.create({
            user: req.user._id,
            title: title.value
        });

        return res.status(201).json({ success: true, data: conversation });
    } catch (error) {
        logConversationError("Create conversation", error);
        return res.status(500).json({
            success: false,
            message: "Could not create the conversation."
        });
    }
};

const listConversations = async (req, res) => {
    try {
        const pagination = parsePagination(req.query);
        if (!pagination.isValid) {
            return res.status(pagination.status).json({
                success: false,
                message: pagination.message
            });
        }

        const userId = req.user._id;
        const filter = { user: userId };
        if (pagination.cursor) {
            const cursorConversation = await Conversation.findOne({
                _id: pagination.cursor,
                user: userId
            }).select("_id lastMessageAt").lean();

            if (!cursorConversation) return sendNotFound(res);
            filter.$or = [
                { lastMessageAt: { $lt: cursorConversation.lastMessageAt } },
                {
                    lastMessageAt: cursorConversation.lastMessageAt,
                    _id: { $lt: cursorConversation._id }
                }
            ];
        }

        const conversations = await Conversation.find(filter)
            .select("_id title lastMessageAt createdAt updatedAt")
            .sort({ lastMessageAt: -1, _id: -1 })
            .limit(pagination.limit + 1)
            .lean();

        const hasMore = conversations.length > pagination.limit;
        const data = conversations.slice(0, pagination.limit);
        const nextCursor = hasMore && data.length > 0
            ? data[data.length - 1]._id.toString()
            : null;

        return res.status(200).json({
            success: true,
            count: data.length,
            data,
            pagination: {
                limit: pagination.limit,
                hasMore,
                nextCursor
            }
        });
    } catch (error) {
        logConversationError("List conversations", error);
        return res.status(500).json({
            success: false,
            message: "Could not retrieve conversations."
        });
    }
};

const listConversationMessages = async (req, res) => {
    try {
        if (!validateId(req.params.id)) return sendNotFound(res);

        const pagination = parsePagination(req.query);
        if (!pagination.isValid) {
            return res.status(pagination.status).json({
                success: false,
                message: pagination.message
            });
        }

        const userId = req.user._id;
        const conversationId = req.params.id;
        const conversation = await Conversation.findOne({
            _id: conversationId,
            user: userId
        }).select("_id").lean();

        if (!conversation) return sendNotFound(res);

        const filter = { user: userId, conversation: conversationId };
        if (pagination.cursor) {
            const cursorMessage = await Message.findOne({
                _id: pagination.cursor,
                user: userId,
                conversation: conversationId
            }).select("_id createdAt").lean();

            if (!cursorMessage) {
                return res.status(400).json({
                    success: false,
                    message: "Pagination cursor is invalid."
                });
            }

            filter.$or = [
                { createdAt: { $gt: cursorMessage.createdAt } },
                {
                    createdAt: cursorMessage.createdAt,
                    _id: { $gt: cursorMessage._id }
                }
            ];
        }

        const messages = await Message.find(filter)
            .select("_id conversation role content status failureCode requestId createdAt updatedAt")
            .sort({ createdAt: 1, _id: 1 })
            .limit(pagination.limit + 1)
            .lean();

        const hasMore = messages.length > pagination.limit;
        const data = messages.slice(0, pagination.limit);
        const nextCursor = hasMore && data.length > 0
            ? data[data.length - 1]._id.toString()
            : null;

        return res.status(200).json({
            success: true,
            count: data.length,
            data,
            pagination: {
                limit: pagination.limit,
                hasMore,
                nextCursor
            }
        });
    } catch (error) {
        logConversationError("List conversation messages", error);
        return res.status(500).json({
            success: false,
            message: "Could not retrieve conversation messages."
        });
    }
};

const renameConversation = async (req, res) => {
    if (!validateId(req.params.id)) return sendNotFound(res);

    const body = getObjectBody(req.body);
    if (!body || !hasOnlyKeys(body, ["title"]) || !Object.hasOwn(body, "title")) {
        return res.status(400).json({
            success: false,
            message: "Request body must contain only a title."
        });
    }

    const title = validateTitle(body.title, { required: true });
    if (!title.isValid) {
        return res.status(400).json({ success: false, message: title.message });
    }

    try {
        const conversation = await Conversation.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: { title: title.value } },
            { new: true, runValidators: true }
        );

        if (!conversation) return sendNotFound(res);
        return res.status(200).json({ success: true, data: conversation });
    } catch (error) {
        logConversationError("Rename conversation", error);
        return res.status(500).json({
            success: false,
            message: "Could not rename the conversation."
        });
    }
};

const isTransactionUnsupported = (error) =>
    error?.code === 20 ||
    /transaction numbers are only allowed on a replica set member or mongos/i.test(error?.message || "");

const deleteOwnedConversation = async (conversationId, userId, session) => {
    let conversationQuery = Conversation.findOne({ _id: conversationId, user: userId })
        .select("_id");
    if (session) conversationQuery = conversationQuery.session(session);
    const conversation = await conversationQuery.lean();
    if (!conversation) throw new ConversationNotFoundError("Conversation not found.");

    await Message.deleteMany(
        { user: userId, conversation: conversationId },
        session ? { session } : {}
    );

    const deleted = await Conversation.findOneAndDelete(
        { _id: conversationId, user: userId },
        session ? { session } : {}
    );
    if (!deleted) throw new ConversationNotFoundError("Conversation not found.");
};

const deleteConversation = async (req, res) => {
    if (!validateId(req.params.id)) return sendNotFound(res);

    let session;
    let transactionSucceeded = false;
    try {
        session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                transactionSucceeded = false;
                await deleteOwnedConversation(req.params.id, req.user._id, session);
                transactionSucceeded = true;
            });
        } catch (error) {
            if (error instanceof ConversationNotFoundError) return sendNotFound(res);
            if (!isTransactionUnsupported(error)) throw error;

            // Fallback: remove child messages first. If parent deletion then fails,
            // return an error and leave an empty conversation for a safe retry.
            await deleteOwnedConversation(req.params.id, req.user._id);
            transactionSucceeded = true;
        }

        if (!transactionSucceeded) return sendNotFound(res);
        return res.status(200).json({
            success: true,
            message: "Conversation deleted."
        });
    } catch (error) {
        if (error instanceof ConversationNotFoundError) return sendNotFound(res);
        logConversationError("Delete conversation", error);
        return res.status(500).json({
            success: false,
            message: "Could not delete the conversation."
        });
    } finally {
        if (session) {
            try {
                await session.endSession();
            } catch (error) {
                logConversationError("End conversation deletion session", error);
            }
        }
    }
};

module.exports = {
    createConversation,
    listConversations,
    listConversationMessages,
    renameConversation,
    deleteConversation
};
