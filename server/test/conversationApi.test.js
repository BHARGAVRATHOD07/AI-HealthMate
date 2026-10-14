const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const {
    createConversation,
    listConversations,
    listConversationMessages,
    renameConversation,
    deleteConversation
} = require("../controllers/conversationController");

const ownerId = "507f1f77bcf86cd799439011";
const otherUserId = "507f191e810c19729de860ea";
const conversationId = "507f1f77bcf86cd799439012";

const createResponse = () => ({
    statusCode: 200,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    }
});

const replaceMethod = (target, key, replacement) => {
    const original = target[key];
    target[key] = replacement;
    return () => {
        target[key] = original;
    };
};

const makeQuery = (result, capture = {}) => ({
    select(fields) {
        capture.select = fields;
        return this;
    },
    sort(sort) {
        capture.sort = sort;
        return this;
    },
    limit(limit) {
        capture.limit = limit;
        return this;
    },
    session(session) {
        capture.session = session;
        return this;
    },
    lean: async () => result
});

const request = ({ params = {}, query = {}, body, userId = ownerId } = {}) => ({
    params,
    query,
    body,
    user: { _id: userId }
});

test("conversation routes reject unauthenticated requests through existing JWT middleware", async () => {
    const app = express();
    const aiRoutes = require("../routes/aiRoutes");
    app.use(express.json());
    app.use("/api/ai", aiRoutes);

    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));

    try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/ai/conversations`);
        assert.equal(response.status, 401);
        assert.equal((await response.json()).success, false);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});

test("conversation creation defaults the title and uses only the authenticated owner", async () => {
    const originalCreate = Conversation.create;
    let created;
    Conversation.create = async (values) => {
        created = values;
        return { _id: conversationId, ...values };
    };
    const res = createResponse();

    try {
        await createConversation(request({
            userId: ownerId,
            body: { userId: otherUserId }
        }), res);

        assert.equal(res.statusCode, 400);
        assert.equal(created, undefined);

        await createConversation(request({ userId: ownerId }), res);
        assert.equal(res.statusCode, 201);
        assert.deepEqual(created, { user: ownerId, title: "New Chat" });
        assert.equal(res.body.data.user, ownerId);
    } finally {
        Conversation.create = originalCreate;
    }
});

test("conversation creation validates and trims an optional title", async () => {
    const originalCreate = Conversation.create;
    let created;
    Conversation.create = async (values) => {
        created = values;
        return values;
    };

    try {
        const res = createResponse();
        await createConversation(request({ body: { title: "  Follow-up  " } }), res);
        assert.equal(res.statusCode, 201);
        assert.equal(created.title, "Follow-up");

        const invalid = createResponse();
        await createConversation(request({ body: { title: "x".repeat(101) } }), invalid);
        assert.equal(invalid.statusCode, 400);
    } finally {
        Conversation.create = originalCreate;
    }
});

test("conversation listing is owner-scoped, sorted, metadata-only, and cursor-paginated", async () => {
    const cursorId = "507f1f77bcf86cd799439013";
    const date = new Date("2026-10-01T00:00:00.000Z");
    const cursorCapture = {};
    const listCapture = {};
    const docs = [
        { _id: "507f1f77bcf86cd799439014", title: "First", lastMessageAt: date },
        { _id: "507f1f77bcf86cd799439015", title: "Second", lastMessageAt: date },
        { _id: "507f1f77bcf86cd799439016", title: "Third", lastMessageAt: date }
    ];
    const restoreFindOne = replaceMethod(Conversation, "findOne", (filter) => {
        assert.deepEqual(filter, { _id: cursorId, user: ownerId });
        return makeQuery({ _id: cursorId, lastMessageAt: date }, cursorCapture);
    });
    const restoreFind = replaceMethod(Conversation, "find", (filter) => {
        listCapture.filter = filter;
        return makeQuery(docs, listCapture);
    });

    try {
        const res = createResponse();
        await listConversations(request({ query: { cursor: cursorId, limit: "2" } }), res);

        assert.equal(res.statusCode, 200);
        assert.equal(listCapture.filter.user, ownerId);
        assert.deepEqual(listCapture.filter.$or, [
            { lastMessageAt: { $lt: date } },
            { lastMessageAt: date, _id: { $lt: cursorId } }
        ]);
        assert.deepEqual(listCapture.sort, { lastMessageAt: -1, _id: -1 });
        assert.equal(listCapture.limit, 3);
        assert.equal(listCapture.select, "_id title lastMessageAt createdAt updatedAt");
        assert.equal(res.body.count, 2);
        assert.deepEqual(res.body.pagination, {
            limit: 2,
            hasMore: true,
            nextCursor: docs[1]._id
        });
        assert.equal(res.body.data.some((item) => "messages" in item), false);
    } finally {
        restoreFindOne();
        restoreFind();
    }
});

test("conversation listing defaults to 20, permits 50, and rejects unbounded or spoofed pagination", async () => {
    const captures = [];
    const restoreFind = replaceMethod(Conversation, "find", () => {
        const capture = {};
        captures.push(capture);
        return makeQuery([], capture);
    });

    try {
        const defaults = createResponse();
        await listConversations(request(), defaults);
        assert.equal(captures[0].limit, 21);
        assert.equal(defaults.body.pagination.limit, 20);

        const maximum = createResponse();
        await listConversations(request({ query: { limit: "50" } }), maximum);
        assert.equal(captures[1].limit, 51);

        const tooLarge = createResponse();
        await listConversations(request({ query: { limit: "51" } }), tooLarge);
        assert.equal(tooLarge.statusCode, 400);

        const spoofedUser = createResponse();
        await listConversations(request({ query: { userId: otherUserId } }), spoofedUser);
        assert.equal(spoofedUser.statusCode, 400);
        assert.equal(captures.length, 2);
    } finally {
        restoreFind();
    }
});

test("message retrieval verifies conversation ownership and scopes messages by owner and conversation", async () => {
    const conversationCapture = {};
    const messageCapture = {};
    const messages = [{ _id: "507f1f77bcf86cd799439017", content: "Hello" }];
    const restoreConversationFind = replaceMethod(Conversation, "findOne", (filter) => {
        assert.deepEqual(filter, { _id: conversationId, user: ownerId });
        return makeQuery({ _id: conversationId }, conversationCapture);
    });
    const restoreMessageFind = replaceMethod(Message, "find", (filter) => {
        messageCapture.filter = filter;
        return makeQuery(messages, messageCapture);
    });

    try {
        const res = createResponse();
        await listConversationMessages(request({ params: { id: conversationId } }), res);
        assert.equal(res.statusCode, 200);
        assert.deepEqual(messageCapture.filter, { user: ownerId, conversation: conversationId });
        assert.deepEqual(messageCapture.sort, { createdAt: 1, _id: 1 });
        assert.equal(messageCapture.limit, 21);
        assert.equal(res.body.data[0].content, "Hello");
        assert.equal(res.body.pagination.hasMore, false);
    } finally {
        restoreConversationFind();
        restoreMessageFind();
    }
});

test("message retrieval hides another user's conversation and rejects malformed IDs", async () => {
    let messageQueryCalled = false;
    const restoreConversationFind = replaceMethod(Conversation, "findOne", () =>
        makeQuery(null));
    const restoreMessageFind = replaceMethod(Message, "find", () => {
        messageQueryCalled = true;
        return makeQuery([]);
    });

    try {
        const notOwned = createResponse();
        await listConversationMessages(request({ params: { id: conversationId } }), notOwned);
        assert.equal(notOwned.statusCode, 404);
        assert.equal(messageQueryCalled, false);

        const invalid = createResponse();
        await listConversationMessages(request({ params: { id: "not-an-id" } }), invalid);
        assert.equal(invalid.statusCode, 404);
    } finally {
        restoreConversationFind();
        restoreMessageFind();
    }
});

test("conversation rename trims title and updates only an owner-scoped title", async () => {
    let capturedFilter;
    let capturedUpdate;
    const restoreUpdate = replaceMethod(Conversation, "findOneAndUpdate", async (filter, update) => {
        capturedFilter = filter;
        capturedUpdate = update;
        return { _id: conversationId, title: update.$set.title };
    });

    try {
        const res = createResponse();
        await renameConversation(request({
            params: { id: conversationId },
            body: { title: "  Updated title  " }
        }), res);

        assert.equal(res.statusCode, 200);
        assert.deepEqual(capturedFilter, { _id: conversationId, user: ownerId });
        assert.deepEqual(capturedUpdate, { $set: { title: "Updated title" } });
        assert.equal(res.body.data.title, "Updated title");
    } finally {
        restoreUpdate();
    }
});

test("conversation rename rejects empty, oversized, and unknown fields", async () => {
    let updateCalled = false;
    const restoreUpdate = replaceMethod(Conversation, "findOneAndUpdate", async () => {
        updateCalled = true;
        return {};
    });

    try {
        for (const body of [
            { title: "  " },
            { title: "x".repeat(101) },
            { title: "Allowed", user: otherUserId },
            { title: "Allowed", updatedAt: new Date() }
        ]) {
            const res = createResponse();
            await renameConversation(request({ params: { id: conversationId }, body }), res);
            assert.equal(res.statusCode, 400);
        }
        assert.equal(updateCalled, false);
    } finally {
        restoreUpdate();
    }
});

test("another user cannot rename or delete a conversation", async () => {
    let deleteCalled = false;
    const restoreUpdate = replaceMethod(Conversation, "findOneAndUpdate", async (filter) => {
        assert.deepEqual(filter, { _id: conversationId, user: otherUserId });
        return null;
    });
    const originalStartSession = mongoose.startSession;
    mongoose.startSession = async () => ({
        withTransaction: async (callback) => callback(),
        endSession: async () => {}
    });
    const restoreFindOne = replaceMethod(Conversation, "findOne", (filter) => {
        assert.deepEqual(filter, { _id: conversationId, user: otherUserId });
        return makeQuery(null);
    });
    const restoreDeleteMessages = replaceMethod(Message, "deleteMany", async () => {
        deleteCalled = true;
    });

    try {
        const renameRes = createResponse();
        await renameConversation(request({
            userId: otherUserId,
            params: { id: conversationId },
            body: { title: "Not yours" }
        }), renameRes);
        assert.equal(renameRes.statusCode, 404);

        const deleteRes = createResponse();
        await deleteConversation(request({
            userId: otherUserId,
            params: { id: conversationId }
        }), deleteRes);
        assert.equal(deleteRes.statusCode, 404);
        assert.equal(deleteCalled, false);
    } finally {
        restoreUpdate();
        restoreFindOne();
        restoreDeleteMessages();
        mongoose.startSession = originalStartSession;
    }
});

test("conversation deletion removes only its owner's messages before deleting the parent", async () => {
    const session = { endSession: async () => {} };
    let startedSession;
    let capturedMessageFilter;
    let capturedConversationFilter;
    const restoreStartSession = replaceMethod(mongoose, "startSession", async () => {
        startedSession = { ...session, withTransaction: async (callback) => callback() };
        return startedSession;
    });
    const restoreFindOne = replaceMethod(Conversation, "findOne", (filter) => {
        assert.deepEqual(filter, { _id: conversationId, user: ownerId });
        return makeQuery({ _id: conversationId });
    });
    const restoreDeleteMessages = replaceMethod(Message, "deleteMany", async (filter, options) => {
        capturedMessageFilter = filter;
        assert.equal(options.session, startedSession);
        return { deletedCount: 2 };
    });
    const restoreDeleteConversation = replaceMethod(Conversation, "findOneAndDelete", async (filter, options) => {
        capturedConversationFilter = filter;
        assert.equal(options.session, startedSession);
        return { _id: conversationId };
    });

    try {
        const res = createResponse();
        await deleteConversation(request({ params: { id: conversationId } }), res);
        assert.equal(res.statusCode, 200);
        assert.deepEqual(capturedMessageFilter, { user: ownerId, conversation: conversationId });
        assert.deepEqual(capturedConversationFilter, { _id: conversationId, user: ownerId });
        assert.equal(res.body.success, true);
    } finally {
        restoreStartSession();
        restoreFindOne();
        restoreDeleteMessages();
        restoreDeleteConversation();
    }
});

test("conversation deletion uses a children-first fallback when transactions are unsupported", async () => {
    const order = [];
    const restoreStartSession = replaceMethod(mongoose, "startSession", async () => ({
        withTransaction: async () => {
            const error = new Error("Transaction numbers are only allowed on a replica set member or mongos");
            error.code = 20;
            throw error;
        },
        endSession: async () => {}
    }));
    const restoreFindOne = replaceMethod(Conversation, "findOne", (filter) => {
        assert.deepEqual(filter, { _id: conversationId, user: ownerId });
        return makeQuery({ _id: conversationId });
    });
    const restoreDeleteMessages = replaceMethod(Message, "deleteMany", async (filter, options) => {
        order.push("messages");
        assert.deepEqual(filter, { user: ownerId, conversation: conversationId });
        assert.deepEqual(options, {});
    });
    const restoreDeleteConversation = replaceMethod(Conversation, "findOneAndDelete", async (filter, options) => {
        order.push("conversation");
        assert.deepEqual(filter, { _id: conversationId, user: ownerId });
        assert.deepEqual(options, {});
        return { _id: conversationId };
    });

    try {
        const res = createResponse();
        await deleteConversation(request({ params: { id: conversationId } }), res);
        assert.equal(res.statusCode, 200);
        assert.deepEqual(order, ["messages", "conversation"]);
    } finally {
        restoreStartSession();
        restoreFindOne();
        restoreDeleteMessages();
        restoreDeleteConversation();
    }
});

test("conversation deletion reports failure if message deletion fails", async () => {
    const restoreStartSession = replaceMethod(mongoose, "startSession", async () => ({
        withTransaction: async (callback) => callback(),
        endSession: async () => {}
    }));
    const restoreFindOne = replaceMethod(Conversation, "findOne", () =>
        makeQuery({ _id: conversationId }));
    const restoreDeleteMessages = replaceMethod(Message, "deleteMany", async () => {
        throw new Error("simulated database failure");
    });
    let parentDeleteCalled = false;
    const restoreDeleteConversation = replaceMethod(Conversation, "findOneAndDelete", async () => {
        parentDeleteCalled = true;
        return { _id: conversationId };
    });

    try {
        const res = createResponse();
        await deleteConversation(request({ params: { id: conversationId } }), res);
        assert.equal(res.statusCode, 500);
        assert.equal(res.body.success, false);
        assert.equal(parentDeleteCalled, false);
    } finally {
        restoreStartSession();
        restoreFindOne();
        restoreDeleteMessages();
        restoreDeleteConversation();
    }
});

test("conversation route IDs are validated without database calls", async () => {
    let databaseCalled = false;
    const restoreUpdate = replaceMethod(Conversation, "findOneAndUpdate", async () => {
        databaseCalled = true;
    });
    const restoreStartSession = replaceMethod(mongoose, "startSession", async () => {
        databaseCalled = true;
    });

    try {
        const renameRes = createResponse();
        await renameConversation(request({
            params: { id: "bad-id" },
            body: { title: "Valid title" }
        }), renameRes);
        assert.equal(renameRes.statusCode, 404);

        const deleteRes = createResponse();
        await deleteConversation(request({ params: { id: "bad-id" } }), deleteRes);
        assert.equal(deleteRes.statusCode, 404);
        assert.equal(databaseCalled, false);
    } finally {
        restoreUpdate();
        restoreStartSession();
    }
});
