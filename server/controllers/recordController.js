const Record = require("../models/Record");

// GET /api/records — get user's health records
const getRecords = async (req, res) => {
    try {
        const { category, search } = req.query;
        const query = { user: req.user._id };

        if (category && category !== "All") {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { doctorName: { $regex: search, $options: "i" } },
                { facility: { $regex: search, $options: "i" } }
            ];
        }

        const records = await Record.find(query).sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/records — create new health record
const createRecord = async (req, res) => {
    try {
        const { title, category, doctorName, facility, summary, status, date } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Record title is required."
            });
        }

        const parsedDate = date ? new Date(date) : undefined;
        if (date && Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Record date must be a valid date."
            });
        }

        const record = await Record.create({
            user: req.user._id,
            title,
            category: category || "Lab Report",
            doctorName: doctorName || "Primary Care Physician",
            facility: facility || "City Health Clinic",
            summary: summary || "",
            status: status || "Final",
            ...(parsedDate ? { date: parsedDate } : {})
        });

        res.status(201).json({
            success: true,
            data: record
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/records/:id
const deleteRecord = async (req, res) => {
    try {
        const record = await Record.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!record) {
            return res.status(404).json({ success: false, message: "Record not found." });
        }

        res.status(200).json({ success: true, message: "Record deleted." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getRecords, createRecord, deleteRecord };
