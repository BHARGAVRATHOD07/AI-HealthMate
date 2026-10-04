const Reminder = require("../models/Reminder");

// GET /api/reminders — get user's reminders
const getReminders = async (req, res) => {
    try {
        const reminders = await Reminder.find({ user: req.user._id })
            .sort({ completed: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reminders.length,
            data: reminders
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/reminders — create new reminder
const createReminder = async (req, res) => {
    try {
        const { title, category, time, date, repeat, notes } = req.body;

        if (!title || !time) {
            return res.status(400).json({
                success: false,
                message: "Title and time are required."
            });
        }

        const reminder = await Reminder.create({
            user: req.user._id,
            title,
            category: category || "General",
            time,
            date: date || "Today",
            repeat: repeat || "Daily",
            notes: notes || "",
            completed: false
        });

        res.status(201).json({
            success: true,
            data: reminder
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /api/reminders/:id/toggle — toggle reminder completion
const toggleReminder = async (req, res) => {
    try {
        const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });

        if (!reminder) {
            return res.status(404).json({ success: false, message: "Reminder not found." });
        }

        reminder.completed = !reminder.completed;
        await reminder.save();

        res.status(200).json({
            success: true,
            data: reminder
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/reminders/:id — delete reminder
const deleteReminder = async (req, res) => {
    try {
        const reminder = await Reminder.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!reminder) {
            return res.status(404).json({ success: false, message: "Reminder not found." });
        }

        res.status(200).json({ success: true, message: "Reminder deleted." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getReminders, createReminder, toggleReminder, deleteReminder };
