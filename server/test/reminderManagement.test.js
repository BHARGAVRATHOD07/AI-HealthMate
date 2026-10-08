const { test } = require("node:test");
const assert = require("node:assert/strict");
const Reminder = require("../models/Reminder");
const {
    createReminder,
    getReminder,
    toggleReminder,
    updateReminder
} = require("../controllers/reminderController");

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

test("reminder creation validates supported fields and scopes data to the authenticated user", async () => {
    const originalCreate = Reminder.create;
    let capturedReminder;
    Reminder.create = async (reminder) => {
        capturedReminder = reminder;
        return reminder;
    };
    const res = createResponse();

    try {
        await createReminder({
            user: { _id: "owner-id" },
            body: {
                user: "attacker-id",
                title: "Take medicine",
                category: "Medication",
                time: "25:80",
                date: "2026-02-30",
                repeat: "Daily"
            }
        }, res);
        assert.equal(res.statusCode, 400);
        assert.equal(capturedReminder, undefined);

        res.statusCode = 200;
        res.body = null;
        await createReminder({
            user: { _id: "owner-id" },
            body: {
                user: "attacker-id",
                title: "  Take medicine ",
                category: "Medication",
                time: "13:05",
                date: "2026-06-20",
                repeat: "Daily",
                completed: true
            }
        }, res);
        assert.equal(res.statusCode, 201);
        assert.equal(capturedReminder.user, "owner-id");
        assert.equal(capturedReminder.title, "Take medicine");
        assert.equal(capturedReminder.time, "01:05 PM");
        assert.equal(capturedReminder.completed, false);
    } finally {
        Reminder.create = originalCreate;
    }
});

test("reminder read and update are scoped to the authenticated owner", async () => {
    const originalFindOne = Reminder.findOne;
    const originalFindOneAndUpdate = Reminder.findOneAndUpdate;
    const reminderId = "507f1f77bcf86cd799439011";
    let updateFilter;
    let updateBody;
    Reminder.findOne = async (filter) => {
        if (filter.user !== "owner-id") return null;
        assert.deepEqual(filter, { _id: reminderId, user: "owner-id" });
        return {
            toObject() {
                return { title: "Original", category: "General", time: "09:00 AM", date: "Today", repeat: "Daily" };
            }
        };
    };
    Reminder.findOneAndUpdate = async (filter, update) => {
        updateFilter = filter;
        updateBody = update;
        return { _id: reminderId, title: "Updated" };
    };
    const res = createResponse();

    try {
        await getReminder({ params: { id: reminderId }, user: { _id: "different-owner" } }, res);
        assert.equal(res.statusCode, 404);

        res.statusCode = 200;
        await updateReminder({
            params: { id: reminderId },
            user: { _id: "owner-id" },
            body: { title: " Updated ", user: "attacker-id", $set: { user: "attacker-id" } }
        }, res);
        assert.deepEqual(updateFilter, { _id: reminderId, user: "owner-id" });
        assert.deepEqual(updateBody, { $set: { title: "Updated" } });
        assert.equal(res.statusCode, 200);
    } finally {
        Reminder.findOne = originalFindOne;
        Reminder.findOneAndUpdate = originalFindOneAndUpdate;
    }
});

test("reminder completion can be explicitly set and remains owner-scoped", async () => {
    const originalFindOne = Reminder.findOne;
    const reminderId = "507f1f77bcf86cd799439011";
    let saved = false;
    let requestedFilter;
    Reminder.findOne = async (filter) => {
        requestedFilter = filter;
        return {
            completed: false,
            async save() {
                saved = true;
            }
        };
    };
    const res = createResponse();

    try {
        await toggleReminder({
            params: { id: reminderId },
            user: { _id: "owner-id" },
            body: { completed: true }
        }, res);
        assert.deepEqual(requestedFilter, { _id: reminderId, user: "owner-id" });
        assert.equal(saved, true);
        assert.equal(res.body.data.completed, true);
    } finally {
        Reminder.findOne = originalFindOne;
    }
});
