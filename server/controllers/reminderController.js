const mongoose = require("mongoose");
const Reminder = require("../models/Reminder");
const { logInternalError } = require("../utils/errorLogging");

const reminderFields = ["title", "category", "time", "date", "repeat", "notes", "completed"];
const reminderCategories = ["Medication", "Appointment", "Vitals Check", "Lab Test", "General"];
const repeatSchedules = ["Daily", "Weekly", "Monthly", "Once"];

const normalizeTime = (value) => {
    if (typeof value !== "string") return null;
    const input = value.trim();
    const twelveHour = input.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i);
    if (twelveHour) {
        return `${String(Number(twelveHour[1])).padStart(2, "0")}:${twelveHour[2]} ${twelveHour[3].toUpperCase()}`;
    }
    const twentyFourHour = input.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!twentyFourHour) return null;
    const hour = Number(twentyFourHour[1]);
    const suffix = hour >= 12 ? "PM" : "AM";
    return `${String(hour % 12 || 12).padStart(2, "0")}:${twentyFourHour[2]} ${suffix}`;
};

const isValidReminderDate = (value) => {
    if (value === "Today" || value === "Tomorrow") return true;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const getReminderFields = (body) => Object.fromEntries(
    reminderFields
        .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
        .map((field) => [field, body[field]])
);

const validateReminder = (fields, { creating = false } = {}) => {
    if (fields.title !== undefined
        && (typeof fields.title !== "string"
            || !fields.title.trim()
            || fields.title.length > 120
            || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(fields.title))) {
        return "title must be non-empty text of at most 120 characters.";
    }
    if (fields.notes !== undefined
        && (typeof fields.notes !== "string"
            || fields.notes.length > 1000
            || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(fields.notes))) {
        return "notes must be text of at most 1000 characters.";
    }
    if (creating && (!fields.title || !fields.category || !fields.time || !fields.date || !fields.repeat)) {
        return "Title, category, time, date, and repeat schedule are required.";
    }
    if (fields.category !== undefined && !reminderCategories.includes(fields.category)) {
        return "Category is not supported.";
    }
    if (fields.time !== undefined && !normalizeTime(fields.time)) {
        return "Time must use 24-hour HH:MM or 12-hour HH:MM AM/PM format.";
    }
    if (fields.date !== undefined && !isValidReminderDate(fields.date)) {
        return "Date must be Today, Tomorrow, or a valid YYYY-MM-DD date.";
    }
    if (fields.repeat !== undefined && !repeatSchedules.includes(fields.repeat)) {
        return "Repeat must be Daily, Weekly, Monthly, or Once.";
    }
    if (fields.completed !== undefined && typeof fields.completed !== "boolean") {
        return "Completed must be a boolean.";
    }
    return null;
};

const normalizeReminderFields = (fields) => ({
    ...fields,
    ...(fields.time !== undefined ? { time: normalizeTime(fields.time) } : {}),
    ...(fields.title !== undefined ? { title: fields.title.trim() } : {}),
    ...(fields.notes !== undefined ? { notes: fields.notes.trim() } : {})
});

const getOwnedReminder = async (id, userId) => {
    if (!mongoose.isValidObjectId(id)) return null;
    return Reminder.findOne({ _id: id, user: userId });
};

// GET /api/reminders — get user's reminders
const getReminders = async (req, res) => {
    try {
        const reminders = await Reminder.find({ user: req.user._id })
            .sort({ completed: 1, createdAt: -1 });
        res.status(200).json({ success: true, count: reminders.length, data: reminders });
    } catch (error) {
        logInternalError("Get reminders", error);
        res.status(500).json({ success: false, message: "Could not retrieve reminders." });
    }
};

// GET /api/reminders/:id — get one of the user's reminders
const getReminder = async (req, res) => {
    try {
        const reminder = await getOwnedReminder(req.params.id, req.user._id);
        if (!reminder) {
            return res.status(404).json({ success: false, message: "Reminder not found." });
        }
        res.status(200).json({ success: true, data: reminder });
    } catch (error) {
        logInternalError("Get reminder", error);
        res.status(500).json({ success: false, message: "Could not retrieve the reminder." });
    }
};

// POST /api/reminders — create new reminder
const createReminder = async (req, res) => {
    try {
        const fields = getReminderFields(req.body || {});
        const validationError = validateReminder(fields, { creating: true });
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const reminder = await Reminder.create({
            ...normalizeReminderFields(fields),
            user: req.user._id,
            completed: false
        });
        res.status(201).json({ success: true, data: reminder });
    } catch (error) {
        logInternalError("Create reminder", error);
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ success: false, message: "Reminder details are invalid." });
        }
        res.status(500).json({ success: false, message: "Could not save the reminder." });
    }
};

// PUT /api/reminders/:id — update a reminder owned by the logged-in user
const updateReminder = async (req, res) => {
    try {
        const reminder = await getOwnedReminder(req.params.id, req.user._id);
        if (!reminder) {
            return res.status(404).json({ success: false, message: "Reminder not found." });
        }

        const fields = getReminderFields(req.body || {});
        if (Object.keys(fields).length === 0) {
            return res.status(400).json({ success: false, message: "Provide at least one reminder field to update." });
        }
        const validationError = validateReminder(fields);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const updatedReminder = await Reminder.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: normalizeReminderFields(fields) },
            { new: true, runValidators: true }
        );
        if (!updatedReminder) {
            return res.status(404).json({ success: false, message: "Reminder not found." });
        }
        res.status(200).json({ success: true, data: updatedReminder });
    } catch (error) {
        logInternalError("Update reminder", error);
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ success: false, message: "Reminder details are invalid." });
        }
        res.status(500).json({ success: false, message: "Could not update the reminder." });
    }
};

// PATCH /api/reminders/:id/toggle — toggle or set reminder completion
const toggleReminder = async (req, res) => {
    try {
        const reminder = await getOwnedReminder(req.params.id, req.user._id);
        if (!reminder) {
            return res.status(404).json({ success: false, message: "Reminder not found." });
        }
        if (req.body?.completed !== undefined && typeof req.body.completed !== "boolean") {
            return res.status(400).json({ success: false, message: "Completed must be a boolean." });
        }

        reminder.completed = typeof req.body?.completed === "boolean"
            ? req.body.completed
            : !reminder.completed;
        await reminder.save();
        res.status(200).json({ success: true, data: reminder });
    } catch (error) {
        logInternalError("Update reminder", error);
        res.status(500).json({ success: false, message: "Could not update the reminder." });
    }
};

// DELETE /api/reminders/:id — delete reminder
const deleteReminder = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: "Reminder not found." });
        }
        const reminder = await Reminder.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });
        if (!reminder) {
            return res.status(404).json({ success: false, message: "Reminder not found." });
        }
        res.status(200).json({ success: true, message: "Reminder deleted." });
    } catch (error) {
        logInternalError("Delete reminder", error);
        res.status(500).json({ success: false, message: "Could not delete the reminder." });
    }
};

module.exports = { createReminder, deleteReminder, getReminder, getReminders, toggleReminder, updateReminder };
