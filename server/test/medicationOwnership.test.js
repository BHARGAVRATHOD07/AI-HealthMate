const { test } = require("node:test");
const assert = require("node:assert/strict");
const Medication = require("../models/Medication");
const { updateMedication } = require("../controllers/medicationController");

test("medication updates cannot change ownership or submit MongoDB operators", async () => {
    const originalFindOneAndUpdate = Medication.findOneAndUpdate;
    const originalFindOne = Medication.findOne;
    const medicationId = "507f1f77bcf86cd799439011";
    let capturedFilter;
    let capturedUpdate;

    Medication.findOne = async (filter) => {
        assert.deepEqual(filter, { _id: medicationId, user: "owner-id" });
        return {
            toObject() {
                return {
                    name: "Existing medicine",
                    dosage: "10 mg",
                    frequency: "Once daily",
                    startDate: new Date("2025-01-01T00:00:00.000Z")
                };
            }
        };
    };
    Medication.findOneAndUpdate = async (filter, update) => {
        capturedFilter = filter;
        capturedUpdate = update;
        return { _id: medicationId, user: "owner-id", toObject() { return this; } };
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
            params: { id: medicationId },
            user: { _id: "owner-id" },
            body: {
                name: "Updated medicine",
                user: "attacker-selected-user-id",
                $set: { user: "attacker-selected-user-id" }
            }
        }, res);

        assert.deepEqual(capturedFilter, { _id: medicationId, user: "owner-id" });
        assert.deepEqual(capturedUpdate, { $set: { name: "Updated medicine" } });
        assert.equal(res.statusCode, 200);
    } finally {
        Medication.findOneAndUpdate = originalFindOneAndUpdate;
        Medication.findOne = originalFindOne;
    }
});
