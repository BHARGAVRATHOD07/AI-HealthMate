const { test } = require("node:test");
const assert = require("node:assert/strict");
const Medication = require("../models/Medication");
const { createMedication, updateMedication } = require("../controllers/medicationController");

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

test("medication creation validates dates and does not accept inferred prescription data", async () => {
    const originalCreate = Medication.create;
    let capturedMedication;
    Medication.create = async (medication) => {
        capturedMedication = medication;
        return medication;
    };
    const res = createResponse();

    try {
        await createMedication({
            user: { _id: "owner-id" },
            body: {
                user: "attacker-id",
                name: "  Medicine  ",
                dosage: "10 mg",
                frequency: "Once daily",
                startDate: "2026-06-20",
                endDate: "2026-06-19",
                prescribedBy: "Injected clinician",
                $set: { status: "Completed" }
            }
        }, res);

        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /earlier than start date/);
        assert.equal(capturedMedication, undefined);

        res.statusCode = 200;
        res.body = null;
        await createMedication({
            user: { _id: "owner-id" },
            body: {
                user: "attacker-id",
                name: "  Medicine  ",
                dosage: "10 mg",
                frequency: "Once daily",
                startDate: "2026-06-20",
                $set: { status: "Completed" }
            }
        }, res);

        assert.equal(res.statusCode, 201);
        assert.equal(capturedMedication.user, "owner-id");
        assert.equal(capturedMedication.name, "Medicine");
        assert.equal(capturedMedication.prescribedBy, undefined);
        assert.equal(capturedMedication.refillsLeft, undefined);
        assert.equal(capturedMedication.$set, undefined);
    } finally {
        Medication.create = originalCreate;
    }
});

test("medication updates validate date ranges against the owner's saved record", async () => {
    const originalFindOne = Medication.findOne;
    const originalFindOneAndUpdate = Medication.findOneAndUpdate;
    const medicationId = "507f1f77bcf86cd799439011";
    let updateCalled = false;
    Medication.findOne = async () => ({
        toObject() {
            return {
                name: "Medicine",
                dosage: "10 mg",
                frequency: "Once daily",
                startDate: new Date("2026-06-20T00:00:00.000Z")
            };
        }
    });
    Medication.findOneAndUpdate = async () => {
        updateCalled = true;
    };
    const res = createResponse();

    try {
        await updateMedication({
            params: { id: medicationId },
            user: { _id: "owner-id" },
            body: { endDate: "2026-06-19" }
        }, res);
        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /earlier than start date/);
        assert.equal(updateCalled, false);
    } finally {
        Medication.findOne = originalFindOne;
        Medication.findOneAndUpdate = originalFindOneAndUpdate;
    }
});
