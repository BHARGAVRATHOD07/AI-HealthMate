const { test } = require("node:test");
const assert = require("node:assert/strict");
const Record = require("../models/Record");
const {
    createRecord,
    deleteRecord,
    getRecord,
    getRecords,
    updateRecord
} = require("../controllers/recordController");

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

test("record creation uses the authenticated owner and only validated record fields", async () => {
    const originalCreate = Record.create;
    let capturedRecord;
    Record.create = async (record) => {
        capturedRecord = record;
        return { _id: "record-id", ...record };
    };
    const res = createResponse();

    try {
        await createRecord({
            user: { _id: "user-a" },
            body: {
                title: "  Blood panel  ",
                category: "Lab Report",
                doctorName: " Dr Example ",
                facility: " Clinic ",
                date: "2026-10-08",
                summary: " Results recorded by user. ",
                status: "Pending",
                userId: "user-b",
                $set: { user: "user-b" }
            }
        }, res);

        assert.equal(res.statusCode, 201);
        assert.equal(capturedRecord.user, "user-a");
        assert.equal(capturedRecord.title, "Blood panel");
        assert.equal(capturedRecord.doctorName, "Dr Example");
        assert.equal(capturedRecord.facility, "Clinic");
        assert.equal(capturedRecord.summary, "Results recorded by user.");
        assert.equal(capturedRecord.userId, undefined);
        assert.equal(capturedRecord.$set, undefined);
    } finally {
        Record.create = originalCreate;
    }
});

test("record updates scope by record id and authenticated owner", async () => {
    const originalUpdate = Record.findOneAndUpdate;
    let capturedFilter;
    let capturedUpdate;
    Record.findOneAndUpdate = async (filter, update) => {
        capturedFilter = filter;
        capturedUpdate = update;
        return { _id: "record-id", ...update.$set };
    };
    const res = createResponse();

    try {
        await updateRecord({
            params: { id: "507f1f77bcf86cd799439011" },
            user: { _id: "owner-id" },
            body: {
                title: "Updated record",
                category: "Prescription",
                doctorName: "",
                facility: "",
                date: "2026-10-07",
                summary: "",
                status: "Final",
                user: "attacker-id",
                $set: { user: "attacker-id" }
            }
        }, res);

        assert.deepEqual(capturedFilter, { _id: "507f1f77bcf86cd799439011", user: "owner-id" });
        assert.equal(capturedUpdate.$set.title, "Updated record");
        assert.equal(capturedUpdate.$set.user, undefined);
        assert.equal(capturedUpdate.$set.$set, undefined);
        assert.equal(res.statusCode, 200);
    } finally {
        Record.findOneAndUpdate = originalUpdate;
    }
});

test("single-record reads scope by record id and authenticated owner", async () => {
    const originalFindOne = Record.findOne;
    let capturedFilter;
    Record.findOne = async (filter) => {
        capturedFilter = filter;
        return null;
    };
    const res = createResponse();

    try {
        await getRecord({
            params: { id: "507f1f77bcf86cd799439011" },
            user: { _id: "user-b" }
        }, res);

        assert.deepEqual(capturedFilter, {
            _id: "507f1f77bcf86cd799439011",
            user: "user-b"
        });
        assert.equal(res.statusCode, 404);
    } finally {
        Record.findOne = originalFindOne;
    }
});

test("record list search and filters remain scoped to the authenticated user", async () => {
    const originalFind = Record.find;
    let capturedQuery;
    let capturedSort;
    Record.find = (query) => {
        capturedQuery = query;
        return {
            sort: async (sort) => {
                capturedSort = sort;
                return [];
            }
        };
    };
    const res = createResponse();

    try {
        await getRecords({
            user: { _id: "user-a" },
            query: {
                category: "Lab Report",
                status: "Pending",
                search: "Blood (test)"
            }
        }, res);

        assert.equal(capturedQuery.user, "user-a");
        assert.equal(capturedQuery.category, "Lab Report");
        assert.equal(capturedQuery.status, "Pending");
        assert.equal(capturedQuery.$or.length, 4);
        assert.equal(capturedQuery.$or[0].title instanceof RegExp, true);
        assert.equal(capturedQuery.$or[0].title.test("blood (test)"), true);
        assert.equal(capturedQuery.$or[0].title.test("Blood test"), false);
        assert.deepEqual(capturedSort, { date: -1, createdAt: -1 });
        assert.equal(res.body.success, true);
    } finally {
        Record.find = originalFind;
    }
});

test("invalid record text lengths and malformed dates are rejected before persistence", async () => {
    const originalCreate = Record.create;
    let createCalled = false;
    Record.create = async () => {
        createCalled = true;
        return {};
    };

    try {
        const longTitleResponse = createResponse();
        await createRecord({
            user: { _id: "user-a" },
            body: { title: "x".repeat(151), date: "2026-10-08" }
        }, longTitleResponse);
        assert.equal(longTitleResponse.statusCode, 400);
        assert.match(longTitleResponse.body.message, /150 characters/);

        const invalidDateResponse = createResponse();
        await createRecord({
            user: { _id: "user-a" },
            body: { title: "Valid title", date: "2026-02-31" }
        }, invalidDateResponse);
        assert.equal(invalidDateResponse.statusCode, 400);
        assert.match(invalidDateResponse.body.message, /valid date/);

        const emptyBodyResponse = createResponse();
        await createRecord({
            user: { _id: "user-a" },
            body: null
        }, emptyBodyResponse);
        assert.equal(emptyBodyResponse.statusCode, 400);
        assert.match(emptyBodyResponse.body.message, /title is required/i);
        assert.equal(createCalled, false);
    } finally {
        Record.create = originalCreate;
    }
});

test("deleting a record only targets the authenticated owner's record", async () => {
    const originalDelete = Record.findOneAndDelete;
    let capturedFilter;
    Record.findOneAndDelete = async (filter) => {
        capturedFilter = filter;
        return null;
    };
    const res = createResponse();

    try {
        await deleteRecord({
            params: { id: "507f1f77bcf86cd799439011" },
            user: { _id: "user-b" }
        }, res);
        assert.deepEqual(capturedFilter, { _id: "507f1f77bcf86cd799439011", user: "user-b" });
        assert.equal(res.statusCode, 404);
    } finally {
        Record.findOneAndDelete = originalDelete;
    }
});
