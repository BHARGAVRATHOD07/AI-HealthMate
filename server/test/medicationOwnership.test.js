const { test } = require("node:test");
const assert = require("node:assert/strict");
const Medication = require("../models/Medication");
const { updateMedication } = require("../controllers/medicationController");

test("medication updates cannot change ownership or submit MongoDB operators", async () => {
    const originalFindOneAndUpdate = Medication.findOneAndUpdate;
    let capturedFilter;
    let capturedUpdate;

    Medication.findOneAndUpdate = async (filter, update) => {
        capturedFilter = filter;
        capturedUpdate = update;
        return { _id: "medication-id", user: "owner-id", toObject() { return this; } };
    };

    const res = {
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
    };

    try {
        await updateMedication({
            params: { id: "medication-id" },
            user: { _id: "owner-id" },
            body: {
                name: "Updated medicine",
                user: "attacker-selected-user-id",
                $set: { user: "attacker-selected-user-id" }
            }
        }, res);

        assert.deepEqual(capturedFilter, { _id: "medication-id", user: "owner-id" });
        assert.deepEqual(capturedUpdate, { $set: { name: "Updated medicine" } });
        assert.equal(res.statusCode, 200);
    } finally {
        Medication.findOneAndUpdate = originalFindOneAndUpdate;
    }
});
