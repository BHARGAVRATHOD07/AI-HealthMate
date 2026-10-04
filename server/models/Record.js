const mongoose = require("mongoose");

const recordSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            enum: ["Lab Report", "Prescription", "Imaging", "Doctor Note", "Vaccination"],
            default: "Lab Report"
        },
        doctorName: {
            type: String,
            default: "Dr. Smith"
        },
        facility: {
            type: String,
            default: "City Health Hospital"
        },
        date: {
            type: Date,
            default: Date.now
        },
        summary: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["Final", "Pending", "Archived"],
            default: "Final"
        }
    },
    {
        timestamps: true
    }
);

recordSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model("Record", recordSchema);
