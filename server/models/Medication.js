const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        dosage: {
            type: String,
            required: true
        },
        frequency: {
            type: String,
            required: true
        },
        timing: {
            type: String,
            default: "As directed"
        },
        prescribedBy: {
            type: String,
            default: "Primary Physician"
        },
        refillsLeft: {
            type: Number,
            default: 0
        },
        totalRefills: {
            type: Number,
            default: 5
        },
        instructions: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["Active", "Completed", "Paused"],
            default: "Active"
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date
        },
        lastTakenAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

medicationSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Medication", medicationSchema);
