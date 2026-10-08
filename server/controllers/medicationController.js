const mongoose = require("mongoose");
const Medication = require("../models/Medication");
const { logInternalError } = require("../utils/errorLogging");

const medicationFields = [
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
const medicationStatuses = ["Active", "Completed", "Paused"];

const isValidDate = (value) => {
    if (value === undefined || value === null || value === "") return true;
    if (value instanceof Date) return !Number.isNaN(value.getTime());
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const dateOnlyValue = (value) => value instanceof Date ? value.toISOString().slice(0, 10) : value;

const validateMedication = (medication) => {
    const textLimits = {
        name: 120,
        dosage: 80,
        frequency: 100,
        timing: 120,
        prescribedBy: 120,
        instructions: 1000
    };

    for (const [field, maxLength] of Object.entries(textLimits)) {
        const value = medication[field];
        if (value !== undefined && value !== null) {
            if (typeof value !== "string" || value.length > maxLength || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) {
                return `${field} must be text of at most ${maxLength} characters.`;
            }
            if (["name", "dosage", "frequency"].includes(field) && !value.trim()) {
                return `${field} is required.`;
            }
        }
    }

    for (const field of ["name", "dosage", "frequency"]) {
        if (typeof medication[field] !== "string" || !medication[field].trim()) {
            return `${field} is required.`;
        }
    }

    if (medication.status !== undefined && !medicationStatuses.includes(medication.status)) {
        return "Status must be Active, Completed, or Paused.";
    }

    for (const field of ["startDate", "endDate"]) {
        if (!isValidDate(medication[field])) {
            return `${field} must be a valid date in YYYY-MM-DD format.`;
        }
    }

    if (medication.startDate && medication.endDate
        && dateOnlyValue(medication.endDate) < dateOnlyValue(medication.startDate)) {
        return "End date cannot be earlier than start date.";
    }

    for (const field of ["refillsLeft", "totalRefills"]) {
        if (medication[field] !== undefined && medication[field] !== null
            && (!Number.isInteger(medication[field]) || medication[field] < 0 || medication[field] > 1000)) {
            return `${field} must be a whole number between 0 and 1000.`;
        }
    }

    if (medication.refillsLeft !== undefined && medication.refillsLeft !== null
        && medication.totalRefills !== undefined && medication.totalRefills !== null
        && medication.refillsLeft > medication.totalRefills) {
        return "refillsLeft cannot exceed totalRefills.";
    }

    return null;
};

const getMedicationFields = (body) => Object.fromEntries(
    medicationFields
        .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
        .map((field) => [field, body[field]])
);

const normalizeMedicationFields = (fields) => Object.fromEntries(
    Object.entries(fields).map(([field, value]) => [
        field,
        typeof value === "string"
            ? (["startDate", "endDate"].includes(field) && !value.trim() ? null : value.trim())
            : value
    ])
);

// @desc    Get all medications for logged-in user
// @route   GET /api/medications
const getMedications = async (req, res) => {
    try {
        const medications = await Medication.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: medications.length, data: medications });
    } catch (error) {
        logInternalError("Get medications", error);
        res.status(500).json({ success: false, message: "Failed to fetch medications." });
    }
};

// @desc    Add a new medication
// @route   POST /api/medications
const createMedication = async (req, res) => {
    try {
        const fields = normalizeMedicationFields(getMedicationFields(req.body || {}));
        if (!fields.startDate) {
            return res.status(400).json({ success: false, message: "startDate is required." });
        }
        const validationError = validateMedication(fields);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const medication = await Medication.create({
            ...fields,
            user: req.user._id
        });
        res.status(201).json({ success: true, data: medication });
    } catch (error) {
        logInternalError("Create medication", error);
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ success: false, message: "Medication details are invalid." });
        }
        res.status(500).json({ success: false, message: "Failed to create medication." });
    }
};

// @desc    Update a medication
// @route   PUT /api/medications/:id
const updateMedication = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: "Medication not found." });
        }

        const medication = await Medication.findOne({
            _id: req.params.id,
            user: req.user._id
        });
        if (!medication) {
            return res.status(404).json({ success: false, message: "Medication not found." });
        }

        const fields = normalizeMedicationFields(getMedicationFields(req.body || {}));
        if (Object.keys(fields).length === 0) {
            return res.status(400).json({ success: false, message: "Provide at least one medication field to update." });
        }
        if (fields.startDate === null || fields.startDate === "") {
            return res.status(400).json({ success: false, message: "startDate is required." });
        }

        const validationError = validateMedication({ ...medication.toObject(), ...fields });
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const updatedMedication = await Medication.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: fields },
            { new: true, runValidators: true }
        );
        if (!updatedMedication) {
            return res.status(404).json({ success: false, message: "Medication not found." });
        }

        res.status(200).json({ success: true, data: updatedMedication });
    } catch (error) {
        logInternalError("Update medication", error);
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ success: false, message: "Medication details are invalid." });
        }
        res.status(500).json({ success: false, message: "Failed to update medication." });
    }
};

// @desc    Mark a medication as taken or not taken today
// @route   PATCH /api/medications/:id/taken
const setMedicationTaken = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: "Medication not found." });
        }
        if (typeof req.body?.taken !== "boolean") {
            return res.status(400).json({ success: false, message: "Taken must be a boolean." });
        }

        const medication = await Medication.findOne({ _id: req.params.id, user: req.user._id });
        if (!medication) {
            return res.status(404).json({ success: false, message: "Medication not found." });
        }

        medication.lastTakenAt = req.body.taken ? new Date() : null;
        await medication.save();
        res.status(200).json({ success: true, data: medication });
    } catch (error) {
        logInternalError("Update medication taken status", error);
        res.status(500).json({ success: false, message: "Failed to update medication status." });
    }
};

// @desc    Delete a medication
// @route   DELETE /api/medications/:id
const deleteMedication = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: "Medication not found." });
        }
        const medication = await Medication.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!medication) {
            return res.status(404).json({ success: false, message: "Medication not found." });
        }
        res.status(200).json({ success: true, message: "Medication removed." });
    } catch (error) {
        logInternalError("Delete medication", error);
        res.status(500).json({ success: false, message: "Failed to delete medication." });
    }
};

module.exports = { createMedication, deleteMedication, getMedications, setMedicationTaken, updateMedication };
