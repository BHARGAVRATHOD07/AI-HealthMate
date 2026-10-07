const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            select: false   // never returned in queries unless explicitly: .select("+password")
        },

        healthProfile: {
            dateOfBirth: { type: String, default: "" },
            gender: { type: String, default: "" },
            phone: { type: String, default: "" },
            address: { type: String, default: "" },
            height: { type: String, default: "" },
            weight: { type: String, default: "" },
            bloodGroup: { type: String, default: "" },
            allergies: { type: String, default: "" },
            existingConditions: { type: String, default: "" },
            emergencyName: { type: String, default: "" },
            emergencyRelation: { type: String, default: "" },
            emergencyPhone: { type: String, default: "" }
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;