import test from "node:test";
import assert from "node:assert/strict";
import { createChatSubmission } from "./chatRequest.js";

test("each logical chat submission receives a distinct UUID", () => {
  const first = createChatSubmission("Question one", "conversation-one");
  const second = createChatSubmission("Question one", "conversation-one");

  assert.match(first.requestId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(first.requestId, second.requestId);
});

test("a submission retains its request ID when reused for status checks", () => {
  const submission = createChatSubmission("Question", "conversation-one");
  const requestIdForRetry = submission.requestId;

  assert.equal(submission.requestId, requestIdForRetry);
  assert.equal(submission.message, "Question");
  assert.equal(submission.conversationId, "conversation-one");
});
