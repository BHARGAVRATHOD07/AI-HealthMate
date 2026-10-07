const { test } = require("node:test");
const assert = require("node:assert/strict");
const User = require("../models/User");
const { updateMe } = require("../controllers/authController");

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

test("profile updates use only the authenticated user's id and allowlisted fields", async () => {
    const originalFindByIdAndUpdate = User.findByIdAndUpdate;
    let capturedId;
    let capturedUpdate;
    User.findByIdAndUpdate = async (id, update) => {
        capturedId = id;
        capturedUpdate = update;
        return {
            _id: id,
            name: update.$set.name,
            email: "patient@example.test",
            healthProfile: { height: "178 cm" }
        };
    };

    try {
        const res = createResponse();
        await updateMe({
            user: { _id: "authenticated-user-id", email: "patient@example.test" },
            body: {
                name: "  Updated Patient  ",
                email: "patient@example.test",
                userId: "attacker-selected-user-id",
                healthProfile: { height: "178 cm" }
            }
        }, res);

        assert.equal(capturedId, undefined);
        assert.equal(res.statusCode, 400);
    } finally {
        User.findByIdAndUpdate = originalFindByIdAndUpdate;
    }
});

test("profile update trims values and persists against the authenticated user only", async () => {
    const originalFindByIdAndUpdate = User.findByIdAndUpdate;
    let capturedId;
    let capturedUpdate;
    User.findByIdAndUpdate = async (id, update) => {
        capturedId = id;
        capturedUpdate = update;
        return {
            _id: id,
            name: update.$set.name,
            email: "patient@example.test",
            healthProfile: { height: update.$set["healthProfile.height"] }
        };
    };

    try {
        const res = createResponse();
        await updateMe({
            user: { _id: "authenticated-user-id", email: "patient@example.test" },
            body: {
                name: "  Updated Patient  ",
                email: "patient@example.test",
                healthProfile: { height: " 178 cm " }
            }
        }, res);

        assert.equal(res.statusCode, 200);
        assert.equal(capturedId, "authenticated-user-id");
        assert.deepEqual(capturedUpdate, {
            $set: {
                name: "Updated Patient",
                "healthProfile.height": "178 cm"
            }
        });
        assert.equal(res.body.data.email, "patient@example.test");
        assert.equal(res.body.data.name, "Updated Patient");
    } finally {
        User.findByIdAndUpdate = originalFindByIdAndUpdate;
    }
});

test("profile update rejects email changes", async () => {
    const originalFindByIdAndUpdate = User.findByIdAndUpdate;
    User.findByIdAndUpdate = async () => {
        throw new Error("Must not update when email is changed.");
    };

    try {
        const res = createResponse();
        await updateMe({
            user: { _id: "authenticated-user-id", email: "patient@example.test" },
            body: { name: "Updated Patient", email: "attacker@example.test" }
        }, res);

        assert.equal(res.statusCode, 409);
        assert.match(res.body.message, /Email changes are not available/);
    } finally {
        User.findByIdAndUpdate = originalFindByIdAndUpdate;
    }
});

test("profile update rejects invalid health values and ownership injection", async (t) => {
    const originalFindByIdAndUpdate = User.findByIdAndUpdate;
    User.findByIdAndUpdate = async () => {
        throw new Error("Must not persist invalid data.");
    };

    const cases = [
        ["future date", { dateOfBirth: "2999-01-01" }],
        ["unsupported gender", { gender: "Unknown" }],
        ["out-of-range height", { height: "500 cm" }],
        ["out-of-range weight", { weight: "900 kg" }],
        ["invalid phone", { emergencyPhone: "not a phone" }],
        ["profile ownership injection", { user: "attacker-selected-user-id" }]
    ];

    try {
        for (const [name, healthProfile] of cases) {
            await t.test(name, async () => {
                const res = createResponse();
                await updateMe({
                    user: { _id: "authenticated-user-id", email: "patient@example.test" },
                    body: { healthProfile }
                }, res);
                assert.equal(res.statusCode, 400);
                assert.equal(res.body.success, false);
            });
        }
    } finally {
        User.findByIdAndUpdate = originalFindByIdAndUpdate;
    }
});

test("profile update returns not found when the authenticated user no longer exists", async () => {
    const originalFindByIdAndUpdate = User.findByIdAndUpdate;
    User.findByIdAndUpdate = async () => null;

    try {
        const res = createResponse();
        await updateMe({
            user: { _id: "deleted-user-id", email: "patient@example.test" },
            body: { name: "Updated Patient" }
        }, res);

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.success, false);
    } finally {
        User.findByIdAndUpdate = originalFindByIdAndUpdate;
    }
});
