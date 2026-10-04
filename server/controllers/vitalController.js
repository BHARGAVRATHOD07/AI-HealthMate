const Vital = require("../models/Vital");

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
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/vitals — log a new vital reading
const createVital = async (req, res) => {
    try {
        const { type, value, unit, status, notes } = req.body;

        if (!type || !value || !unit) {
            return res.status(400).json({
                success: false,
                message: "Type, value, and unit are required."
            });
        }

        const vital = await Vital.create({
            user: req.user._id,
            type,
            value,
            unit,
            status: status || "Normal",
            notes: notes || ""
        });

        res.status(201).json({
            success: true,
            data: vital
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getVitals, createVital, deleteVital };
