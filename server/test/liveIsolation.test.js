const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const Vital = require("../models/Vital");
const Record = require("../models/Record");
const Medication = require("../models/Medication");
const Reminder = require("../models/Reminder");
const { getHealthSummary, setCustomChatExecutorForTesting } = require("../controllers/aiController");

test("Live MongoDB Cross-User Isolation: User A and User B maintain strict isolation", async () => {
    if (!process.env.MONGODB_URI) {
        console.log("Skipping live DB isolation test: MONGODB_URI not provided.");
        return;
    }

    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI);
    }

    const testTag = `live_${Date.now()}`;
    let userA = null;
    let userB = null;

    setCustomChatExecutorForTesting(async () => ({
        reply: JSON.stringify({
            observations: ["Live database observation for isolated user."],
            missingInformation: ["None"]
        })
    }));

    try {
        // 1. Create two isolated test users
        userA = await User.create({
            name: `Alice_${testTag}`,
            email: `alice_${testTag}@example.com`,
            password: "TestPassword123!",
            healthProfile: { height: "165 cm", weight: "60 kg", bloodGroup: "A+" }
        });

        userB = await User.create({
            name: `Bob_${testTag}`,
            email: `bob_${testTag}@example.com`,
            password: "TestPassword123!",
            healthProfile: { height: "185 cm", weight: "88 kg", bloodGroup: "B-" }
        });

        // 2. Insert distinct data for User A
        await Vital.create({
            user: userA._id,
            type: "Heart Rate",
            value: "68",
            unit: "BPM",
            status: "Normal",
            loggedAt: new Date()
        });

        await Record.create({
            user: userA._id,
            title: `ALICE_RECORD_${testTag}`,
            category: "Lab Report",
            date: new Date(),
            summary: "Alice specific clinical record"
        });

        await Medication.create({
            user: userA._id,
            name: `ALICE_MED_${testTag}`,
            dosage: "250 mg",
            frequency: "Daily",
            status: "Active"
        });

        await Reminder.create({
            user: userA._id,
            title: `ALICE_REMINDER_${testTag}`,
            category: "Appointment",
            date: "2026-11-01",
            time: "10:00",
            repeat: "Once",
            completed: false
        });

        // 3. Insert distinct data for User B
        await Vital.create({
            user: userB._id,
            type: "Heart Rate",
            value: "92",
            unit: "BPM",
            status: "Elevated",
            loggedAt: new Date()
        });

        await Record.create({
            user: userB._id,
            title: `BOB_RECORD_${testTag}`,
            category: "Doctor Note",
            date: new Date(),
            summary: "Bob specific cardiology assessment"
        });

        await Medication.create({
            user: userB._id,
            name: `BOB_MED_${testTag}`,
            dosage: "50 mg",
            frequency: "Twice daily",
            status: "Active"
        });

        await Reminder.create({
            user: userB._id,
            title: `BOB_REMINDER_${testTag}`,
            category: "Medication",
            date: "2026-11-05",
            time: "14:00",
            repeat: "Daily",
            completed: false
        });

        // Helper mock res
        const createRes = () => ({
            statusCode: 200,
            body: null,
            status(code) { this.statusCode = code; return this; },
            json(data) { this.body = data; return this; }
        });

        // 4. Request User A summary with attempted injection of User B ID in body
        const reqA = { user: { _id: userA._id }, body: { userId: userB._id.toString() } };
        const resA = createRes();
        await getHealthSummary(reqA, resA);

        assert.equal(resA.statusCode, 200);
        assert.equal(resA.body.success, true);
        const dataAStr = JSON.stringify(resA.body.data);

        // Verify User A data is present
        assert.ok(dataAStr.includes(`Alice_${testTag}`));
        assert.ok(dataAStr.includes(`ALICE_RECORD_${testTag}`));
        assert.ok(dataAStr.includes(`ALICE_MED_${testTag}`));
        assert.ok(dataAStr.includes(`ALICE_REMINDER_${testTag}`));
        assert.ok(dataAStr.includes("68 BPM"));

        // Verify User B data is NEVER present in User A's summary
        assert.ok(!dataAStr.includes(`Bob_${testTag}`));
        assert.ok(!dataAStr.includes(`BOB_RECORD_${testTag}`));
        assert.ok(!dataAStr.includes(`BOB_MED_${testTag}`));
        assert.ok(!dataAStr.includes(`BOB_REMINDER_${testTag}`));
        assert.ok(!dataAStr.includes("92 BPM"));

        // 5. Request User B summary with attempted injection of User A ID in query
        const reqB = { user: { _id: userB._id }, query: { userId: userA._id.toString() } };
        const resB = createRes();
        await getHealthSummary(reqB, resB);

        assert.equal(resB.statusCode, 200);
        assert.equal(resB.body.success, true);
        const dataBStr = JSON.stringify(resB.body.data);

        // Verify User B data is present
        assert.ok(dataBStr.includes(`Bob_${testTag}`));
        assert.ok(dataBStr.includes(`BOB_RECORD_${testTag}`));
        assert.ok(dataBStr.includes(`BOB_MED_${testTag}`));
        assert.ok(dataBStr.includes(`BOB_REMINDER_${testTag}`));
        assert.ok(dataBStr.includes("92 BPM"));

        // Verify User A data is NEVER present in User B's summary
        assert.ok(!dataBStr.includes(`Alice_${testTag}`));
        assert.ok(!dataBStr.includes(`ALICE_RECORD_${testTag}`));
        assert.ok(!dataBStr.includes(`ALICE_MED_${testTag}`));
        assert.ok(!dataBStr.includes(`ALICE_REMINDER_${testTag}`));
        assert.ok(!dataBStr.includes("68 BPM"));

    } finally {
        setCustomChatExecutorForTesting(null);
        // Clean up temporary live test data
        if (userA) {
            await Vital.deleteMany({ user: userA._id });
            await Record.deleteMany({ user: userA._id });
            await Medication.deleteMany({ user: userA._id });
            await Reminder.deleteMany({ user: userA._id });
            await User.deleteOne({ _id: userA._id });
        }
        if (userB) {
            await Vital.deleteMany({ user: userB._id });
            await Record.deleteMany({ user: userB._id });
            await Medication.deleteMany({ user: userB._id });
            await Reminder.deleteMany({ user: userB._id });
            await User.deleteOne({ _id: userB._id });
        }
        await mongoose.disconnect();
    }
});
