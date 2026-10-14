const { test, beforeEach, afterEach, after: afterTests } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const mongoose = require("mongoose");
const healthContextService = require("../services/healthContextService");

const originalBuildHealthContext = healthContextService.buildHealthContext;
const originalGeminiKey = process.env.GEMINI_API_KEY;
process.env.GEMINI_API_KEY = "test-gemini-key";
healthContextService.buildHealthContext = async (authenticatedUserId) => {
    if (state) state.contextUserId = authenticatedUserId;
    return {
        formattedContext: "<user_health_data>authenticated test context</user_health_data>"
    };
};

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { chat, setCustomChatExecutorForTesting } = require("../controllers/aiController");
const originalConversationFindOne = Conversation.findOne;
const originalConversationUpdateOne = Conversation.updateOne;
const originalMessageCreate = Message.create;
const originalMessageFind = Message.find;
const originalMessageFindOne = Message.findOne;
const originalMessageUpdateOne = Message.updateOne;
const ownerId = new mongoose.Types.ObjectId().toString();
const otherOwnerId = new mongoose.Types.ObjectId().toString();
const conversationId = new mongoose.Types.ObjectId().toString();
const previousUserId = new mongoose.Types.ObjectId().toString();
const previousAssistantId = new mongoose.Types.ObjectId().toString();
const requestUserMessageId = new mongoose.Types.ObjectId().toString();
const requestAssistantMessageId = new mongoose.Types.ObjectId().toString();
const testRequestId = "a1000000-0000-4000-8000-000000000001";
const secondRequestId = "a1000000-0000-4000-8000-000000000002";
const now = new Date("2026-10-13T00:00:00.000Z");

let state;

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

const makeQuery = (value) => ({
    select() { return this; },
    sort(sort) {
        state.historySort = sort;
        return this;
    },
    limit(limit) {
        state.historyLimit = limit;
        return this;
    },
    lean: async () => value
});

const makeRequest = ({ body = {}, userId = ownerId } = {}) => ({
    body,
    user: userId ? { _id: userId } : null
});

beforeEach(() => {
    state = {
        createdMessages: [],
        storedMessages: [],
        messageUpdates: [],
        conversationUpdates: [],
        historyQuery: null,
        historyMessages: [],
        ownedConversation: true,
        failConversationUpdate: false,
        executor: async () => ({ reply: "A safe answer.", modelUsed: "test-model" })
    };

    Conversation.findOne = (filter) => {
        state.conversationQuery = filter;
        return makeQuery(state.ownedConversation ? { _id: conversationId } : null);
    };
    Conversation.updateOne = async (filter, update) => {
        state.conversationUpdates.push({ filter, update });
        if (state.failConversationUpdate) throw new Error("temporary database failure");
        return { matchedCount: 1 };
    };
    Message.create = async (message) => {
        state.createdMessages.push(message);
        const index = state.createdMessages.length;
        const saved = {
            ...message,
            _id: index === 1 ? requestUserMessageId : requestAssistantMessageId,
            createdAt: new Date(now.getTime() + index)
        };
        state.storedMessages.push(saved);
        return saved;
    };
    Message.find = (filter) => {
        state.historyQuery = filter;
        return makeQuery(state.historyMessages);
    };
    Message.findOne = (filter) => makeQuery(state.storedMessages.find((saved) =>
        Object.entries(filter).every(([key, value]) => {
            if (key === "_id" || key === "inReplyTo") {
                const actual = saved[key] && String(saved[key]);
                return actual === String(value);
            }
            return saved[key] === value;
        })
    ) || null);
    Message.updateOne = async (filter, update) => {
        state.messageUpdates.push({ filter, update });
        const saved = state.storedMessages.find((item) => String(item._id) === String(filter._id));
        if (saved) {
            if (update.$set) Object.assign(saved, update.$set);
            if (update.$unset) {
                for (const key of Object.keys(update.$unset)) delete saved[key];
            }
        }
        return { matchedCount: 1 };
    };
    setCustomChatExecutorForTesting((...args) => state.executor(...args));
});

afterTests(() => {
    healthContextService.buildHealthContext = originalBuildHealthContext;
    if (originalGeminiKey === undefined) {
        delete process.env.GEMINI_API_KEY;
    } else {
        process.env.GEMINI_API_KEY = originalGeminiKey;
    }
});

afterEach(() => {
    Conversation.findOne = originalConversationFindOne;
    Conversation.updateOne = originalConversationUpdateOne;
    Message.create = originalMessageCreate;
    Message.find = originalMessageFind;
    Message.findOne = originalMessageFindOne;
    Message.updateOne = originalMessageUpdateOne;
    setCustomChatExecutorForTesting(null);
});

test("legacy stateless chat works with bounded, normalized request history", async () => {
    let executorArgs;
    state.executor = async (...args) => {
        executorArgs = args;
        return { reply: "Legacy reply.", modelUsed: "test-model" };
    };
    const res = createResponse();

    await chat(makeRequest({
        body: {
            message: "  Current question  ",
            history: [
                { sender: "ai", text: "welcome message" },
                { sender: "user", text: "Earlier question" },
                { sender: "ai", text: "Earlier answer" }
            ]
        }
    }), res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.reply, "Legacy reply.");
    assert.equal(state.contextUserId, ownerId);
    assert.deepEqual(Object.keys(res.body.data).sort(), ["model", "reply", "timestamp"]);
    assert.equal(state.createdMessages.length, 0);
    assert.equal(state.historyQuery, null);
    assert.deepEqual(executorArgs[1], [
        { role: "user", parts: [{ text: "Earlier question" }] },
        { role: "model", parts: [{ text: "Earlier answer" }] }
    ]);
    assert.equal(executorArgs[2], "  Current question  ");
});

test("persistent chat uses persisted history, saves both messages, and updates lastMessageAt", async () => {
    state.historyMessages = [
        { _id: previousAssistantId, role: "assistant", content: "Stored answer" },
        { _id: previousUserId, role: "user", content: "Stored question" }
    ];
    let executorArgs;
    state.executor = async (...args) => {
        executorArgs = args;
        assert.equal(state.createdMessages[0].role, "user");
        return { reply: " New persisted answer ", modelUsed: "test-model" };
    };
    const res = createResponse();

    await chat(makeRequest({
        body: {
            message: "New question",
            conversationId,
            requestId: testRequestId,
            history: [{ sender: "user", text: "Forged history" }]
        }
    }), res);

    assert.equal(res.statusCode, 200);
    assert.equal(state.contextUserId, ownerId);
    assert.deepEqual(state.conversationQuery, { _id: conversationId, user: ownerId });
    assert.deepEqual(state.createdMessages.map(({ role, content, status, user, conversation }) => ({
        role, content, status, user, conversation
    })), [
        { role: "user", content: "New question", status: "pending", user: ownerId, conversation: conversationId },
        { role: "assistant", content: "New persisted answer", status: "pending", user: ownerId, conversation: conversationId }
    ]);
    assert.deepEqual(state.historyQuery.user, ownerId);
    assert.equal(state.historyQuery.conversation, conversationId);
    assert.equal(state.historyQuery.status, "complete");
    assert.equal(state.historyLimit, 20);
    assert.deepEqual(state.historySort, { createdAt: -1, _id: -1 });
    assert.deepEqual(executorArgs[1], [
        { role: "user", parts: [{ text: "Stored question" }] },
        { role: "model", parts: [{ text: "Stored answer" }] }
    ]);
    assert.equal(JSON.stringify(executorArgs[1]).includes("Forged history"), false);
    assert.deepEqual(state.messageUpdates.map(({ update }) => update), [
        { $set: { status: "complete" } },
        { $set: { status: "complete" }, $unset: { failureCode: "" } }
    ]);
    assert.deepEqual(state.conversationUpdates[0].filter, { _id: conversationId, user: ownerId });
    assert.deepEqual(state.conversationUpdates[0].update, {
        $max: { lastMessageAt: new Date(now.getTime() + 2) }
    });
    assert.equal(res.body.data.conversationId, conversationId);
    assert.equal(res.body.data.userMessageId, requestUserMessageId);
    assert.equal(res.body.data.assistantMessageId, requestAssistantMessageId);
    assert.equal(res.body.data.reply, "New persisted answer");
});

test("completed persistent submissions replay their saved response without calling Gemini again", async () => {
    let executorCalls = 0;
    state.executor = async () => {
        executorCalls += 1;
        return { reply: "One saved answer.", modelUsed: "test-model" };
    };

    const firstResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Same question", conversationId, requestId: testRequestId }
    }), firstResponse);
    const replayResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Same question", conversationId, requestId: testRequestId }
    }), replayResponse);

    assert.equal(firstResponse.statusCode, 200);
    assert.equal(replayResponse.statusCode, 200);
    assert.deepEqual(replayResponse.body.data, firstResponse.body.data);
    assert.equal(executorCalls, 1);
    assert.equal(state.createdMessages.length, 2);
});

test("a request ID reused with different message content is rejected", async () => {
    const firstResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Original question", conversationId, requestId: testRequestId }
    }), firstResponse);

    const conflictResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Changed question", conversationId, requestId: testRequestId }
    }), conflictResponse);

    assert.equal(firstResponse.statusCode, 200);
    assert.equal(conflictResponse.statusCode, 409);
    assert.match(conflictResponse.body.message, /different message/);
    assert.equal(state.createdMessages.length, 2);
});

test("a duplicate request during generation returns pending without starting another generation", async () => {
    let releaseGeneration;
    const generationGate = new Promise((resolve) => {
        releaseGeneration = resolve;
    });
    let executorCalls = 0;
    state.executor = async () => {
        executorCalls += 1;
        await generationGate;
        return { reply: "Saved after waiting.", modelUsed: "test-model" };
    };

    const firstResponse = createResponse();
    const firstRequest = chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), firstResponse);
    await new Promise((resolve) => setImmediate(resolve));

    const duplicateResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), duplicateResponse, true);

    assert.equal(duplicateResponse.statusCode, 202);
    assert.equal(duplicateResponse.body.data.status, "pending");
    assert.equal(executorCalls, 1);
    releaseGeneration();
    await firstRequest;
    assert.equal(firstResponse.statusCode, 200);
});

test("pre-generation database failure can be retried with the same request ID", async () => {
    const originalFind = Message.find;
    let failHistoryLoad = true;
    Message.find = (filter) => {
        if (failHistoryLoad) {
            failHistoryLoad = false;
            throw new Error("database unavailable");
        }
        return makeQuery([]);
    };
    let executorCalls = 0;
    state.executor = async () => {
        executorCalls += 1;
        return { reply: "Recovered answer.", modelUsed: "test-model" };
    };

    const failedResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), failedResponse);
    const retryResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), retryResponse);

    assert.equal(failedResponse.statusCode, 500);
    assert.equal(state.storedMessages[0].status, "complete");
    assert.equal(retryResponse.statusCode, 200);
    assert.equal(executorCalls, 1);
    Message.find = originalFind;
});

test("a failed user-status update recovers from the stored assistant without regenerating", async () => {
    const originalUpdateOne = Message.updateOne;
    let failedUserStatusWrites = 2;
    Message.updateOne = async (filter, update) => {
        if (String(filter._id) === requestUserMessageId &&
            update.$set?.status === "complete" &&
            failedUserStatusWrites > 0) {
            failedUserStatusWrites -= 1;
            throw new Error("temporary status write failure");
        }
        return originalUpdateOne(filter, update);
    };
    let executorCalls = 0;
    state.executor = async () => {
        executorCalls += 1;
        return { reply: "Persisted answer.", modelUsed: "test-model" };
    };

    const pendingResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), pendingResponse);
    assert.equal(pendingResponse.statusCode, 202);
    assert.equal(state.storedMessages.find((item) => item.role === "assistant").status, "complete");
    assert.equal(state.storedMessages.find((item) => item.role === "user").status, "pending");

    const recoveredResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), recoveredResponse);

    assert.equal(recoveredResponse.statusCode, 200);
    assert.equal(recoveredResponse.body.data.reply, "Persisted answer.");
    assert.equal(executorCalls, 1);
});

test("failed user-message creation can be resubmitted with the same request ID", async () => {
    const originalCreate = Message.create;
    let firstAttempt = true;
    Message.create = async (message) => {
        if (firstAttempt) {
            firstAttempt = false;
            throw new Error("temporary database write failure");
        }
        return originalCreate(message);
    };
    let executorCalls = 0;
    state.executor = async () => {
        executorCalls += 1;
        return { reply: "Saved after retry.", modelUsed: "test-model" };
    };

    const failedResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), failedResponse);
    const retryResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), retryResponse);

    assert.equal(failedResponse.statusCode, 500);
    assert.equal(retryResponse.statusCode, 200);
    assert.equal(executorCalls, 1);
});

test("provider failure is recorded as unknown and the same request is not generated twice", async () => {
    let executorCalls = 0;
    state.executor = async () => {
        executorCalls += 1;
        throw new Error("provider timeout with private details");
    };

    const firstResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), firstResponse);
    const retryResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), retryResponse);

    assert.equal(firstResponse.statusCode, 409);
    assert.equal(firstResponse.body.data.outcome, "unknown");
    assert.equal(retryResponse.statusCode, 409);
    assert.equal(executorCalls, 1);
    assert.equal(JSON.stringify(firstResponse.body).includes("private details"), false);
});

test("provider timeout, rate-limit, and server errors remain non-retriable when outcome is unknown", async () => {
    const failures = [
        { requestId: testRequestId, status: undefined, code: "ETIMEDOUT" },
        { requestId: secondRequestId, status: 429 },
        { requestId: "a1000000-0000-4000-8000-000000000003", status: 503 }
    ];
    for (const failure of failures) {
        state.createdMessages = [];
        state.storedMessages = [];
        state.messageUpdates = [];
        state.conversationUpdates = [];
        let executorCalls = 0;
        state.executor = async () => {
            executorCalls += 1;
            const error = new Error("private provider failure");
            if (failure.status !== undefined) error.status = failure.status;
            if (failure.code) error.code = failure.code;
            throw error;
        };
        const requestBody = {
            message: "Question",
            conversationId,
            requestId: failure.requestId
        };
        const firstResponse = createResponse();
        await chat(makeRequest({ body: requestBody }), firstResponse);
        const retryResponse = createResponse();
        await chat(makeRequest({ body: requestBody }), retryResponse);

        assert.equal(firstResponse.statusCode, 409);
        assert.equal(firstResponse.body.data.outcome, "unknown");
        assert.equal(retryResponse.statusCode, 409);
        assert.equal(executorCalls, 1);
        assert.equal(JSON.stringify(firstResponse.body).includes("private provider failure"), false);
    }
});

test("a client disconnect does not discard a response already being generated", async () => {
    const res = createResponse();
    state.executor = async () => {
        res.destroyed = true;
        return { reply: "Saved after disconnect.", modelUsed: "test-model" };
    };

    await chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), res);

    assert.equal(state.storedMessages.find((item) => item.role === "user").status, "complete");
    assert.equal(state.storedMessages.find((item) => item.role === "assistant").status, "complete");
});

test("saved assistant responses recover after a conversation timestamp failure", async () => {
    state.failConversationUpdate = true;
    let executorCalls = 0;
    state.executor = async () => {
        executorCalls += 1;
        return { reply: "Stored before metadata failed.", modelUsed: "test-model" };
    };

    const pendingResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), pendingResponse);
    assert.equal(pendingResponse.statusCode, 202);
    assert.equal(state.storedMessages.find((item) => item.role === "assistant").status, "pending");

    state.failConversationUpdate = false;
    const recoveredResponse = createResponse();
    await chat(makeRequest({
        body: { message: "Question", conversationId, requestId: testRequestId }
    }), recoveredResponse);

    assert.equal(recoveredResponse.statusCode, 200);
    assert.equal(recoveredResponse.body.data.reply, "Stored before metadata failed.");
    assert.equal(executorCalls, 1);
});

test("persistent Gemini history respects the message and character budgets", async () => {
    state.historyMessages = [];
    for (let turn = 9; turn >= 0; turn -= 1) {
        state.historyMessages.push(
            { role: "assistant", content: `answer-${turn}-${"a".repeat(997)}` },
            { role: "user", content: `question-${turn}-${"u".repeat(990)}` }
        );
    }
    let executorArgs;
    state.executor = async (...args) => {
        executorArgs = args;
        return { reply: "Bounded response.", modelUsed: "test-model" };
    };
    const res = createResponse();

    await chat(makeRequest({ body: { message: "latest user question", conversationId, requestId: testRequestId } }), res);

    const loadedHistory = executorArgs[1];
    const loadedCharacters = loadedHistory.reduce(
        (total, item) => total + item.parts[0].text.length,
        0
    );
    assert.ok(loadedHistory.length <= 20);
    assert.ok(loadedCharacters <= 16000);
    assert.equal(loadedHistory.at(-1).role, "model");
    assert.match(loadedHistory.at(-1).parts[0].text, /^answer-9-/);
    assert.equal(executorArgs[2], "latest user question");
    assert.equal(res.statusCode, 200);
});

test("simultaneous persistent sends are serialized per conversation", async () => {
    let startFirst;
    let releaseFirst;
    const firstStarted = new Promise((resolve) => {
        startFirst = resolve;
    });
    const firstGate = new Promise((resolve) => {
        releaseFirst = resolve;
    });
    const executorCalls = [];
    const savedMessages = [];
    let createdAtOffset = 0;
    state.executor = async (_instruction, history, message) => {
        executorCalls.push({ history, message });
        if (message === "first") {
            startFirst();
            await firstGate;
        }
        return { reply: `Answer to ${message}`, modelUsed: "test-model" };
    };
    Message.create = async (message) => {
        const saved = {
            ...message,
            _id: new mongoose.Types.ObjectId(),
            createdAt: new Date(now.getTime() + ++createdAtOffset)
        };
        savedMessages.push(saved);
        return saved;
    };
    Message.updateOne = async (filter, update) => {
        const saved = savedMessages.find((item) => item._id.equals(filter._id));
        if (!saved) return { matchedCount: 0 };
        saved.status = update.$set.status;
        return { matchedCount: 1 };
    };
    Message.find = (filter) => {
        state.historyQuery = filter;
        const latestPriorDate = filter.$or[0].createdAt.$lt;
        const messages = savedMessages
            .filter((item) => item.status === "complete" && item.createdAt < latestPriorDate)
            .sort((left, right) => right.createdAt - left.createdAt);
        return makeQuery(messages);
    };

    const firstResponse = createResponse();
    const secondResponse = createResponse();
    const firstRequest = chat(makeRequest({ body: { message: "first", conversationId, requestId: testRequestId } }), firstResponse);
    await firstStarted;
    const secondRequest = chat(makeRequest({ body: { message: "second", conversationId, requestId: secondRequestId } }), secondResponse);
    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(executorCalls.map((call) => call.message), ["first"]);
    releaseFirst();
    await Promise.all([firstRequest, secondRequest]);

    assert.deepEqual(executorCalls.map((call) => call.message), ["first", "second"]);
    assert.deepEqual(executorCalls[1].history, [
        { role: "user", parts: [{ text: "first" }] },
        { role: "model", parts: [{ text: "Answer to first" }] }
    ]);
    assert.equal(firstResponse.statusCode, 200);
    assert.equal(secondResponse.statusCode, 200);
});

test("persistent chat rejects invalid IDs, foreign conversations, and supplied user IDs", async () => {
    const invalidId = createResponse();
    await chat(makeRequest({ body: { message: "hello", conversationId: "not-an-id" } }), invalidId);
    assert.equal(invalidId.statusCode, 400);
    assert.equal(state.conversationQuery, undefined);

    const missingRequestId = createResponse();
    await chat(makeRequest({ body: { message: "hello", conversationId } }), missingRequestId);
    assert.equal(missingRequestId.statusCode, 400);

    state.ownedConversation = false;
    const foreignConversation = createResponse();
    await chat(makeRequest({ body: { message: "hello", conversationId, requestId: testRequestId } }), foreignConversation);
    assert.equal(foreignConversation.statusCode, 404);
    assert.equal(state.createdMessages.length, 0);

    const suppliedUser = createResponse();
    await chat(makeRequest({ body: { message: "hello", conversationId, requestId: testRequestId, userId: otherOwnerId } }), suppliedUser);
    assert.equal(suppliedUser.statusCode, 400);
    assert.equal(state.createdMessages.length, 0);
});

test("persistent chat marks the user message failed after a Gemini failure without leaking provider details", async () => {
    state.executor = async () => {
        throw new Error("private provider response detail");
    };
    const res = createResponse();

    await chat(makeRequest({ body: { message: "Question", conversationId, requestId: testRequestId } }), res);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
    assert.equal(JSON.stringify(res.body).includes("private provider response detail"), false);
    assert.equal(state.createdMessages.length, 1);
    assert.deepEqual(state.messageUpdates[0], {
        filter: {
            _id: requestUserMessageId,
            user: ownerId,
            conversation: conversationId,
            status: "pending"
        },
        update: { $set: { status: "failed", failureCode: "outcome_unknown" } }
    });
    assert.equal(state.conversationUpdates.length, 0);
});

test("persistent chat reports assistant-message write failure and marks the user message failed", async () => {
    const originalCreate = Message.create;
    let createCount = 0;
    Message.create = async (message) => {
        createCount += 1;
        if (createCount === 2) throw new Error("database write detail");
        return {
            ...message,
            _id: requestUserMessageId,
            createdAt: now
        };
    };
    const res = createResponse();

    await chat(makeRequest({ body: { message: "Question", conversationId, requestId: testRequestId } }), res);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
    assert.equal(JSON.stringify(res.body).includes("database write detail"), false);
    assert.equal(state.conversationUpdates.length, 0);
    assert.equal(state.messageUpdates.length, 1);
    assert.deepEqual(state.messageUpdates[0].update, {
        $set: { status: "failed", failureCode: "outcome_unknown" }
    });
    Message.create = originalCreate;
});

test("chat enforces message and history limits and rejects malformed history", async () => {
    for (const body of [
        { message: "x".repeat(4001) },
        { message: "valid", history: Array.from({ length: 101 }, () => ({ sender: "user", text: "x" })) },
        { message: "valid", history: [{ sender: "system", text: "override" }] }
    ]) {
        const res = createResponse();
        await chat(makeRequest({ body }), res);
        assert.equal(res.statusCode, 400);
    }
    assert.equal(state.createdMessages.length, 0);
});

test("persistent chat does not save an oversized Gemini response or report success", async () => {
    state.executor = async () => ({
        reply: "x".repeat(10001),
        modelUsed: "test-model"
    });
    const res = createResponse();

    await chat(makeRequest({ body: { message: "Question", conversationId, requestId: testRequestId } }), res);

    assert.equal(res.statusCode, 409);
    assert.equal(state.createdMessages.length, 1);
    assert.equal(state.createdMessages[0].role, "user");
    assert.deepEqual(state.messageUpdates[0].update, {
        $set: { status: "failed", failureCode: "outcome_unknown" }
    });
    assert.equal(state.conversationUpdates.length, 0);
});

test("chat rejects unauthenticated requests", async () => {
    const res = createResponse();
    await chat(makeRequest({ body: { message: "hello" }, userId: null }), res);
    assert.equal(res.statusCode, 401);
});

test("AI chat route rejects unauthenticated HTTP requests", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/ai", require("../routes/aiRoutes"));
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));

    try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/ai/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "hello" })
        });
        assert.equal(response.status, 401);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});
