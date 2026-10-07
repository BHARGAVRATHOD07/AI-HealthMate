const Medication = require("../models/Medication");
const { logInternalError } = require("../utils/errorLogging");

const serializeMedication = (medication) => medication.toObject();

// GET /api/medications — get user's medications
const getMedications = async (req, res) => {
    try {
        const medications = await Medication.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: medications.length,
            data: medications
        });
    } catch (error) {
        logInternalError("Get medications", error);
        res.status(500).json({ success: false, message: "Could not retrieve medications." });
    }
};

// POST /api/medications — create new medication
const createMedication = async (req, res) => {
    try {
        const { name, dosage, frequency, timing, prescribedBy, refillsLeft, totalRefills, instructions, status } = req.body;

        if (!name || !dosage || !frequency) {
            return res.status(400).json({
                success: false,
                message: "Name, dosage, and frequency are required."
            });
        }

        const medication = await Medication.create({
            user: req.user._id,
            name,
            dosage,
            frequency,
            timing: timing || "As directed",
            prescribedBy: prescribedBy || "Primary Physician",
            refillsLeft: refillsLeft !== undefined ? refillsLeft : 3,
            totalRefills: totalRefills !== undefined ? totalRefills : 5,
            instructions: instructions || "",
            status: status || "Active"
        });

        res.status(201).json({
            success: true,
            data: medication
        });
    } catch (error) {
        logInternalError("Create medication", error);
        res.status(500).json({ success: false, message: "Could not save the medication." });
    }
};

// PUT /api/medications/:id — update medication or refill count
const updateMedication = async (req, res) => {
    try {
        const allowedFields = [
            "name",
            "dosage",
            "frequency",
            "timing",
            "prescribedBy",
            "refillsLeft",
            "totalRefills",
            "instructions",
            "status",
            "startDate",
            "endDate"
        ];
        const updates = Object.fromEntries(
            allowedFields
                .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
                .map((field) => [field, req.body[field]])
        );

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one medication field must be provided."
            });
        }

        const medication = await Medication.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!medication) {
            return res.status(404).json({ success: false, message: "Medication not found." });
        }

        res.status(200).json({
            success: true,
            data: medication
        });
    } catch (error) {
        logInternalError("Update medication", error);
        res.status(500).json({ success: false, message: "Could not update the medication." });
    }
};

// PATCH /api/medications/:id/taken — record or undo today's dose
const setMedicationTaken = async (req, res) => {
    try {
        if (typeof req.body.taken !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Taken status must be a boolean."
            });
        }

        const medication = await Medication.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!medication) {
            return res.status(404).json({ success: false, message: "Medication not found." });
        }

        medication.lastTakenAt = req.body.taken ? new Date() : null;
        await medication.save();

        res.status(200).json({
            success: true,
            data: serializeMedication(medication)
        });
    } catch (error) {
        logInternalError("Update medication dose", error);
        res.status(500).json({ success: false, message: "Could not update medication status." });
    }
};

// DELETE /api/medications/:id
const deleteMedication = async (req, res) => {
    try {
        const medication = await Medication.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!medication) {
            return res.status(404).json({ success: false, message: "Medication not found." });
        }

        res.status(200).json({ success: true, message: "Medication deleted." });
    } catch (error) {
        logInternalError("Delete medication", error);
        res.status(500).json({ success: false, message: "Could not delete the medication." });
    }
};

module.exports = { getMedications, createMedication, updateMedication, setMedicationTaken, deleteMedication };
