const mongoose = require("mongoose");
const Record = require("../models/Record");
const { logInternalError } = require("../utils/errorLogging");

const allowedRecordCategories = ["Lab Report", "Prescription", "Imaging", "Doctor Note", "Vaccination"];
const allowedRecordStatuses = ["Final", "Pending", "Archived"];
const recordFieldLimits = {
    title: 150,
    doctorName: 120,
    facility: 140,
    summary: 2000
};

const validateText = (value, field, label, { required = false } = {}) => {
    if (value === undefined || value === null) {
        return required
            ? { isValid: false, message: `${label} is required.` }
            : { isValid: true, value: "" };
    }

    if (typeof value !== "string") {
        return { isValid: false, message: `${label} must be text.` };
    }

    const text = value.trim();
    if (required && !text) {
        return { isValid: false, message: `${label} is required.` };
    }
    if (text.length > recordFieldLimits[field]) {
        return { isValid: false, message: `${label} must be ${recordFieldLimits[field]} characters or fewer.` };
    }

    return { isValid: true, value: text };
};

const validateRecordDate = (value) => {
    if (value === undefined || value === null || value === "") {
        return { isValid: true, value: undefined };
    }
    if (typeof value !== "string") {
        return { isValid: false, message: "Record date must be a valid date." };
    }

    const dateText = value.trim();
    const dateOnlyMatch = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
        const parsed = new Date(`${dateText}T00:00:00.000Z`);
        if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === dateText) {
            return { isValid: true, value: parsed };
        }
        return { isValid: false, message: "Record date must be a valid date." };
    }

    const parsed = new Date(dateText);
    if (!/^\d{4}-\d{2}-\d{2}T/.test(dateText) || Number.isNaN(parsed.getTime())) {
        return { isValid: false, message: "Record date must be a valid date." };
    }
    return { isValid: true, value: parsed };
};

const validateRecordInput = ({ title, category, doctorName, facility, summary, status, date }) => {
    const validatedTitle = validateText(title, "title", "Title", { required: true });
    const validatedDoctor = validateText(doctorName, "doctorName", "Doctor name");
    const validatedFacility = validateText(facility, "facility", "Facility");
    const validatedSummary = validateText(summary, "summary", "Summary");
    const validatedDate = validateRecordDate(date);

    for (const validation of [validatedTitle, validatedDoctor, validatedFacility, validatedSummary, validatedDate]) {
        if (!validation.isValid) {
            return validation;
        }
    }

    const normalizedCategory = category === undefined || category === null
        ? "Lab Report"
        : typeof category === "string" ? category.trim() : "";
    if (!allowedRecordCategories.includes(normalizedCategory)) {
        return { isValid: false, message: "Record category is invalid." };
    }

    const normalizedStatus = status === undefined || status === null
        ? "Final"
        : typeof status === "string" ? status.trim() : "";
    if (!allowedRecordStatuses.includes(normalizedStatus)) {
        return { isValid: false, message: "Record status is invalid." };
    }

    return {
        isValid: true,
        payload: {
            title: validatedTitle.value,
            category: normalizedCategory,
            doctorName: validatedDoctor.value,
            facility: validatedFacility.value,
            summary: validatedSummary.value,
            status: normalizedStatus,
            ...(validatedDate.value ? { date: validatedDate.value } : {})
        }
    };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/records — get user's health records
const getRecords = async (req, res) => {
    try {
        const { category, search, status, sort } = req.query;
        const query = { user: req.user._id };

        if (category && category !== "All") {
            if (!allowedRecordCategories.includes(category)) {
                return res.status(400).json({ success: false, message: "Record category filter is invalid." });
            }
            query.category = category;
        }

        if (status && status !== "All") {
            if (!allowedRecordStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: "Record status filter is invalid." });
            }
            query.status = status;
        }

        if (search) {
            const safeSearch = String(search).trim();
            if (safeSearch.length > 100) {
                return res.status(400).json({ success: false, message: "Search must be 100 characters or fewer." });
            }
            if (safeSearch) {
                const searchExpression = new RegExp(escapeRegex(safeSearch), "i");
                query.$or = [
                    { title: searchExpression },
                    { category: searchExpression },
                    { doctorName: searchExpression },
                    { facility: searchExpression }
                ];
            }
        }

        const sortOrder = sort === "oldest" ? 1 : -1;
        const records = await Record.find(query).sort({ date: sortOrder, createdAt: sortOrder });

        res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (error) {
        logInternalError("Get health records", error);
        res.status(500).json({ success: false, message: "Could not retrieve health records." });
    }
};

// GET /api/records/:id — get one of the authenticated user's records
const getRecord = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ success: false, message: "Record not found." });
    }

    try {
        const record = await Record.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!record) {
            return res.status(404).json({ success: false, message: "Record not found." });
        }

        res.status(200).json({ success: true, data: record });
    } catch (error) {
        logInternalError("Get health record", error);
        res.status(500).json({ success: false, message: "Could not retrieve the health record." });
    }
};

// POST /api/records — create new health record
const createRecord = async (req, res) => {
    try {
        const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
        const { title, category, doctorName, facility, summary, status, date } = body;
        const validation = validateRecordInput({ title, category, doctorName, facility, summary, status, date });

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const record = await Record.create({
            user: req.user._id,
            ...validation.payload
        });

        res.status(201).json({
            success: true,
            data: record
        });
    } catch (error) {
        logInternalError("Create health record", error);
        res.status(500).json({ success: false, message: "Could not save the health record." });
    }
};

// PUT /api/records/:id — update a health record
const updateRecord = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ success: false, message: "Record not found." });
    }

    try {
        const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
        const { title, category, doctorName, facility, summary, status, date } = body;
        const validation = validateRecordInput({ title, category, doctorName, facility, summary, status, date });

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const record = await Record.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: validation.payload },
            { new: true }
        );

        if (!record) {
            return res.status(404).json({ success: false, message: "Record not found." });
        }

        res.status(200).json({
            success: true,
            data: record
        });
    } catch (error) {
        logInternalError("Update health record", error);
        res.status(500).json({ success: false, message: "Could not update the health record." });
    }
};

// DELETE /api/records/:id
const deleteRecord = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ success: false, message: "Record not found." });
    }

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
        logInternalError("Delete health record", error);
        res.status(500).json({ success: false, message: "Could not delete the health record." });
    }
};

module.exports = { getRecords, getRecord, createRecord, updateRecord, deleteRecord, allowedRecordCategories, allowedRecordStatuses };
