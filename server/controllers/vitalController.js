const Vital = require("../models/Vital");
const { logInternalError } = require("../utils/errorLogging");

const allowedVitalTypes = [
    "Blood Pressure",
    "Heart Rate",
    "Blood Sugar",
    "Weight",
    "Oxygen Level",
    "SpO2",
    "Temperature"
];

const normalizeVitalType = (value) => {
    if (!value || typeof value !== "string") return "";

    const trimmed = value.trim();
    if (!trimmed) return "";

    const normalized = trimmed.toLowerCase();
    if (normalized === "spo2" || normalized === "oxygen level" || normalized === "oxygen") {
        return "Oxygen Level";
    }

    return trimmed;
};

const parseBloodPressureValue = (value) => {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
    if (!match) return null;

    const systolic = Number.parseFloat(match[1]);
    const diastolic = Number.parseFloat(match[2]);

    if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) {
        return null;
    }

    return { systolic, diastolic, average: (systolic + diastolic) / 2 };
};

const parseNumericMeasurement = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value !== "string") return Number.NaN;

    const trimmed = value.trim();
    if (!trimmed) return Number.NaN;

    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const validateVitalInput = ({ type, value, unit, loggedAt }) => {
    if (!type || !value || !unit) {
        return { isValid: false, message: "Type, value, and unit are required." };
    }

    const normalizedType = normalizeVitalType(type);
    if (!allowedVitalTypes.includes(normalizedType)) {
        return { isValid: false, message: "Unsupported vital type." };
    }

    if (loggedAt) {
        const parsedLoggedAt = new Date(loggedAt);
        if (Number.isNaN(parsedLoggedAt.getTime())) {
            return { isValid: false, message: "Vital reading date must be a valid date." };
        }
    }

    const numericValue = parseNumericMeasurement(value);

    switch (normalizedType) {
        case "Weight": {
            if (Number.isNaN(numericValue) || numericValue <= 0 || numericValue > 500) {
                return { isValid: false, message: "Weight must be a positive number below 500 kg." };
            }
            return { isValid: true, normalizedType, value: String(numericValue), unit };
        }
        case "Heart Rate": {
            if (Number.isNaN(numericValue) || numericValue < 20 || numericValue > 250) {
                return { isValid: false, message: "Heart rate must be a valid number between 20 and 250 bpm." };
            }
            return { isValid: true, normalizedType, value: String(numericValue), unit };
        }
        case "Blood Sugar": {
            if (Number.isNaN(numericValue) || numericValue < 20 || numericValue > 600) {
                return { isValid: false, message: "Blood sugar must be a valid number between 20 and 600 mg/dL." };
            }
            return { isValid: true, normalizedType, value: String(numericValue), unit };
        }
        case "Oxygen Level": {
            if (Number.isNaN(numericValue) || numericValue < 30 || numericValue > 100) {
                return { isValid: false, message: "SpO2 must be a valid number between 30% and 100%." };
            }
            return { isValid: true, normalizedType, value: String(numericValue), unit };
        }
        case "Temperature": {
            if (Number.isNaN(numericValue) || numericValue < 30 || numericValue > 115) {
                return { isValid: false, message: "Temperature must be a valid number between 30 and 115." };
            }
            return { isValid: true, normalizedType, value: String(numericValue), unit };
        }
        case "Blood Pressure": {
            const parsedBp = parseBloodPressureValue(value);
            if (!parsedBp) {
                return {
                    isValid: false,
                    message: "Blood pressure must use the format 120/80 mmHg."
                };
            }

            if (parsedBp.systolic < 40 || parsedBp.systolic > 260 || parsedBp.diastolic < 20 || parsedBp.diastolic > 180) {
                return {
                    isValid: false,
                    message: "Blood pressure values appear out of a realistic range. Please recheck the measurement."
                };
            }

            return {
                isValid: true,
                normalizedType,
                value: `${parsedBp.systolic}/${parsedBp.diastolic}`,
                unit
            };
        }
        default:
            return { isValid: false, message: "Unsupported vital type." };
    }
};

// GET /api/vitals — get user's vitals (with optional type filtering or pagination)
const getVitals = async (req, res) => {
    try {
        const { type, limit } = req.query;
        const query = { user: req.user._id };
        if (type) {
            const normalizedType = normalizeVitalType(type);
            query.type = normalizedType;
        }

        const vitals = await Vital.find(query)
            .sort({ loggedAt: -1 })
            .limit(limit ? Math.min(parseInt(limit, 10) || 50, 200) : 200);

        res.status(200).json({
            success: true,
            count: vitals.length,
            data: vitals
        });
    } catch (error) {
        logInternalError("Get vitals", error);
        res.status(500).json({ success: false, message: "Could not retrieve vital readings." });
    }
};

// POST /api/vitals — log a new vital reading
const createVital = async (req, res) => {
    try {
        const { type, value, unit, status, notes, loggedAt } = req.body;

        const validation = validateVitalInput({ type, value, unit, loggedAt });
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const parsedLoggedAt = loggedAt ? new Date(loggedAt) : new Date();
        const finalStatus = ["Normal", "Warning", "Critical", "Elevated"].includes(status) ? status : "Normal";

        const vital = await Vital.create({
            user: req.user._id,
            type: validation.normalizedType,
            value: validation.value,
            unit,
            status: finalStatus,
            notes: notes || "",
            loggedAt: parsedLoggedAt
        });

        res.status(201).json({
            success: true,
            data: vital
        });
    } catch (error) {
        logInternalError("Create vital", error);
        res.status(500).json({ success: false, message: "Could not save the vital reading." });
    }
};

// DELETE /api/vitals/:id
const deleteVital = async (req, res) => {
    try {
        const vital = await Vital.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!vital) {
            return res.status(404).json({ success: false, message: "Vital record not found." });
        }

        res.status(200).json({ success: true, message: "Vital reading deleted." });
    } catch (error) {
        logInternalError("Delete vital", error);
        res.status(500).json({ success: false, message: "Could not delete the vital reading." });
    }
};

module.exports = { getVitals, createVital, deleteVital, normalizeVitalType };
