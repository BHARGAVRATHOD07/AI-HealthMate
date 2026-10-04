const Medication = require("../models/Medication");

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
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/medications/:id — update medication or refill count
const updateMedication = async (req, res) => {
    try {
        const medication = await Medication.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
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
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getMedications, createMedication, updateMedication, deleteMedication };
