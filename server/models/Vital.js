const mongoose = require("mongoose");

const vitalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            required: true,
            enum: ["Blood Pressure", "Heart Rate", "Blood Sugar", "Weight", "Oxygen Level", "Temperature"]
        },
        value: {
            type: String,
            required: true
        },
        unit: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["Normal", "Warning", "Critical", "Elevated"],
            default: "Normal"
        },
        notes: {
            type: String,
            default: ""
        },
        loggedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

vitalSchema.index({ user: 1, loggedAt: -1 });

module.exports = mongoose.model("Vital", vitalSchema);
