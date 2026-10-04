const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
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
            enum: ["Medication", "Appointment", "Vitals Check", "Lab Test", "General"],
            default: "General"
        },
        time: {
            type: String,
            required: true
        },
        date: {
            type: String,
            default: "Today"
        },
        repeat: {
            type: String,
            enum: ["Daily", "Weekly", "Monthly", "Once"],
            default: "Daily"
        },
        completed: {
            type: Boolean,
            default: false
        },
        notes: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

reminderSchema.index({ user: 1, completed: 1 });

module.exports = mongoose.model("Reminder", reminderSchema);
