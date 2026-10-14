const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const createObjectId = () => new mongoose.Types.ObjectId();

test("conversation validates with an owner, default title, and timestamps", async () => {
    const conversation = new Conversation({ user: createObjectId() });

    await conversation.validate();

    assert.equal(conversation.title, "New Chat");
    assert.ok(conversation.lastMessageAt instanceof Date);
    assert.equal(Conversation.schema.options.timestamps, true);
    assert.deepEqual(conversation.messages, undefined);
});

test("conversation title is trimmed and the 100-character limit is enforced", async () => {
    const conversation = new Conversation({
        user: createObjectId(),
        title: "  Health follow-up  "
    });

    await conversation.validate();
    assert.equal(conversation.title, "Health follow-up");

    const tooLong = new Conversation({
        user: createObjectId(),
        title: "x".repeat(101)
    });
    await assert.rejects(tooLong.validate(), (error) => {
        assert.equal(error.errors.title.kind, "maxlength");
        return true;
    });
});

test("conversation requires an owner and rejects an empty trimmed title", async () => {
    const missingOwner = new Conversation();
    await assert.rejects(missingOwner.validate(), (error) => {
        assert.equal(error.errors.user.kind, "required");
        return true;
    });

    const emptyTitle = new Conversation({
        user: createObjectId(),
        title: "   "
    });
    await assert.rejects(emptyTitle.validate(), (error) => {
        assert.equal(error.errors.title.kind, "required");
        return true;
    });
});

test("message accepts user and assistant roles and defaults status to pending", async () => {
    for (const role of ["user", "assistant"]) {
        const message = new Message({
            conversation: createObjectId(),
            user: createObjectId(),
            role,
            content: "A health-related question."
        });

        await message.validate();

        assert.equal(message.role, role);
        assert.equal(message.status, "pending");
        assert.equal(Message.schema.options.timestamps, true);
    }
});

test("message rejects unsupported roles and statuses", async () => {
    const invalidRole = new Message({
        conversation: createObjectId(),
        user: createObjectId(),
        role: "system",
        content: "A message."
    });
    await assert.rejects(invalidRole.validate(), (error) => {
        assert.equal(error.errors.role.kind, "enum");
        return true;
    });

    const invalidStatus = new Message({
        conversation: createObjectId(),
        user: createObjectId(),
        role: "user",
        content: "A message.",
        status: "queued"
    });
    await assert.rejects(invalidStatus.validate(), (error) => {
        assert.equal(error.errors.status.kind, "enum");
        return true;
    });
});

test("message requires conversation, user, role, and content", async () => {
    const message = new Message();
    await assert.rejects(message.validate(), (error) => {
        for (const field of ["conversation", "user", "role", "content"]) {
            assert.equal(error.errors[field].kind, "required");
        }
        return true;
    });
});

test("message content is trimmed and the 10000-character limit is enforced", async () => {
    const message = new Message({
        conversation: createObjectId(),
        user: createObjectId(),
        role: "assistant",
        content: "  A helpful response.  ",
        status: "complete"
    });

    test("message request IDs are UUIDs and assistant messages can reference their user turn", async () => {
        const requestId = "a1000000-0000-4000-8000-000000000001";
        const userMessage = new Message({
            conversation: createObjectId(),
            user: createObjectId(),
            role: "user",
            content: "A question.",
            requestId
        });
        await userMessage.validate();

        const assistantMessage = new Message({
            conversation: userMessage.conversation,
            user: userMessage.user,
            role: "assistant",
            content: "An answer.",
            inReplyTo: userMessage._id
        });
        await assistantMessage.validate();
        assert.equal(assistantMessage.inReplyTo, userMessage._id);

        userMessage.requestId = "not-a-uuid";
        await assert.rejects(userMessage.validate(), (error) => {
            assert.equal(error.errors.requestId.kind, "regexp");
            return true;
        });
    });

    await message.validate();
    assert.equal(message.content, "A helpful response.");

    const tooLong = new Message({
        conversation: createObjectId(),
        user: createObjectId(),
        role: "user",
        content: "x".repeat(10001)
    });
    await assert.rejects(tooLong.validate(), (error) => {
        assert.equal(error.errors.content.kind, "maxlength");
        return true;
    });
});

test("conversation and message declare the expected query indexes", () => {
    assert.ok(Conversation.schema.indexes().some(([index]) =>
        JSON.stringify(index) === JSON.stringify({ user: 1, lastMessageAt: -1, _id: -1 })
    ));
    assert.ok(Message.schema.indexes().some(([index]) =>
        JSON.stringify(index) === JSON.stringify({ user: 1, conversation: 1, createdAt: 1, _id: 1 })
    ));
    assert.ok(Message.schema.indexes().some(([index, options]) =>
        JSON.stringify(index) === JSON.stringify({ user: 1, conversation: 1, requestId: 1 }) &&
        options.unique === true &&
        options.partialFilterExpression.requestId.$type === "string"
    ));
    assert.ok(Message.schema.indexes().some(([index, options]) =>
        JSON.stringify(index) === JSON.stringify({ user: 1, conversation: 1, inReplyTo: 1 }) &&
        options.unique === true &&
        options.partialFilterExpression.inReplyTo.$type === "objectId"
    ));
});

test("model schemas omit unknown fields by default", () => {
    const conversation = new Conversation({
        user: createObjectId(),
        apiKey: "not-persisted",
        messages: [{ content: "not-persisted" }]
    });
    const message = new Message({
        conversation: createObjectId(),
        user: createObjectId(),
        role: "user",
        content: "A message.",
        prompt: "not-persisted",
        healthContext: "not-persisted"
    });

    assert.equal(conversation.apiKey, undefined);
    assert.equal(conversation.messages, undefined);
    assert.equal(message.prompt, undefined);
    assert.equal(message.healthContext, undefined);
});
