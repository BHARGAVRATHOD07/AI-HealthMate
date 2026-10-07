const Vital = require("../models/Vital");
const { logInternalError } = require("../utils/errorLogging");

// GET /api/vitals — get user's vitals (with optional type filtering or pagination)
const getVitals = async (req, res) => {
    try {
        const { type, limit } = req.query;
        const query = { user: req.user._id };
        if (type) query.type = type;

        const vitals = await Vital.find(query)
            .sort({ loggedAt: -1 })
            .limit(limit ? parseInt(limit) : 50);

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

        if (!type || !value || !unit) {
            return res.status(400).json({
                success: false,
                message: "Type, value, and unit are required."
            });
        }

        const parsedLoggedAt = loggedAt ? new Date(loggedAt) : undefined;
        if (loggedAt && Number.isNaN(parsedLoggedAt.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Vital reading date must be a valid date."
            });
        }

        const vital = await Vital.create({
            user: req.user._id,
            type,
            value,
            unit,
            status: status || "Normal",
            notes: notes || "",
            ...(parsedLoggedAt ? { loggedAt: parsedLoggedAt } : {})
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

module.exports = { getVitals, createVital, deleteVital };
